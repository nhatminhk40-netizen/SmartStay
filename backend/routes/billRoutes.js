const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Contract = require('../models/Contract');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// Helper chuẩn hóa so sánh ID
const isSameId = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
};

// 1. TẠO HÓA ĐƠN TIỀN TRỌ & ĐIỆN NƯỚC MINH BẠCH (CHỦ TRỌ / ADMIN)
router.post('/', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const {
            contractId,
            month,
            year,
            dueDate,
            electricPrevious,
            electricCurrent,
            electricPhoto,
            waterPrevious,
            waterCurrent,
            waterPhoto,
            otherFees,
            note
        } = req.body;

        if (!contractId || !month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã hợp đồng, tháng và năm của hóa đơn.'
            });
        }

        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const contract = await Contract.findById(contractId).populate('room tenant landlord');
            if (!contract) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng tương ứng.' });
            }

            // Kiểm tra quyền chủ trọ
            if (!isAdmin && !isSameId(contract.landlord._id || contract.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền lập hóa đơn cho hợp đồng này.' });
            }

            const electricPrice = Number(contract.electricPrice) || 3500;
            const waterPrice = Number(contract.waterPrice) || 20000;
            const monthlyRent = Number(contract.monthlyRent) || 0;

            const elPrev = Number(electricPrevious) || 0;
            const elCurr = Math.max(Number(electricCurrent) || 0, elPrev);
            const elUsage = elCurr - elPrev;
            const elTotal = elUsage * electricPrice;

            const waPrev = Number(waterPrevious) || 0;
            const waCurr = Math.max(Number(waterCurrent) || 0, waPrev);
            const waUsage = waCurr - waPrev;
            const waTotal = waUsage * waterPrice;

            const parsedOtherFees = Array.isArray(otherFees) ? otherFees : [];
            const otherTotal = parsedOtherFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            const totalAmount = monthlyRent + elTotal + waTotal + otherTotal;

            const newBill = await Bill.create({
                contract: contract._id,
                room: contract.room?._id || contract.room,
                landlord: contract.landlord?._id || contract.landlord,
                tenant: contract.tenant?._id || contract.tenant,
                month: Number(month),
                year: Number(year),
                billingDate: new Date(),
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Hạn 5 ngày
                monthlyRent,
                electric: {
                    previousNumber: elPrev,
                    currentNumber: elCurr,
                    usage: elUsage,
                    pricePerKwh: electricPrice,
                    total: elTotal,
                    meterPhotoUrl: electricPhoto || ''
                },
                water: {
                    previousNumber: waPrev,
                    currentNumber: waCurr,
                    usage: waUsage,
                    pricePerM3: waterPrice,
                    total: waTotal,
                    meterPhotoUrl: waterPhoto || ''
                },
                otherFees: parsedOtherFees,
                totalAmount,
                status: 'unpaid',
                note: note || ''
            });

            const populatedBill = await Bill.findById(newBill._id)
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone email')
                .populate('landlord', 'fullName phone email');

            return res.status(201).json({
                success: true,
                message: `Lập hóa đơn Tháng ${month}/${year} thành công với chứng từ công tơ minh bạch!`,
                data: populatedBill
            });
        }

        // Mock mode
        res.status(201).json({
            success: true,
            message: 'Đã lập hóa đơn tháng (Local Dev Mock)',
            data: {
                _id: 'bill_' + Date.now(),
                contract: contractId,
                month,
                year,
                totalAmount: 3250000,
                status: 'unpaid'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo hóa đơn: ' + error.message });
    }
});

// 2. LẤY DANH SÁCH HÓA ĐƠN CHO CHỦ TRỌ
router.get('/landlord', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const query = isAdmin ? {} : { landlord: currentUserId };
            const bills = await Bill.find(query)
                .sort({ createdAt: -1 })
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone email')
                .populate('contract', 'startDate endDate durationMonths');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. LẤY HÓA ĐƠN CỦA SINH VIÊN ĐANG ĐĂNG NHẬP
router.get('/my-bills', protect, async (req, res) => {
    try {
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const bills = await Bill.find({ tenant: currentUserId })
                .sort({ createdAt: -1 })
                .populate('room', 'title address images image_url')
                .populate('landlord', 'fullName phone email')
                .populate('contract', 'startDate endDate monthlyRent electricPrice waterPrice');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. LẤY TOÀN BỘ HÓA ĐƠN CỦA MỘT HỢP ĐỒNG CỤ THỂ
router.get('/contract/:contractId', protect, async (req, res) => {
    try {
        const { contractId } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;

        if (isDbConnected) {
            const bills = await Bill.find({ contract: contractId })
                .sort({ month: -1, year: -1 })
                .populate('room', 'title address')
                .populate('tenant', 'fullName phone')
                .populate('landlord', 'fullName phone');

            return res.status(200).json({
                success: true,
                count: bills.length,
                data: bills
            });
        }

        res.status(200).json({ success: true, count: 0, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. SINH VIÊN XÁC NHẬN ĐÃ THANH TOÁN & GỬI ẢNH BIÊN LAI CHUYỂN KHOẢN
router.patch('/:id/pay', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentProofUrl } = req.body;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;

        if (isDbConnected) {
            const bill = await Bill.findById(id);
            if (!bill) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

            if (!isSameId(bill.tenant, currentUserId) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán hóa đơn này.' });
            }

            bill.status = 'paid';
            bill.paidAt = new Date();
            if (paymentProofUrl) bill.paymentProofUrl = paymentProofUrl;
            await bill.save();

            return res.status(200).json({
                success: true,
                message: 'Đã gửi thông báo thanh toán và ảnh hóa đơn cho Chủ trọ xác nhận!',
                data: bill
            });
        }

        res.status(200).json({ success: true, message: 'Đã thanh toán (Local Dev).' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. CHỦ TRỌ XÁC NHẬN ĐÃ NHẬN TIỀN
router.patch('/:id/confirm', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;
        const currentUserId = req.user._id || req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const bill = await Bill.findById(id);
            if (!bill) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn.' });

            if (!isAdmin && !isSameId(bill.landlord, currentUserId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận hóa đơn này.' });
            }

            bill.status = 'confirmed';
            bill.confirmedAt = new Date();
            await bill.save();

            return res.status(200).json({
                success: true,
                message: 'Chủ trọ đã xác nhận thu tiền phòng & điện nước thành công!',
                data: bill
            });
        }

        res.status(200).json({ success: true, message: 'Đã xác nhận thu tiền (Local Dev).' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
