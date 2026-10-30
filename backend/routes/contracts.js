const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Contract = require('../models/Contract');
const Room = require('../models/Room');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// File lưu trữ dự phòng khi MongoDB chưa kết nối (offline development)
const FALLBACK_CONTRACTS_FILE = path.join(__dirname, '../fallback_contracts.json');

const loadFallbackContracts = () => {
    try {
        if (fs.existsSync(FALLBACK_CONTRACTS_FILE)) {
            const data = fs.readFileSync(FALLBACK_CONTRACTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        // silent fail
    }
    return [];
};

const saveFallbackContracts = (contracts) => {
    try {
        fs.writeFileSync(FALLBACK_CONTRACTS_FILE, JSON.stringify(contracts, null, 2), 'utf8');
    } catch (e) {
        // silent fail
    }
};

// Helper chuẩn hóa so sánh ID giữa ObjectId và String
const isSameId = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
};

// Helper tính số ngày còn lại đến ngày kết thúc hợp đồng
const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

// ==========================================
// 1. LẤY DANH SÁCH PHÒNG ĐỂ CHỌN KHI TẠO HỢP ĐỒNG
// ==========================================
router.get('/lookup/rooms', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = (req.user.email || '').toLowerCase();
        const userPhone = req.user.phone ? String(req.user.phone).trim() : null;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const orConditions = [];
            if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
                orConditions.push({ owner: currentUserId });
            }
            if (currentUserEmail) {
                orConditions.push({ ownerEmail: { $regex: new RegExp(`^${currentUserEmail}$`, 'i') } });
            }
            if (userPhone) {
                orConditions.push({ contactPhone: userPhone });
            }
            const query = isAdmin ? {} : (orConditions.length > 0 ? { $or: orConditions } : { ownerEmail: '__none__' });
            const rooms = await Room.find(query).select('title address price status area_sqm campus contactPhone');
            return res.status(200).json({ success: true, data: rooms });
        }

        // Fallback local mode
        const fallbackRooms = req.app.locals.fallbackRooms || [];
        const rooms = isAdmin ? fallbackRooms : fallbackRooms.filter(r => 
            isSameId(r.owner, currentUserId) || 
            (r.ownerEmail && r.ownerEmail.toLowerCase() === currentUserEmail) ||
            (userPhone && r.contactPhone && String(r.contactPhone).trim() === userPhone)
        );
        return res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách phòng trọ: ' + error.message });
    }
});

// ==========================================
// 2. LẤY DANH SÁCH KHÁCH THUÊ / SINH VIÊN ĐỂ CHỌN
// ==========================================
router.get('/lookup/tenants', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        if (isDbConnected) {
            const tenants = await User.find({ role: { $in: ['student', 'tenant'] } })
                .select('fullName email phone campus studentId avatar');
            return res.status(200).json({ success: true, data: tenants });
        }

        // Fallback local mode
        const fallbackUsers = req.app.locals.fallbackUsers || [];
        const tenants = fallbackUsers
            .filter(u => u.role === 'student' || u.role === 'tenant')
            .map(u => ({
                _id: u._id || u.id,
                fullName: u.fullName,
                email: u.email,
                phone: u.phone || '',
                campus: u.campus || 'FPT Can Tho',
                studentId: u.studentId || ''
            }));
        return res.status(200).json({ success: true, data: tenants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách khách thuê: ' + error.message });
    }
});

