const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const PassRoom = require('../models/PassRoom');
const User = require('../models/User');
const { protect, checkRoomOwnership } = require('../middleware/auth');
const { uploadPassImages } = require('../middleware/passUpload');
const { generateConfirmationToken, hashToken } = require('../utils/passToken');
const { sendLandlordPassEmail } = require('../utils/sendEmail');
const { createNotification } = require('../utils/notify');

const FALLBACK_PASS_FILE = path.join(__dirname, '../fallback_pass_rooms.json');

// Helper đọc và ghi fallback pass rooms
const loadFallbackPassRooms = () => {
    try {
        if (fs.existsSync(FALLBACK_PASS_FILE)) {
            return JSON.parse(fs.readFileSync(FALLBACK_PASS_FILE, 'utf8'));
        }
    } catch (e) {
        console.warn('⚠️ Không đọc được fallback_pass_rooms.json:', e.message);
    }
    return [];
};

const saveFallbackPassRooms = (data) => {
    try {
        fs.writeFileSync(FALLBACK_PASS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.warn('⚠️ Lỗi ghi fallback_pass_rooms.json:', e.message);
    }
};

// Chống đếm trùng viewCount đơn giản trong 15 phút theo IP + PassRoomId
const recentViews = new Map();
const shouldIncrementView = (ip, roomId) => {
    const key = `${ip}_${roomId}`;
    const now = Date.now();
    const lastView = recentViews.get(key);
    if (lastView && now - lastView < 15 * 60 * 1000) {
        return false;
    }
    recentViews.set(key, now);
    // Dọn dẹp cache nếu quá 1000 mục
    if (recentViews.size > 1000) {
        const firstKey = recentViews.keys().next().value;
        recentViews.delete(firstKey);
    }
    return true;
};

// Helper ẩn thông tin bảo mật khi trả về công khai
const sanitizePublicPassRoom = (room, isOwnerOrAdmin = false) => {
    const r = room.toObject ? room.toObject() : { ...room };
    if (!isOwnerOrAdmin) {
        delete r.landlordPhone;
        delete r.landlordEmail;
        delete r.reports;
        if (r.landlordConfirmation) {
            delete r.landlordConfirmation.tokenHash;
        }
    }
    if (r.landlordConfirmation) {
        delete r.landlordConfirmation.tokenHash;
    }
    r.savingsAmount = Math.max(0, (Number(r.depositAmount) || 0) - (Number(r.passPrice) || 0));
    return r;
};

// ==========================================
// 1. DANH SÁCH PHÒNG PASS (Công khai, Lọc, Tìm kiếm, Sắp xếp, Phân trang)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const {
            q,
            campus,
            minPrice,
            maxPrice,
            minMonths,
            maxMonths,
            verifiedOnly,
            flexibleMoveIn,
            sort = 'latest',
            page = 1,
            limit = 12
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
        const skip = (pageNum - 1) * limitNum;

        if (isDbConnected) {
            const query = {
                status: verifiedOnly === 'true' ? 'verified' : { $in: ['verified', 'pending_landlord'] }
            };

            if (q && q.trim()) {
                const searchRegex = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
                query.$or = [
                    { title: searchRegex },
                    { address: searchRegex },
                    { description: searchRegex }
                ];
            }

            if (campus && campus !== 'Tất cả' && campus !== 'Tất cả khu vực') {
                query.campus = campus;
            }

            if (minPrice || maxPrice) {
                query.passPrice = {};
                if (minPrice) query.passPrice.$gte = Number(minPrice);
                if (maxPrice) query.passPrice.$lte = Number(maxPrice);
            }

            if (minMonths || maxMonths) {
                query.remainingMonths = {};
                if (minMonths) query.remainingMonths.$gte = Number(minMonths);
                if (maxMonths) query.remainingMonths.$lte = Number(maxMonths);
            }

            if (flexibleMoveIn === 'true') {
                query.isFlexibleMoveIn = true;
            }

            // Sắp xếp
            let sortOptions = { createdAt: -1 };
            if (sort === 'price_asc') sortOptions = { passPrice: 1 };
            if (sort === 'price_desc') sortOptions = { passPrice: -1 };
            if (sort === 'months_desc') sortOptions = { remainingMonths: -1 };

            const total = await PassRoom.countDocuments(query);
            const rooms = await PassRoom.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .select('-landlordConfirmation.tokenHash -landlordPhone -landlordEmail');

            const sanitized = rooms.map(r => sanitizePublicPassRoom(r, false));

            return res.status(200).json({
                success: true,
                count: sanitized.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                data: sanitized
            });
        }

        // Chế độ Fallback JSON
        let fallbackList = loadFallbackPassRooms();

        // Chỉ hiện verified hoặc pending_landlord cho người xem
        fallbackList = fallbackList.filter(r => {
            if (verifiedOnly === 'true') return r.status === 'verified';
            return r.status === 'verified' || r.status === 'pending_landlord';
        });

        if (q && q.trim()) {
            const term = q.trim().toLowerCase();
            fallbackList = fallbackList.filter(r =>
                (r.title && r.title.toLowerCase().includes(term)) ||
                (r.address && r.address.toLowerCase().includes(term)) ||
                (r.description && r.description.toLowerCase().includes(term))
            );
        }

        if (campus && campus !== 'Tất cả' && campus !== 'Tất cả khu vực') {
            fallbackList = fallbackList.filter(r => r.campus === campus || (r.campus && r.campus.includes(campus)));
        }

        if (minPrice) fallbackList = fallbackList.filter(r => Number(r.passPrice) >= Number(minPrice));
        if (maxPrice) fallbackList = fallbackList.filter(r => Number(r.passPrice) <= Number(maxPrice));
        if (minMonths) fallbackList = fallbackList.filter(r => Number(r.remainingMonths) >= Number(minMonths));
        if (maxMonths) fallbackList = fallbackList.filter(r => Number(r.remainingMonths) <= Number(maxMonths));
        if (flexibleMoveIn === 'true') fallbackList = fallbackList.filter(r => Boolean(r.isFlexibleMoveIn));

        // Sắp xếp
        if (sort === 'price_asc') {
            fallbackList.sort((a, b) => Number(a.passPrice) - Number(b.passPrice));
        } else if (sort === 'price_desc') {
            fallbackList.sort((a, b) => Number(b.passPrice) - Number(a.passPrice));
        } else if (sort === 'months_desc') {
            fallbackList.sort((a, b) => Number(b.remainingMonths) - Number(a.remainingMonths));
        } else {
            fallbackList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        const total = fallbackList.length;
        const paged = fallbackList.slice(skip, skip + limitNum).map(r => sanitizePublicPassRoom(r, false));

        res.status(200).json({
            success: true,
            count: paged.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            data: paged
        });
    } catch (error) {
        console.error('Error fetching pass rooms:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách pass phòng', error: error.message });
    }
});

