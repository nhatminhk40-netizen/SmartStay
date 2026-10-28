const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const PassRoom = require('../models/PassRoom');
const { hashToken, verifyTokenValidity } = require('../utils/passToken');
const { createNotification } = require('../utils/notify');

const FALLBACK_PASS_FILE = path.join(__dirname, '../fallback_pass_rooms.json');

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

// Rate limiter chống brute-force token: tối đa 30 requests trong 15 phút theo IP
const confirmationRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đã thao tác quá nhiều lần từ IP này. Vui lòng thử lại sau 15 phút để đảm bảo an toàn.'
    }
});

router.use(confirmationRateLimiter);

// Helper tìm PassRoom theo token bí mật
const findRoomByToken = async (token, isDbConnected) => {
    const tokenHash = hashToken(token);

    if (isDbConnected) {
        // Tìm bằng tokenHash (vì tokenHash được set select: false nên cần .select('+landlordConfirmation.tokenHash'))
        let room = await PassRoom.findOne({ 'landlordConfirmation.tokenHash': tokenHash })
            .select('+landlordConfirmation.tokenHash');

        // Hỗ trợ trường hợp nếu token chính là id từ phiên bản cũ
        if (!room && mongoose.isValidObjectId(token)) {
            room = await PassRoom.findById(token).select('+landlordConfirmation.tokenHash');
        }
        return room;
    }

    const fallbackList = loadFallbackPassRooms();
    const found = fallbackList.find(r => 
        (r.landlordConfirmation && r.landlordConfirmation.tokenHash === tokenHash) ||
        String(r._id) === token ||
        String(r.id) === token
    );
    return found;
};

// ==========================================
// 1. XEM THÔNG TIN PHÒNG XÁC NHẬN (Dành cho Chủ trọ - Không cần đăng nhập)
// ==========================================
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const isDbConnected = req.app.locals.isDbConnected;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Thiếu mã xác nhận bảo mật.' });
        }

        const room = await findRoomByToken(token, isDbConnected);

        if (!room) {
            return res.status(404).json({
                success: false,
                isInvalid: true,
                message: 'Không tìm thấy yêu cầu xác nhận. Link có thể không đúng hoặc đã bị xóa.'
            });
        }

        // Kiểm tra hiệu lực token (72h, chưa xác nhận/từ chối trước đó)
        const validity = verifyTokenValidity(room.landlordConfirmation);
        if (!validity.isValid) {
            return res.status(200).json({
                success: false,
                isExpired: validity.reason.includes('hết hạn'),
                isAlreadyHandled: validity.reason.includes('đã được xử lý'),
                message: validity.reason,
                status: room.status,
                data: {
                    title: room.title,
                    address: room.address,
                    posterName: room.posterName || 'Sinh viên thuê',
                    depositAmount: room.depositAmount,
                    monthlyRent: room.monthlyRent,
                    confirmedAt: room.landlordConfirmation?.confirmedAt,
                    rejectedAt: room.landlordConfirmation?.rejectedAt,
                    note: room.landlordConfirmation?.note
                }
            });
        }

        // Trả thông tin an toàn để chủ trọ đối chiếu
        res.status(200).json({
            success: true,
            isValid: true,
            data: {
                id: room._id || room.id,
                title: room.title,
                address: room.address,
                campus: room.campus,
                room_type: room.room_type,
                monthlyRent: room.monthlyRent,
                passPrice: room.passPrice,
                depositAmount: room.depositAmount,
                remainingMonths: room.remainingMonths,
                moveInDate: room.moveInDate ? new Date(room.moveInDate).toLocaleDateString('vi-VN') : 'Linh hoạt',
                posterName: room.posterName || 'Sinh viên',
                posterPhone: room.posterPhone || '',
                landlordName: room.landlordName,
                images: room.images || [],
                contractImages: room.contractImages || [],
                expiresAt: room.landlordConfirmation?.expiresAt,
                status: room.status
            }
        });
    } catch (error) {
        console.error('Error getting landlord confirmation info:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải trang xác nhận', error: error.message });
    }
});