// ==========================================
// 3. GET /api/contracts - LẤY DANH SÁCH HỢP ĐỒNG (LỌC, TÌM KIẾM, PHÂN TRANG)
// ==========================================
router.get('/', protect, async (req, res) => {
    try {
        const { status, q, page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, parseInt(limit, 10));
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = (req.user.email || '').toLowerCase();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isStudent = req.user.role === 'student';

        if (isDbConnected) {
            let filter = {};
            if (isStudent) {
                filter = { tenant: currentUserId };
            } else if (!isAdmin) {
                filter = {
                    $or: [
                        { landlord: currentUserId },
                        ...(currentUserEmail ? [{ landlordEmail: currentUserEmail }] : [])
                    ]
                };
            }

            // Lọc theo trạng thái
            if (status && status !== 'all') {
                if (status === 'expiring_soon') {
                    // Sắp hết hạn trong vòng 30 ngày
                    const now = new Date();
                    const next30Days = new Date();
                    next30Days.setDate(now.getDate() + 30);
                    filter.status = 'active';
                    filter.endDate = { $gte: now, $lte: next30Days };
                } else if (status === 'unpaid_deposit') {
                    filter.status = 'active';
                    filter['deposit.status'] = 'unpaid';
                } else {
                    filter.status = status;
                }
            }

            // Tìm kiếm theo từ khóa (tên khách, phòng, số điện thoại)
            let contracts = await Contract.find(filter)
                .populate('room', 'title address price campus status')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone')
                .sort({ createdAt: -1 });

            if (q && q.trim()) {
                const keyword = q.trim().toLowerCase();
                contracts = contracts.filter(c => {
                    const roomTitle = c.room?.title?.toLowerCase() || '';
                    const roomAddress = c.room?.address?.toLowerCase() || '';
                    const tenantName = c.tenant?.fullName?.toLowerCase() || '';
                    const tenantPhone = c.tenant?.phone || '';
                    const tenantEmail = c.tenant?.email?.toLowerCase() || '';
                    return roomTitle.includes(keyword) || 
                           roomAddress.includes(keyword) || 
                           tenantName.includes(keyword) || 
                           tenantPhone.includes(keyword) ||
                           tenantEmail.includes(keyword);
                });
            }

            // Tính thống kê nhanh cho chủ trọ
            const allMyContracts = await Contract.find(isAdmin ? {} : {
                $or: [
                    { landlord: currentUserId },
                    ...(currentUserEmail ? [{ landlordEmail: currentUserEmail }] : [])
                ]
            });
            const now = Date.now();
            const in30Days = now + 30 * 24 * 60 * 60 * 1000;

            const stats = {
                totalContracts: allMyContracts.length,
                activeCount: allMyContracts.filter(c => c.status === 'active').length,
                expiringSoonCount: allMyContracts.filter(c => {
                    if (c.status !== 'active' || !c.endDate) return false;
                    const endTime = new Date(c.endDate).getTime();
                    return endTime >= now && endTime <= in30Days;
                }).length,
                totalHoldingDeposit: allMyContracts
                    .filter(c => c.status === 'active' && c.deposit?.status === 'paid')
                    .reduce((sum, c) => sum + (c.deposit?.amount || 0), 0),
                unpaidDepositCount: allMyContracts
                    .filter(c => c.status === 'active' && c.deposit?.status === 'unpaid').length
            };

            const total = contracts.length;
            const paginated = contracts.slice((pageNum - 1) * limitNum, pageNum * limitNum);

            return res.status(200).json({
                success: true,
                count: paginated.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum) || 1,
                stats,
                data: paginated
            });
        }

        // ==================== B. CHẾ ĐỘ FALLBACK LOCAL / OFFLINE ====================
        let contracts = loadFallbackContracts();
        if (!isAdmin) {
            // Cách ly hợp đồng chặt chẽ theo từng tài khoản chủ trọ
            contracts = contracts.filter(c => 
                isSameId(c.landlord?._id || c.landlord, currentUserId) ||
                (c.landlord?.email && c.landlord.email.toLowerCase() === req.user?.email?.toLowerCase()) ||
                (req.user?.email === 'chutro@smartstay.vn' && (!c.landlord || c.landlord?.email === 'chutro@smartstay.vn'))
            );
        }

        // Thống kê nhanh
        const nowTime = Date.now();
        const in30DaysTime = nowTime + 30 * 24 * 60 * 60 * 1000;
        const stats = {
            totalContracts: contracts.length,
            activeCount: contracts.filter(c => c.status === 'active').length,
            expiringSoonCount: contracts.filter(c => {
                if (c.status !== 'active' || !c.endDate) return false;
                const endTime = new Date(c.endDate).getTime();
                return endTime >= nowTime && endTime <= in30DaysTime;
            }).length,
            totalHoldingDeposit: contracts
                .filter(c => c.status === 'active' && c.deposit?.status === 'paid')
                .reduce((sum, c) => sum + (c.deposit?.amount || 0), 0),
            unpaidDepositCount: contracts
                .filter(c => c.status === 'active' && c.deposit?.status === 'unpaid').length
        };

        // Lọc trạng thái
        if (status && status !== 'all') {
            if (status === 'expiring_soon') {
                contracts = contracts.filter(c => {
                    if (c.status !== 'active' || !c.endDate) return false;
                    const endTime = new Date(c.endDate).getTime();
                    return endTime >= nowTime && endTime <= in30DaysTime;
                });
            } else if (status === 'unpaid_deposit') {
                contracts = contracts.filter(c => c.status === 'active' && c.deposit?.status === 'unpaid');
            } else {
                contracts = contracts.filter(c => c.status === status);
            }
        }

        // Tìm kiếm
        if (q && q.trim()) {
            const keyword = q.trim().toLowerCase();
            contracts = contracts.filter(c => {
                const roomTitle = (c.room?.title || '').toLowerCase();
                const tenantName = (c.tenant?.fullName || '').toLowerCase();
                const tenantPhone = (c.tenant?.phone || '');
                return roomTitle.includes(keyword) || tenantName.includes(keyword) || tenantPhone.includes(keyword);
            });
        }

        const total = contracts.length;
        const paginated = contracts.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.status(200).json({
            success: true,
            count: paginated.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            stats,
            data: paginated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách hợp đồng: ' + error.message });
    }
});

// ==========================================
// 3.1. GET /api/contracts/my-contracts - LẤY HỢP ĐỒNG CỦA SINH VIÊN ĐANG ĐĂNG NHẬP
// ==========================================
router.get('/my-contracts', protect, async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const userEmail = req.user.email?.toLowerCase();
        const userPhone = req.user.phone;

        if (isDbConnected) {
            let contracts = await Contract.find({ 
                $or: [
                    { tenant: currentUserId },
                    { 'tenant.email': userEmail }
                ]
            })
                .populate('room', 'title address price campus images image_url amenities contactPhone status')
                .populate('landlord', 'fullName email phone')
                .sort({ createdAt: -1 });

            // Nếu là tài khoản Demo sinhvien@smartstay.vn mà trong DB chưa có: Cho phép hiển thị hợp đồng mẫu
            if (contracts.length === 0 && userEmail === 'sinhvien@smartstay.vn') {
                const fallbackList = loadFallbackContracts();
                contracts = fallbackList.filter(c => c.tenant?.email === 'sinhvien@smartstay.vn');
            }

            return res.status(200).json({
                success: true,
                count: contracts.length,
                data: contracts
            });
        }

        // Fallback local mode: Chỉ hiển thị dữ liệu mẫu cho tài khoản demo sinh viên
        if (userEmail === 'sinhvien@smartstay.vn') {
            const contracts = loadFallbackContracts();
            const myContracts = contracts.filter(c => c.tenant?.email === 'sinhvien@smartstay.vn');
            return res.status(200).json({
                success: true,
                count: myContracts.length,
                data: myContracts
            });
        }

        return res.status(200).json({
            success: true,
            count: 0,
            data: []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải hợp đồng của tôi: ' + error.message });
    }
});

// ==========================================
// 4. GET /api/contracts/:id - XEM CHI TIẾT HỢP ĐỒNG
// ==========================================
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: 'Mã hợp đồng không hợp lệ.' });
            }

            const contract = await Contract.findById(id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
            }

            const isLandlord = isSameId(contract.landlord?._id || contract.landlord, currentUserId);
            const isTenant = isSameId(contract.tenant?._id || contract.tenant, currentUserId);

            if (!isAdmin && !isLandlord && !isTenant) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xem hợp đồng này.' });
            }

            return res.status(200).json({ success: true, data: contract });
        }

        // Fallback local mode
        const contracts = loadFallbackContracts();
        const contract = contracts.find(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (!contract) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
        }

        const isLandlord = isSameId(contract.landlord?._id || contract.landlord, currentUserId);
        const isTenant = isSameId(contract.tenant?._id || contract.tenant, currentUserId);

        if (!isAdmin && !isLandlord && !isTenant) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem hợp đồng này.' });
        }

        return res.status(200).json({ success: true, data: contract });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xem chi tiết hợp đồng: ' + error.message });
    }
});