// ==========================================
// 2. LẤY DANH SÁCH TIN CỦA TÔI (/my-listings)
// ==========================================
router.get('/my/listings', protect, async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const userId = req.user._id || req.user.id;

        if (isDbConnected) {
            const myRooms = await PassRoom.find({ owner: userId }).sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                count: myRooms.length,
                data: myRooms.map(r => sanitizePublicPassRoom(r, true))
            });
        }

        const fallbackList = loadFallbackPassRooms();
        const myRooms = fallbackList.filter(r => String(r.owner) === String(userId) || (req.user.email && r.ownerEmail === req.user.email));

        res.status(200).json({
            success: true,
            count: myRooms.length,
            data: myRooms.map(r => sanitizePublicPassRoom(r, true))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách tin của bạn', error: error.message });
    }
});

// ==========================================
// 3. CHI TIẾT PHÒNG PASS (Tăng viewCount)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        let room = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            room = await PassRoom.findById(id).populate('owner', 'fullName email phone isVerified avatar');
        }

        if (!room) {
            const fallbackList = loadFallbackPassRooms();
            room = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin pass phòng.' });
        }

        // Chống đếm trùng viewCount
        if (shouldIncrementView(clientIp, id)) {
            if (isDbConnected && room._id) {
                await PassRoom.findByIdAndUpdate(room._id, { $inc: { viewCount: 1 } });
                room.viewCount = (room.viewCount || 0) + 1;
            } else {
                const fallbackList = loadFallbackPassRooms();
                const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
                if (idx !== -1) {
                    fallbackList[idx].viewCount = (fallbackList[idx].viewCount || 0) + 1;
                    saveFallbackPassRooms(fallbackList);
                }
                room.viewCount = (room.viewCount || 0) + 1;
            }
        }

        // Kiểm tra quyền: nếu là owner hoặc admin thì xem được thông tin chủ trọ
        let isOwnerOrAdmin = false;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const { JWT_SECRET } = require('../middleware/auth');
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && (decoded.role === 'admin' || String(decoded.id) === String(room.owner?._id || room.owner))) {
                    isOwnerOrAdmin = true;
                }
            } catch (e) {
                // Ignore token error for public view
            }
        }

        res.status(200).json({
            success: true,
            data: sanitizePublicPassRoom(room, isOwnerOrAdmin)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải chi tiết pass phòng', error: error.message });
    }
});