// ==========================================
// 2. CHỦ TRỌ XÁC NHẬN HOẶC TỪ CHỐI (Dùng 1 lần)
// ==========================================
router.post('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { action, note } = req.body; // action: 'confirm' | 'reject'
        const isDbConnected = req.app.locals.isDbConnected;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ.' });
        }

        if (action !== 'confirm' && action !== 'reject') {
            return res.status(400).json({ success: false, message: 'Thao tác không hợp lệ. Vui lòng chọn Xác nhận hoặc Từ chối.' });
        }

        if (action === 'reject' && (!note || !note.trim())) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối để sinh viên nắm được thông tin.' });
        }

        const room = await findRoomByToken(token, isDbConnected);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu xác nhận.' });
        }

        // BẢO MẬT: Kiểm tra lại tính hợp lệ trước khi thực hiện
        const validity = verifyTokenValidity(room.landlordConfirmation);
        if (!validity.isValid) {
            return res.status(400).json({
                success: false,
                message: validity.reason
            });
        }

        const now = new Date();
        const newStatus = action === 'confirm' ? 'verified' : 'rejected';

        if (isDbConnected) {
            await PassRoom.findByIdAndUpdate(room._id, {
                status: newStatus,
                'landlordConfirmation.confirmedAt': action === 'confirm' ? now : null,
                'landlordConfirmation.rejectedAt': action === 'reject' ? now : null,
                'landlordConfirmation.note': (note || '').trim()
            });
        } else {
            const fallbackList = loadFallbackPassRooms();
            const idx = fallbackList.findIndex(r => 
                (r.landlordConfirmation && r.landlordConfirmation.tokenHash === hashToken(token)) ||
                String(r._id) === token ||
                String(r.id) === token
            );
            if (idx !== -1) {
                fallbackList[idx].status = newStatus;
                if (!fallbackList[idx].landlordConfirmation) fallbackList[idx].landlordConfirmation = {};
                fallbackList[idx].landlordConfirmation.confirmedAt = action === 'confirm' ? now : null;
                fallbackList[idx].landlordConfirmation.rejectedAt = action === 'reject' ? now : null;
                fallbackList[idx].landlordConfirmation.note = (note || '').trim();
                saveFallbackPassRooms(fallbackList);
            }
        }

        // Bắn thông báo (notification chuông) cho người đăng tin (owner)
        if (room.owner) {
            const isConfirmed = action === 'confirm';
            const notifTitle = isConfirmed 
                ? '✅ Chủ trọ đã xác nhận Pass phòng!' 
                : '❌ Chủ trọ đã từ chối yêu cầu Pass phòng';
            const notifMessage = isConfirmed
                ? `Chủ trọ ${room.landlordName || ''} đã đồng ý cho bạn chuyển nhượng phòng "${room.title}". Tin pass phòng của bạn đã chính thức được hiển thị công khai trên SmartStay!`
                : `Chủ trọ ${room.landlordName || ''} đã từ chối yêu cầu chuyển nhượng phòng "${room.title}". Lý do: ${(note || '').trim()}`;

            await createNotification({
                userId: room.owner,
                title: notifTitle,
                message: notifMessage,
                type: isConfirmed ? 'pass_confirmed' : 'pass_rejected',
                referenceId: String(room._id || room.id),
                link: '/pass-phong/cua-toi'
            });
        }

        res.status(200).json({
            success: true,
            status: newStatus,
            message: action === 'confirm' 
                ? 'Quý chủ trọ đã xác nhận đồng ý chuyển nhượng thành công. Tin pass phòng đã được hiển thị công khai.' 
                : 'Đã ghi nhận từ chối yêu cầu chuyển nhượng. Hệ thống đã thông báo đến người thuê.'
        });
    } catch (error) {
        console.error('Error submitting landlord confirmation:', error);
        res.status(500).json({ success: false, message: 'Lỗi ghi nhận kết quả xác nhận', error: error.message });
    }
});

module.exports = router;