// ==========================================
// 5. POST /api/contracts - TẠO MỚI HỢP ĐỒNG
// ==========================================
router.post('/', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const roomId = req.body.roomId || req.body.room;
        const tenantId = req.body.tenantId || req.body.tenant;
        const startDate = req.body.startDate;
        const durationMonths = req.body.durationMonths;
        const monthlyRent = req.body.monthlyRent;
        const depositAmount = req.body.depositAmount !== undefined ? req.body.depositAmount : req.body.deposit?.amount;
        const paymentDay = req.body.paymentDay || 5;
        const electricPrice = req.body.electricPrice !== undefined ? req.body.electricPrice : 3500;
        const waterPrice = req.body.waterPrice !== undefined ? req.body.waterPrice : 20000;
        const terms = req.body.terms;
        const depositStatus = req.body.depositStatus || req.body.deposit?.status || 'unpaid';
        const paymentMethod = req.body.paymentMethod || req.body.deposit?.paymentMethod || 'transfer';

        // 1. Kiểm tra các trường bắt buộc
        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng trọ.' });
        }
        if (!tenantId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn khách thuê / sinh viên.' });
        }
        if (!startDate) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày bắt đầu hợp đồng.' });
        }
        if (!durationMonths || Number(durationMonths) < 1) {
            return res.status(400).json({ success: false, message: 'Thời hạn hợp đồng tối thiểu là 1 tháng.' });
        }
        if (monthlyRent === undefined || Number(monthlyRent) < 0) {
            return res.status(400).json({ success: false, message: 'Giá thuê hàng tháng không hợp lệ (phải >= 0).' });
        }
        if (depositAmount !== undefined && Number(depositAmount) < 0) {
            return res.status(400).json({ success: false, message: 'Tiền cọc không được âm.' });
        }

        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ success: false, message: 'Ngày bắt đầu hợp đồng không đúng định dạng.' });
        }

        const end = new Date(start);
        end.setMonth(end.getMonth() + Number(durationMonths));

        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected) {
            // Kiểm tra phòng
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Phòng trọ được chọn không tồn tại.' });
            }

            // Kiểm tra khách thuê
            const tenant = await User.findById(tenantId);
            if (!tenant) {
                return res.status(404).json({ success: false, message: 'Tài khoản khách thuê không tồn tại.' });
            }

            // Kiểm tra trùng hợp đồng đang hiệu lực
            const existingActiveContract = await Contract.findOne({
                room: roomId,
                status: { $in: ['active', 'pending'] }
            });

            if (existingActiveContract) {
                return res.status(400).json({
                    success: false,
                    message: 'Phòng trọ này hiện đang có hợp đồng hiệu lực. Vui lòng kết thúc hợp đồng cũ trước khi tạo hợp đồng mới.'
                });
            }

            // Tạo hợp đồng mới
            const newContract = await Contract.create({
                room: roomId,
                tenant: tenantId,
                landlord: currentUserId,
                startDate: start,
                endDate: end,
                durationMonths: Number(durationMonths),
                monthlyRent: Number(monthlyRent),
                paymentDay: Number(paymentDay) || 5,
                electricPrice: Number(electricPrice) || 3500,
                waterPrice: Number(waterPrice) || 20000,
                terms: terms || 'Hai bên cam kết thực hiện đúng nội quy phòng trọ, thanh toán đúng hạn và giữ gìn cơ sở vật chất.',
                deposit: {
                    amount: Number(depositAmount) || 0,
                    status: depositStatus,
                    paidAt: depositStatus === 'paid' ? new Date() : undefined,
                    paymentMethod,
                    deductions: []
                },
                status: 'active'
            });

            // Tự động cập nhật trạng thái phòng sang 'rented'
            room.status = 'rented';
            await room.save();

            const populated = await Contract.findById(newContract._id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            return res.status(201).json({
                success: true,
                message: 'Tạo hợp đồng thuê phòng thành công!',
                data: populated
            });
        }

        // ==================== B. CHẾ ĐỘ FALLBACK LOCAL / OFFLINE ====================
        let contracts = loadFallbackContracts();
        const fallbackRooms = req.app.locals.fallbackRooms || [];
        const fallbackUsers = req.app.locals.fallbackUsers || [];

        const roomObj = fallbackRooms.find(r => isSameId(r._id, roomId) || isSameId(r.id, roomId)) || {
            _id: roomId,
            id: roomId,
            title: `Phòng ${roomId}`,
            address: 'TP. Cần Thơ',
            price: Number(monthlyRent)
        };

        const tenantObj = fallbackUsers.find(u => isSameId(u._id, tenantId) || isSameId(u.id, tenantId)) || {
            _id: tenantId,
            id: tenantId,
            fullName: 'Khách thuê',
            phone: '0901234567',
            email: 'tenant@smartstay.vn'
        };

        const landlordObj = fallbackUsers.find(u => isSameId(u._id, currentUserId) || isSameId(u.id, currentUserId)) || {
            _id: currentUserId,
            fullName: req.user.fullName || 'Chủ nhà trọ',
            email: req.user.email || 'landlord@smartstay.vn'
        };

        const existingActive = contracts.find(c => 
            isSameId(c.room?._id || c.room, roomId) && (c.status === 'active' || c.status === 'pending')
        );

        if (existingActive) {
            return res.status(400).json({
                success: false,
                message: 'Phòng trọ này hiện đang có hợp đồng hiệu lực. Vui lòng kết thúc hợp đồng cũ trước.'
            });
        }

        const newId = `ctr_${Date.now()}`;
        const newContract = {
            _id: newId,
            id: newId,
            room: roomObj,
            tenant: tenantObj,
            landlord: landlordObj,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            durationMonths: Number(durationMonths),
            monthlyRent: Number(monthlyRent),
            paymentDay: Number(paymentDay) || 5,
            electricPrice: Number(electricPrice) || 3500,
            waterPrice: Number(waterPrice) || 20000,
            terms: terms || 'Hai bên cam kết thực hiện đúng nội quy phòng trọ, thanh toán đúng hạn.',
            deposit: {
                amount: Number(depositAmount) || 0,
                status: depositStatus,
                paidAt: depositStatus === 'paid' ? new Date().toISOString() : null,
                paymentMethod,
                refundedAmount: 0,
                deductions: [],
                note: ''
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        contracts.unshift(newContract);
        saveFallbackContracts(contracts);

        // Đổi trạng thái phòng trong fallback
        if (roomObj) roomObj.status = 'rented';

        res.status(201).json({
            success: true,
            message: 'Tạo hợp đồng thuê phòng thành công (Local Dev)!',
            data: newContract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo hợp đồng: ' + error.message });
    }
});

// ==========================================
// 6. PUT /api/contracts/:id - CẬP NHẬT THÔNG TIN HỢP ĐỒNG
// ==========================================
router.put('/:id', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;
        const {
            monthlyRent,
            paymentDay,
            electricPrice,
            waterPrice,
            terms,
            depositAmount
        } = req.body;

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
            }

            if (!isAdmin && !isSameId(contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa hợp đồng này.' });
            }

            if (monthlyRent !== undefined) contract.monthlyRent = Number(monthlyRent);
            if (paymentDay !== undefined) contract.paymentDay = Number(paymentDay);
            if (electricPrice !== undefined) contract.electricPrice = Number(electricPrice);
            if (waterPrice !== undefined) contract.waterPrice = Number(waterPrice);
            if (terms !== undefined) contract.terms = terms;
            if (depositAmount !== undefined && contract.deposit) {
                contract.deposit.amount = Number(depositAmount);
            }

            await contract.save();
            const populated = await Contract.findById(id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            return res.status(200).json({
                success: true,
                message: 'Cập nhật hợp đồng thành công!',
                data: populated
            });
        }

        // Fallback local mode
        const contracts = loadFallbackContracts();
        const idx = contracts.findIndex(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
        }

        const contract = contracts[idx];
        if (!isAdmin && !isSameId(contract.landlord?._id || contract.landlord, currentUserId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa hợp đồng này.' });
        }

        if (monthlyRent !== undefined) contract.monthlyRent = Number(monthlyRent);
        if (paymentDay !== undefined) contract.paymentDay = Number(paymentDay);
        if (electricPrice !== undefined) contract.electricPrice = Number(electricPrice);
        if (waterPrice !== undefined) contract.waterPrice = Number(waterPrice);
        if (terms !== undefined) contract.terms = terms;
        if (depositAmount !== undefined && contract.deposit) {
            contract.deposit.amount = Number(depositAmount);
        }
        contract.updatedAt = new Date().toISOString();

        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: 'Cập nhật hợp đồng thành công (Local Dev)!',
            data: contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật hợp đồng: ' + error.message });
    }
});