// ==========================================
// 4. ĐĂNG PASS PHÒNG (Bắt buộc đăng nhập, upload nhiều ảnh, sinh token xác nhận 72h)
// ==========================================
router.post('/', protect, uploadPassImages.array('imageFiles', 8), async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        const {
            title,
            description,
            address,
            campus,
            area_sqm,
            room_type,
            monthlyRent,
            passPrice,
            depositAmount,
            remainingMonths,
            moveInDate,
            isFlexibleMoveIn,
            amenities,
            rules,
            landlordName,
            landlordPhone,
            landlordEmail
        } = req.body;

        // Validation cơ bản
        if (!title || !address || !campus || !monthlyRent || !passPrice || !depositAmount || !remainingMonths) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Tiêu đề, địa chỉ, khu vực, giá thuê, giá pass, tiền cọc, số tháng HĐ).'
            });
        }

        if (!landlordName || !landlordPhone) {
            return res.status(400).json({
                success: false,
                message: 'Bắt buộc cung cấp Họ tên và Số điện thoại chủ trọ để hệ thống xác minh sang nhượng cọc hợp lệ.'
            });
        }

        // Thu thập danh sách ảnh
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(f => `/uploads/pass/${f.filename}`);
        } else if (req.body.images) {
            if (Array.isArray(req.body.images)) imageUrls = req.body.images;
            else if (typeof req.body.images === 'string') imageUrls = [req.body.images];
        }

        // Ảnh mặc định nếu chưa upload
        if (imageUrls.length === 0) {
            imageUrls = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'];
        }

        // Ảnh hợp đồng / biên lai cọc nếu có
        let contractImageUrls = [];
        if (req.body.contractImages) {
            if (Array.isArray(req.body.contractImages)) contractImageUrls = req.body.contractImages;
            else if (typeof req.body.contractImages === 'string') contractImageUrls = [req.body.contractImages];
        } else if (req.body.contractImage) {
            contractImageUrls = [req.body.contractImage];
        }

        // Parse amenities & rules
        let parsedAmenities = [];
        if (amenities) {
            parsedAmenities = Array.isArray(amenities) ? amenities : JSON.parse(typeof amenities === 'string' && amenities.startsWith('[') ? amenities : JSON.stringify([amenities]));
        }

        let parsedRules = [];
        if (rules) {
            parsedRules = Array.isArray(rules) ? rules : JSON.parse(typeof rules === 'string' && rules.startsWith('[') ? rules : JSON.stringify([rules]));
        }

        // Sinh token ngẫu nhiên bảo mật 72 giờ
        const { token, tokenHash, expiresAt } = generateConfirmationToken();

        const passData = {
            title: title.trim(),
            description: (description || '').trim(),
            address: address.trim(),
            campus: campus.trim(),
            area_sqm: Number(area_sqm) || 20,
            room_type: room_type || 'Phòng trọ khép kín',
            images: imageUrls,
            contractImages: contractImageUrls,
            monthlyRent: Number(monthlyRent),
            passPrice: Number(passPrice),
            depositAmount: Number(depositAmount),
            remainingMonths: Number(remainingMonths),
            moveInDate: moveInDate ? new Date(moveInDate) : null,
            isFlexibleMoveIn: Boolean(isFlexibleMoveIn === true || isFlexibleMoveIn === 'true'),
            amenities: parsedAmenities,
            rules: parsedRules,
            landlordName: landlordName.trim(),
            landlordPhone: landlordPhone.trim(),
            landlordEmail: (landlordEmail || '').trim().toLowerCase(),
            status: 'pending_landlord',
            landlordConfirmation: {
                tokenHash,
                expiresAt,
                confirmedAt: null,
                rejectedAt: null,
                note: ''
            },
            owner: currentUserId,
            posterName: req.user.fullName || 'Sinh viên SmartStay',
            posterPhone: req.user.phone || '',
            ownerEmail: req.user.email || '',
            viewCount: 0,
            savedBy: [],
            reports: []
        };

        let createdRoom = null;
        if (isDbConnected) {
            createdRoom = await PassRoom.create(passData);
        } else {
            const fallbackList = loadFallbackPassRooms();
            createdRoom = {
                _id: `pass_${Date.now()}`,
                id: `pass_${Date.now()}`,
                ...passData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            fallbackList.unshift(createdRoom);
            saveFallbackPassRooms(fallbackList);
        }

        // Tạo link xác nhận để gửi email và trả về cho owner
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const confirmationLink = `${baseUrl}/xac-nhan-pass/${token}`;

        // Gửi email cho chủ trọ nếu có landlordEmail
        if (passData.landlordEmail) {
            await sendLandlordPassEmail({
                to: passData.landlordEmail,
                landlordName: passData.landlordName,
                tenantName: passData.posterName,
                roomTitle: passData.title,
                confirmLink: confirmationLink,
                depositAmount: passData.depositAmount,
                monthlyRent: passData.monthlyRent,
                moveInDate: passData.moveInDate ? new Date(passData.moveInDate).toLocaleDateString('vi-VN') : 'Linh hoạt'
            });
        }

        // Tạo thông báo cho chính user
        await createNotification({
            userId: currentUserId,
            title: 'Đăng tin Pass phòng thành công',
            message: `Tin "${passData.title}" đã được tạo. Hãy gửi link xác nhận cho chủ trọ (${passData.landlordName}) để được duyệt công khai!`,
            type: 'system',
            referenceId: String(createdRoom._id || createdRoom.id),
            link: '/pass-phong/cua-toi'
        });

        res.status(201).json({
            success: true,
            message: 'Đăng tin pass phòng thành công! Link xác nhận đã được tạo cho chủ trọ.',
            data: sanitizePublicPassRoom(createdRoom, true),
            // Trả link trực tiếp cho owner để có thể copy ngay trên giao diện
            confirmationLink
        });
    } catch (error) {
        console.error('Lỗi tạo pass room:', error);
        res.status(400).json({ success: false, message: 'Đăng tin thất bại', error: error.message });
    }
});