// ==========================================
// 7. PATCH /api/contracts/:id/deposit - CẬP NHẬT TRẠNG THÁI THU CỌC
// ==========================================
router.patch('/:id/deposit', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;
        const { status, amount, paymentMethod, paidAt, note } = req.body;

        const validStatuses = ['unpaid', 'paid', 'refunded', 'partial_refund', 'withheld'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái tiền cọc không hợp lệ.' });
        }

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
            }

            if (!isAdmin && !isSameId(contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật tiền cọc hợp đồng này.' });
            }

            if (!contract.deposit) contract.deposit = {};
            if (status) contract.deposit.status = status;
            if (amount !== undefined) contract.deposit.amount = Number(amount);
            if (paymentMethod) contract.deposit.paymentMethod = paymentMethod;
            if (note !== undefined) contract.deposit.note = note;

            if (status === 'paid' && !contract.deposit.paidAt) {
                contract.deposit.paidAt = paidAt ? new Date(paidAt) : new Date();
            }

            await contract.save();
            const populated = await Contract.findById(id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            return res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái tiền cọc thành công!',
                data: populated
            });
        }

        // Fallback local mode
        const contracts = loadFallbackContracts();
        const idx = contracts.findIndex(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
        }

        const contract = contracts[idx];
        if (!isAdmin && !isSameId(contract.landlord?._id || contract.landlord, currentUserId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật hợp đồng này.' });
        }

        if (!contract.deposit) contract.deposit = {};
        if (status) contract.deposit.status = status;
        if (amount !== undefined) contract.deposit.amount = Number(amount);
        if (paymentMethod) contract.deposit.paymentMethod = paymentMethod;
        if (note !== undefined) contract.deposit.note = note;
        if (status === 'paid') contract.deposit.paidAt = paidAt || new Date().toISOString();
        contract.updatedAt = new Date().toISOString();

        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái tiền cọc thành công (Local Dev)!',
            data: contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật tiền cọc: ' + error.message });
    }
});

// ==========================================
// 8. POST /api/contracts/:id/end - KẾT THÚC HỢP ĐỒNG & HOÀN CỌC
// ==========================================
router.post('/:id/end', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;
        const { deductions = [], note = '' } = req.body;

        // Tính tổng tiền khấu trừ
        let totalDeductions = 0;
        const formattedDeductions = [];

        if (Array.isArray(deductions)) {
            for (const d of deductions) {
                const amt = Number(d.amount) || 0;
                if (amt < 0) {
                    return res.status(400).json({ success: false, message: 'Số tiền khấu trừ không được âm.' });
                }
                if (amt > 0) {
                    totalDeductions += amt;
                    formattedDeductions.push({
                        reason: d.reason ? d.reason.trim() : 'Khấu trừ hư hại / tiền phòng còn thiếu',
                        amount: amt
                    });
                }
            }
        }

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
            }

            if (!isAdmin && !isSameId(contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền kết thúc hợp đồng này.' });
            }

            const initialDeposit = contract.deposit?.amount || 0;
            const refundedAmount = Math.max(0, initialDeposit - totalDeductions);

            // Xác định trạng thái cọc sau khi hoàn
            let newDepositStatus = 'refunded';
            if (totalDeductions > 0) {
                newDepositStatus = refundedAmount > 0 ? 'partial_refund' : 'withheld';
            }

            contract.status = 'ended';
            contract.deposit.refundedAmount = refundedAmount;
            contract.deposit.deductions = formattedDeductions;
            contract.deposit.status = newDepositStatus;
            if (note) contract.deposit.note = note;

            await contract.save();

            // Đưa phòng về trạng thái trống (available)
            if (contract.room) {
                await Room.findByIdAndUpdate(contract.room, { status: 'available' });
            }

            const populated = await Contract.findById(id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            return res.status(200).json({
                success: true,
                message: `Kết thúc hợp đồng thành công! Tiền cọc hoàn lại cho khách: ${refundedAmount.toLocaleString('vi-VN')} VNĐ.`,
                calculation: {
                    initialDeposit,
                    totalDeductions,
                    refundedAmount,
                    depositStatus: newDepositStatus
                },
                data: populated
            });
        }

        // Fallback local mode
        const contracts = loadFallbackContracts();
        const idx = contracts.findIndex(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
        }

        const contract = contracts[idx];
        if (!isAdmin && !isSameId(contract.landlord?._id || contract.landlord, currentUserId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác hợp đồng này.' });
        }

        const initialDeposit = contract.deposit?.amount || 0;
        const refundedAmount = Math.max(0, initialDeposit - totalDeductions);
        let newDepositStatus = 'refunded';
        if (totalDeductions > 0) {
            newDepositStatus = refundedAmount > 0 ? 'partial_refund' : 'withheld';
        }

        contract.status = 'ended';
        contract.deposit = {
            ...contract.deposit,
            refundedAmount,
            deductions: formattedDeductions,
            status: newDepositStatus,
            note: note || contract.deposit?.note || ''
        };
        contract.updatedAt = new Date().toISOString();

        // Đưa phòng về trạng thái trống
        const fallbackRooms = req.app.locals.fallbackRooms || [];
        const roomId = contract.room?._id || contract.room?.id || contract.room;
        const roomObj = fallbackRooms.find(r => isSameId(r._id, roomId) || isSameId(r.id, roomId));
        if (roomObj) roomObj.status = 'available';

        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: `Kết thúc hợp đồng thành công (Local Dev)! Hoàn cọc: ${refundedAmount.toLocaleString('vi-VN')} VNĐ.`,
            calculation: {
                initialDeposit,
                totalDeductions,
                refundedAmount,
                depositStatus: newDepositStatus
            },
            data: contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi kết thúc hợp đồng: ' + error.message });
    }
});