// ==========================================
// 5. TẠO / GỬI LẠI LINK XÁC NHẬN CHO CHỦ TRỌ (Chỉ Owner / Admin)
// ==========================================
router.post('/:id/landlord-link', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin';

        let targetRoom = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            targetRoom = await PassRoom.findById(id);
        } else {
            const fallbackList = loadFallbackPassRooms();
            targetRoom = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tin pass phòng.' });
        }

        // Kiểm tra quyền sở hữu
        if (!isAdmin && String(targetRoom.owner) !== String(currentUserId) && targetRoom.ownerEmail !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền lấy link xác nhận của tin này.' });
        }

        // Sinh token mới 72 giờ (vô hiệu hóa token cũ)
        const { token, tokenHash, expiresAt } = generateConfirmationToken();

        if (isDbConnected) {
            await PassRoom.findByIdAndUpdate(targetRoom._id, {
                'landlordConfirmation.tokenHash': tokenHash,
                'landlordConfirmation.expiresAt': expiresAt,
                'landlordConfirmation.confirmedAt': null,
                'landlordConfirmation.rejectedAt': null,
                status: targetRoom.status === 'rejected' ? 'pending_landlord' : targetRoom.status
            });
        } else {
            const fallbackList = loadFallbackPassRooms();
            const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
            if (idx !== -1) {
                fallbackList[idx].landlordConfirmation = {
                    tokenHash,
                    expiresAt,
                    confirmedAt: null,
                    rejectedAt: null,
                    note: ''
                };
                if (fallbackList[idx].status === 'rejected') fallbackList[idx].status = 'pending_landlord';
                saveFallbackPassRooms(fallbackList);
            }
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const confirmationLink = `${baseUrl}/xac-nhan-pass/${token}`;

        // Gửi email nếu có email chủ trọ
        let emailSent = false;
        if (targetRoom.landlordEmail) {
            const emailRes = await sendLandlordPassEmail({
                to: targetRoom.landlordEmail,
                landlordName: targetRoom.landlordName,
                tenantName: targetRoom.posterName,
                roomTitle: targetRoom.title,
                confirmLink: confirmationLink,
                depositAmount: targetRoom.depositAmount,
                monthlyRent: targetRoom.monthlyRent,
                moveInDate: targetRoom.moveInDate ? new Date(targetRoom.moveInDate).toLocaleDateString('vi-VN') : 'Linh hoạt'
            });
            emailSent = Boolean(emailRes && emailRes.success);
        }

        res.status(200).json({
            success: true,
            message: 'Đã tạo link xác nhận mới thành công (hiệu lực 72 giờ, token cũ đã bị vô hiệu hóa).',
            confirmationLink,
            expiresAt,
            emailSent
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo link xác nhận', error: error.message });
    }
});