// ==========================================
// 9. POST /api/contracts/:id/renew - GIA HẠN HỢP ĐỒNG
// ==========================================
router.post('/:id/renew', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';
        const isDbConnected = req.app.locals.isDbConnected;
        const { additionalMonths } = req.body;

        const monthsToAdd = Number(additionalMonths);
        if (!monthsToAdd || monthsToAdd < 1) {
            return res.status(400).json({ success: false, message: 'Số tháng gia hạn phải lớn hơn hoặc bằng 1.' });
        }

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
            }

            if (!isAdmin && !isSameId(contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền gia hạn hợp đồng này.' });
            }

            const currentEnd = contract.endDate ? new Date(contract.endDate) : new Date();
            // Nếu hợp đồng đã hết hạn trước đó, tính gia hạn từ hôm nay
            const baseDate = currentEnd.getTime() < Date.now() ? new Date() : currentEnd;
            baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

            contract.endDate = baseDate;
            contract.durationMonths = (contract.durationMonths || 0) + monthsToAdd;
            contract.status = 'active';

            await contract.save();

            // Đảm bảo phòng vẫn ở trạng thái rented
            if (contract.room) {
                await Room.findByIdAndUpdate(contract.room, { status: 'rented' });
            }

            const populated = await Contract.findById(id)
                .populate('room')
                .populate('tenant', 'fullName email phone studentId campus avatar')
                .populate('landlord', 'fullName email phone');

            return res.status(200).json({
                success: true,
                message: `Gia hạn hợp đồng thêm ${monthsToAdd} tháng thành công! Ngày kết thúc mới: ${baseDate.toLocaleDateString('vi-VN')}.`,
                data: populated
            });
        }

        // Fallback local mode
        const contracts = loadFallbackContracts();
        const idx = contracts.findIndex(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
        }

        const contract = contracts[idx];
        if (!isAdmin && !isSameId(contract.landlord?._id || contract.landlord, currentUserId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác hợp đồng này.' });
        }

        const currentEnd = contract.endDate ? new Date(contract.endDate) : new Date();
        const baseDate = currentEnd.getTime() < Date.now() ? new Date() : currentEnd;
        baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

        contract.endDate = baseDate.toISOString();
        contract.durationMonths = (contract.durationMonths || 0) + monthsToAdd;
        contract.status = 'active';
        contract.updatedAt = new Date().toISOString();

        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: `Gia hạn hợp đồng thêm ${monthsToAdd} tháng thành công (Local Dev)! Ngày kết thúc mới: ${baseDate.toLocaleDateString('vi-VN')}.`,
            data: contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi gia hạn hợp đồng: ' + error.message });
    }
});