// ==========================================
// 6. CẬP NHẬT TIN PASS PHÒNG (Chỉ Owner / Admin)
// ==========================================
router.patch('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin';

        let targetRoom = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            targetRoom = await PassRoom.findById(id);
        } else {
            const fallbackList = loadFallbackPassRooms();
            targetRoom = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng cần sửa.' });
        }

        if (!isAdmin && String(targetRoom.owner) !== String(currentUserId) && targetRoom.ownerEmail !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa tin này.' });
        }

        const allowedFields = [
            'title', 'description', 'address', 'campus', 'area_sqm', 'room_type',
            'monthlyRent', 'passPrice', 'depositAmount', 'remainingMonths',
            'moveInDate', 'isFlexibleMoveIn', 'amenities', 'rules', 'images'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Admin có thể cập nhật trạng thái
        if (isAdmin && req.body.status) {
            updates.status = req.body.status;
        }

        if (isDbConnected) {
            const updated = await PassRoom.findByIdAndUpdate(targetRoom._id, updates, { new: true });
            return res.status(200).json({
                success: true,
                message: 'Cập nhật tin pass phòng thành công',
                data: sanitizePublicPassRoom(updated, true)
            });
        }

        const fallbackList = loadFallbackPassRooms();
        const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
        if (idx !== -1) {
            fallbackList[idx] = { ...fallbackList[idx], ...updates, updatedAt: new Date() };
            saveFallbackPassRooms(fallbackList);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật tin pass phòng thành công',
                data: sanitizePublicPassRoom(fallbackList[idx], true)
            });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'Lỗi cập nhật tin', error: error.message });
    }
});

// ==========================================
// 7. XÓA TIN PASS PHÒNG (Chỉ Owner / Admin)
// ==========================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin';

        let targetRoom = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            targetRoom = await PassRoom.findById(id);
        } else {
            const fallbackList = loadFallbackPassRooms();
            targetRoom = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng cần xóa.' });
        }

        if (!isAdmin && String(targetRoom.owner) !== String(currentUserId) && targetRoom.ownerEmail !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa tin này.' });
        }

        if (isDbConnected) {
            await PassRoom.findByIdAndDelete(targetRoom._id);
        } else {
            let fallbackList = loadFallbackPassRooms();
            fallbackList = fallbackList.filter(r => String(r._id) !== id && String(r.id) !== id);
            saveFallbackPassRooms(fallbackList);
        }

        res.status(200).json({ success: true, message: 'Đã xóa tin pass phòng thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa tin', error: error.message });
    }
});

// ==========================================
// 8. NGƯỜI NHẬN GỬI YÊU CẦU NHẬN PHÒNG (Reserve)
// ==========================================
router.post('/:id/reserve', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, phone } = req.body;
        const isDbConnected = req.app.locals.isDbConnected;
        const requesterId = req.user._id || req.user.id;

        let room = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            room = await PassRoom.findById(id);
        } else {
            const fallbackList = loadFallbackPassRooms();
            room = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để gửi yêu cầu.' });
        }

        if (String(room.owner) === String(requesterId)) {
            return res.status(400).json({ success: false, message: 'Bạn không thể tự gửi yêu cầu nhận phòng của chính mình.' });
        }

        if (room.status !== 'verified') {
            return res.status(400).json({
                success: false,
                message: `Phòng chưa sẵn sàng nhận giữ chỗ (Trạng thái hiện tại: ${room.status}). Chỉ phòng đã được chủ trọ xác nhận mới có thể nhận cọc.`
            });
        }

        const reservationData = {
            requestedBy: requesterId,
            requesterName: req.user.fullName || 'Người nhận phòng',
            requesterPhone: phone || req.user.phone || '',
            message: message || 'Tôi quan tâm và muốn nhận lại phòng này!',
            requestedAt: new Date(),
            status: 'pending'
        };

        if (isDbConnected) {
            await PassRoom.findByIdAndUpdate(room._id, { reservation: reservationData });
        } else {
            const fallbackList = loadFallbackPassRooms();
            const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
            if (idx !== -1) {
                fallbackList[idx].reservation = reservationData;
                saveFallbackPassRooms(fallbackList);
            }
        }

        // Báo chuông thông báo cho Owner
        await createNotification({
            userId: room.owner,
            title: 'Có người yêu cầu nhận pass phòng!',
            message: `${req.user.fullName || 'Một sinh viên'} vừa gửi yêu cầu nhận phòng "${room.title}". SĐT liên hệ: ${reservationData.requesterPhone}`,
            type: 'pass_reservation',
            referenceId: String(room._id || room.id),
            link: '/pass-phong/cua-toi'
        });

        res.status(200).json({
            success: true,
            message: 'Đã gửi yêu cầu nhận phòng thành công! Người đăng tin sẽ nhận được thông báo để liên hệ với bạn.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi gửi yêu cầu nhận phòng', error: error.message });
    }
});

// ==========================================
// 9. OWNER PHẢN HỒI YÊU CẦU NHẬN PHÒNG (Accept / Reject / Complete)
// ==========================================
router.post('/:id/reserve/respond', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body; // action: 'accept' | 'reject' | 'complete'
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        let room = null;
        if (isDbConnected && mongoose.isValidObjectId(id)) {
            room = await PassRoom.findById(id);
        } else {
            const fallbackList = loadFallbackPassRooms();
            room = fallbackList.find(r => String(r._id) === id || String(r.id) === id);
        }

        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        }

        if (String(room.owner) !== String(currentUserId) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý phòng này.' });
        }

        let newStatus = room.status;
        let reservationStatus = room.reservation?.status || 'none';

        if (action === 'accept') {
            // Chấp nhận giữ chỗ: verified -> reserved
            newStatus = 'reserved';
            reservationStatus = 'accepted';
        } else if (action === 'reject') {
            // Từ chối giữ chỗ: trở lại verified
            newStatus = 'verified';
            reservationStatus = 'rejected';
        } else if (action === 'complete') {
            // Hoàn tất sang nhượng thành công: reserved / verified -> completed
            newStatus = 'completed';
            reservationStatus = 'accepted';
        } else {
            return res.status(400).json({ success: false, message: 'Hành động không hợp lệ (accept, reject, complete).' });
        }

        const updateFields = {
            status: newStatus,
            'reservation.status': reservationStatus,
            'reservation.respondedAt': new Date(),
            'reservation.responseNote': note || ''
        };

        if (isDbConnected) {
            await PassRoom.findByIdAndUpdate(room._id, updateFields);
        } else {
            const fallbackList = loadFallbackPassRooms();
            const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
            if (idx !== -1) {
                fallbackList[idx] = {
                    ...fallbackList[idx],
                    status: newStatus,
                    reservation: {
                        ...(fallbackList[idx].reservation || {}),
                        status: reservationStatus,
                        respondedAt: new Date(),
                        responseNote: note || ''
                    }
                };
                saveFallbackPassRooms(fallbackList);
            }
        }

        // Báo notification cho người gửi yêu cầu nếu có
        if (room.reservation?.requestedBy) {
            const messageMap = {
                accept: `Người đăng đã chấp nhận yêu cầu nhận phòng "${room.title}". Hãy liên hệ chủ trọ để ký giấy tay 3 bên!`,
                reject: `Người đăng đã từ chối yêu cầu nhận phòng "${room.title}". Lý do: ${note || 'Không có'}`,
                complete: `Giao dịch pass phòng "${room.title}" đã được xác nhận hoàn tất thành công!`
            };

            await createNotification({
                userId: room.reservation.requestedBy,
                title: action === 'accept' ? 'Yêu cầu nhận phòng được chấp nhận' : (action === 'complete' ? 'Hoàn tất pass phòng' : 'Yêu cầu bị từ chối'),
                message: messageMap[action],
                type: action === 'accept' ? 'pass_reservation_accepted' : 'pass_reservation_rejected',
                referenceId: String(room._id || room.id),
                link: `/pass-phong/${room._id || room.id}`
            });
        }

        res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái: ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật yêu cầu giữ chỗ', error: error.message });
    }
});