// ==========================================
// 8. BIÊN BẢN BÀN GIAO TÀI SẢN (HANDOVER INVENTORY)
// ==========================================

// Thêm thiết bị / tài sản bàn giao vào hợp đồng
router.post('/:id/inventory', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const { item, condition, quantity, photoUrl } = req.body;
        const isDbConnected = req.app.locals.isDbConnected;

        if (!item) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên thiết bị / tài sản bàn giao.' });
        }

        const newItem = {
            item,
            condition: condition || 'Mới / Hoạt động tốt',
            quantity: Number(quantity) || 1,
            photoUrl: photoUrl || '',
            verifiedByTenant: false
        };

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

            contract.handoverInventory.push(newItem);
            await contract.save();

            return res.status(201).json({
                success: true,
                message: 'Đã thêm tài sản vào biên bản bàn giao.',
                data: contract.handoverInventory
            });
        }

        const contracts = loadFallbackContracts();
        const contract = contracts.find(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

        contract.handoverInventory = contract.handoverInventory || [];
        contract.handoverInventory.push({ ...newItem, _id: 'inv_' + Date.now() });
        saveFallbackContracts(contracts);

        res.status(201).json({
            success: true,
            message: 'Đã thêm tài sản vào biên bản bàn giao (Local Dev).',
            data: contract.handoverInventory
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thêm tài sản bàn giao: ' + error.message });
    }
});

// Sinh viên xác nhận tình trạng tài sản khi nhận phòng
router.patch('/:id/inventory/:itemId/verify', protect, async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

            // Chỉ người thuê hoặc chủ nhà/admin mới được xác nhận
            const isTenant = isSameId(contract.tenant, currentUserId);
            const isOwner = isSameId(contract.landlord, currentUserId);
            const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

            if (!isTenant && !isOwner && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận tài sản này.' });
            }

            const item = contract.handoverInventory.id(itemId);
            if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản trong biên bản.' });

            item.verifiedByTenant = true;
            item.verifiedAt = new Date();
            await contract.save();

            return res.status(200).json({
                success: true,
                message: 'Khách thuê đã xác nhận tình trạng tài sản bàn giao.',
                data: item
            });
        }

        const contracts = loadFallbackContracts();
        const contract = contracts.find(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

        const item = (contract.handoverInventory || []).find(i => isSameId(i._id, itemId));
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản trong biên bản.' });

        item.verifiedByTenant = true;
        item.verifiedAt = new Date().toISOString();
        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: 'Đã xác nhận tình trạng tài sản (Local Dev).',
            data: item
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xác nhận tài sản: ' + error.message });
    }
});

// Lưu ảnh hiện trạng bàn giao phòng lúc Check-in & Check-out
router.post('/:id/handover-photos', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, photos } = req.body; // type: 'checkin' | 'checkout', photos: array of URLs
        const isDbConnected = req.app.locals.isDbConnected;

        if (!Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách ảnh hiện trạng.' });
        }

        if (isDbConnected) {
            const contract = await Contract.findById(id);
            if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

            if (type === 'checkout') {
                contract.checkoutPhotos = [...(contract.checkoutPhotos || []), ...photos];
                contract.checkoutConfirmed = true;
            } else {
                contract.checkinPhotos = [...(contract.checkinPhotos || []), ...photos];
                contract.checkinConfirmed = true;
            }
            await contract.save();

            return res.status(200).json({
                success: true,
                message: `Đã lưu ảnh hiện trạng ${type === 'checkout' ? 'trả phòng (Check-out)' : 'nhận phòng (Check-in)'}.`,
                data: contract
            });
        }

        const contracts = loadFallbackContracts();
        const contract = contracts.find(c => isSameId(c._id, id) || isSameId(c.id, id));
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

        if (type === 'checkout') {
            contract.checkoutPhotos = [...(contract.checkoutPhotos || []), ...photos];
            contract.checkoutConfirmed = true;
        } else {
            contract.checkinPhotos = [...(contract.checkinPhotos || []), ...photos];
            contract.checkinConfirmed = true;
        }
        saveFallbackContracts(contracts);

        res.status(200).json({
            success: true,
            message: `Đã lưu ảnh hiện trạng (Local Dev).`,
            data: contract
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lưu ảnh hiện trạng: ' + error.message });
    }
});

module.exports = router;