// ==========================================
// 10. LƯU / BỎ LƯU TIN (Save / Unsave)
// ==========================================
router.post('/:id/save', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected && mongoose.isValidObjectId(id)) {
            await PassRoom.findByIdAndUpdate(id, { $addToSet: { savedBy: userId } });
            return res.status(200).json({ success: true, message: 'Đã lưu tin pass phòng vào danh sách yêu thích.' });
        }

        const fallbackList = loadFallbackPassRooms();
        const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
        if (idx !== -1) {
            if (!fallbackList[idx].savedBy) fallbackList[idx].savedBy = [];
            if (!fallbackList[idx].savedBy.includes(String(userId))) {
                fallbackList[idx].savedBy.push(String(userId));
                saveFallbackPassRooms(fallbackList);
            }
        }
        res.status(200).json({ success: true, message: 'Đã lưu tin pass phòng (Fallback).' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lưu tin', error: error.message });
    }
});

router.delete('/:id/save', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected && mongoose.isValidObjectId(id)) {
            await PassRoom.findByIdAndUpdate(id, { $pull: { savedBy: userId } });
            return res.status(200).json({ success: true, message: 'Đã bỏ lưu tin pass phòng.' });
        }

        const fallbackList = loadFallbackPassRooms();
        const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
        if (idx !== -1 && fallbackList[idx].savedBy) {
            fallbackList[idx].savedBy = fallbackList[idx].savedBy.filter(u => String(u) !== String(userId));
            saveFallbackPassRooms(fallbackList);
        }
        res.status(200).json({ success: true, message: 'Đã bỏ lưu tin pass phòng (Fallback).' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi bỏ lưu tin', error: error.message });
    }
});

// ==========================================
// 11. BÁO CÁO TIN NGHI VẤN LỪA ĐẢO
// ==========================================
router.post('/:id/report', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, description } = req.body;
        const isDbConnected = req.app.locals.isDbConnected;
        const userId = req.user._id || req.user.id;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn lý do báo cáo.' });
        }

        const reportRecord = {
            reportedBy: userId,
            reporterEmail: req.user.email || '',
            reporterName: req.user.fullName || 'Người dùng',
            reason,
            description: description || '',
            createdAt: new Date()
        };

        if (isDbConnected && mongoose.isValidObjectId(id)) {
            await PassRoom.findByIdAndUpdate(id, { $push: { reports: reportRecord } });
        } else {
            const fallbackList = loadFallbackPassRooms();
            const idx = fallbackList.findIndex(r => String(r._id) === id || String(r.id) === id);
            if (idx !== -1) {
                if (!fallbackList[idx].reports) fallbackList[idx].reports = [];
                fallbackList[idx].reports.push(reportRecord);
                saveFallbackPassRooms(fallbackList);
            }
        }

        // Báo cho Admin (hoặc ghi nhận)
        await createNotification({
            userId: userId,
            title: 'Cảm ơn bạn đã báo cáo vi phạm',
            message: `Hệ thống đã tiếp nhận báo cáo về tin pass phòng "${id}". Ban quản trị sẽ rà soát trong 24 giờ.`,
            type: 'pass_reported',
            referenceId: String(id)
        });

        res.status(200).json({
            success: true,
            message: 'Đã gửi báo cáo thành công! Ban quản trị SmartStay sẽ kiểm duyệt và xử lý nghiêm khắc các hành vi gian lận.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi gửi báo cáo', error: error.message });
    }
});

module.exports = router;
