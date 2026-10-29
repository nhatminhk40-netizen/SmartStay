const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const Stay = require('../models/Stay');
const Room = require('../models/Room');
const CheckinCode = require('../models/CheckinCode');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// Bắt buộc quyền landlord hoặc admin
router.use(protect);
router.use(authorize('landlord', 'admin', 'employee'));

// ==========================================
// 1. DANH SÁCH YÊU CẦU NHẬN PHÒNG CHỜ DUYỆT
// ==========================================
router.get('/pending', async (req, res) => {
    try {
        const landlordId = req.user._id || req.user.id;
        
        let query;
        if (req.user.role === 'admin') {
            query = { status: 'requested' };
        } else {
            const myRooms = await Room.find({
                $or: [
                    { owner: landlordId },
                    ...(req.user.phone ? [{ contactPhone: req.user.phone }] : [])
                ]
            }).select('_id');
            const myRoomIds = myRooms.map(r => r._id);

            query = {
                status: 'requested',
                $or: [
                    { landlordId },
                    { roomId: { $in: myRoomIds } },
                    { landlordId: null }
                ]
            };
        }

        const pendingStays = await Stay.find(query)
            .populate('tenantId', 'fullName email phone avatar campus studentId')
            .populate('roomId', 'title address price image_url images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingStays.length,
            data: pendingStays
        });
    } catch (error) {
        console.error('Lỗi get pending stays:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách yêu cầu nhận phòng', error: error.message });
    }
});

// ==========================================
// 2. DANH SÁCH KHÁCH ĐANG Ở THỰC TẾ (ACTIVE)
// ==========================================
router.get('/active', async (req, res) => {
    try {
        const landlordId = req.user._id || req.user.id;

        let query;
        if (req.user.role === 'admin') {
            query = { status: 'active' };
        } else {
            const myRooms = await Room.find({
                $or: [
                    { owner: landlordId },
                    ...(req.user.phone ? [{ contactPhone: req.user.phone }] : [])
                ]
            }).select('_id');
            const myRoomIds = myRooms.map(r => r._id);

            query = {
                status: 'active',
                $or: [
                    { landlordId },
                    { roomId: { $in: myRoomIds } },
                    { landlordId: null }
                ]
            };
        }

        const activeStays = await Stay.find(query)
            .populate('tenantId', 'fullName email phone avatar campus studentId')
            .populate('roomId', 'title address price image_url images')
            .sort({ checkInDate: -1 });

        res.status(200).json({
            success: true,
            count: activeStays.length,
            data: activeStays
        });
    } catch (error) {
        console.error('Lỗi get active stays:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách người thuê đang ở', error: error.message });
    }
});

// ==========================================
// 3. TẤT CẢ LƯU TRÚ CỦA CHỦ TRỌ
// ==========================================
router.get('/all', async (req, res) => {
    try {
        const landlordId = req.user._id || req.user.id;
        const query = req.user.role === 'admin' ? {} : { landlordId };

        const allStays = await Stay.find(query)
            .populate('tenantId', 'fullName email phone avatar campus')
            .populate('roomId', 'title address price image_url images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: allStays.length,
            data: allStays
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải toàn bộ danh sách lưu trú', error: error.message });
    }
});

// ==========================================
// 4. CHỦ TRỌ DUYỆT NHẬN PHÒNG (confirm-checkin)
// ==========================================
router.post('/:id/confirm-checkin', async (req, res) => {
    try {
        const { id } = req.params;
        const { checkInDate, note } = req.body;
        const landlordId = req.user._id || req.user.id;

        const stay = await Stay.findById(id).populate('roomId').populate('tenantId');
        if (!stay) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt lưu trú.' });
        }

        if (req.user.role !== 'admin' && stay.landlordId && String(stay.landlordId) !== String(landlordId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền duyệt phòng của chủ trọ khác.' });
        }

        if (!stay.landlordId) {
            stay.landlordId = landlordId;
        }

        stay.status = 'active';
        stay.checkInDate = checkInDate ? new Date(checkInDate) : new Date();
        stay.checkInConfirmedBy = 'landlord';
        if (note) stay.landlordNote = note;
        await stay.save();

        // Gửi thông báo cho người thuê
        if (stay.tenantId) {
            await createNotification({
                userId: stay.tenantId._id || stay.tenantId,
                title: '🎉 Chủ trọ đã xác nhận nhận phòng thành công!',
                message: `Chủ trọ đã xác nhận bạn đang sinh sống tại "${stay.roomId?.title || 'Phòng trọ'}". Chúc bạn có trải nghiệm lưu trú văn minh và an tâm!`,
                type: 'stay_approved',
                referenceId: stay._id,
                link: `/phong/${stay.roomId?._id}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xác nhận nhận phòng thành công! Trạng thái lưu trú chuyển sang Hoạt động (Active).',
            data: stay
        });
    } catch (error) {
        console.error('Lỗi confirm-checkin:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác nhận nhận phòng', error: error.message });
    }
});

// ==========================================
// 5. CHỦ TRỌ TỪ CHỐI YÊU CẦU NHẬN PHÒNG (reject)
// ==========================================
router.post('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const landlordId = req.user._id || req.user.id;

        const stay = await Stay.findById(id).populate('roomId').populate('tenantId');
        if (!stay) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt lưu trú.' });
        }

        if (req.user.role !== 'admin' && stay.landlordId && String(stay.landlordId) !== String(landlordId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên phòng này.' });
        }

        if (!stay.landlordId) {
            stay.landlordId = landlordId;
        }

        stay.status = 'cancelled';
        stay.landlordNote = reason || 'Chủ trọ không xác nhận người thuê này.';
        await stay.save();

        // Gửi thông báo cho người thuê
        if (stay.tenantId) {
            await createNotification({
                userId: stay.tenantId._id || stay.tenantId,
                title: '⚠️ Yêu cầu nhận phòng bị từ chối',
                message: `Chủ trọ đã từ chối yêu cầu nhận phòng tại "${stay.roomId?.title || 'Phòng'}". Lý do: ${reason || 'Không xác định'}`,
                type: 'stay_rejected',
                referenceId: stay._id,
                link: `/phong/${stay.roomId?._id}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã từ chối yêu cầu nhận phòng.',
            data: stay
        });
    } catch (error) {
        console.error('Lỗi reject stay:', error);
        res.status(500).json({ success: false, message: 'Lỗi từ chối nhận phòng', error: error.message });
    }
});

// ==========================================
// 6. XÁC NHẬN TRẢ TRỌ / KẾT THÚC LƯU TRÚ (confirm-checkout)
// ==========================================
router.post('/:id/confirm-checkout', async (req, res) => {
    try {
        const { id } = req.params;
        const { checkOutDate, note } = req.body;
        const landlordId = req.user._id || req.user.id;

        const stay = await Stay.findById(id).populate('roomId').populate('tenantId');
        if (!stay) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt lưu trú.' });
        }

        if (req.user.role !== 'admin' && stay.landlordId && String(stay.landlordId) !== String(landlordId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên phòng này.' });
        }

        if (!stay.landlordId) {
            stay.landlordId = landlordId;
        }

        stay.status = 'completed';
        stay.checkOutDate = checkOutDate ? new Date(checkOutDate) : new Date();
        stay.checkOutConfirmedBy = 'landlord';
        if (note) stay.landlordNote = note;
        await stay.save();

        // Gửi thông báo cho người thuê rằng họ có thể đánh giá phòng trong 90 ngày tới
        if (stay.tenantId) {
            await createNotification({
                userId: stay.tenantId._id || stay.tenantId,
                title: '⭐ Đã hoàn tất trả phòng - Mời bạn gửi Đánh giá',
                message: `Bạn đã kết thúc lưu trú tại "${stay.roomId?.title || 'Phòng trọ'}". Hãy để lại đánh giá thực tế và chia sẻ chi phí để giúp cộng đồng sinh viên!`,
                type: 'stay_completed',
                referenceId: stay._id,
                link: `/phong/${stay.roomId?._id}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xác nhận trả phòng thành công! Đợt lưu trú đã chuyển sang Completed.',
            data: stay
        });
    } catch (error) {
        console.error('Lỗi confirm-checkout:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác nhận trả phòng', error: error.message });
    }
});

// ==========================================
// 7. TẠO MÃ CHECK-IN NHẬN PHÒNG (checkin_code)
// ==========================================
router.post('/rooms/:roomId/checkin-codes', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { note } = req.body;
        const landlordId = req.user._id || req.user.id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });
        }

        // Quyền: Admin hoặc chủ sở hữu phòng, hoặc phòng chưa có chủ, hoặc SĐT liên hệ trùng với chủ trọ
        if (req.user.role !== 'admin' && room.owner && String(room.owner) !== String(landlordId)) {
            const isContactPhone = req.user.phone && room.contactPhone && req.user.phone === room.contactPhone;
            if (!isContactPhone) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo mã cho phòng của chủ khác.' });
            }
        }

        // Nếu phòng chưa có owner, tự động gán chủ trọ hiện tại làm owner
        if (!room.owner) {
            room.owner = landlordId;
            await room.save().catch(e => console.warn('Không thể cập nhật room owner:', e.message));
        }

        // Sinh mã ngẫu nhiên 6 ký tự gồm chữ hoa và số (dễ đọc cho người dùng)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let rawCode = '';
        const bytes = crypto.randomBytes(6);
        for (let i = 0; i < 6; i++) {
            rawCode += chars[bytes[i] % chars.length];
        }

        // Mã format chuẩn: SS-XXXXXX
        const formattedCode = `SS-${rawCode}`;
        const codeHash = crypto.createHash('sha256').update(formattedCode).digest('hex');
        const expiresDays = parseInt(process.env.CHECKIN_CODE_EXPIRE_DAYS, 10) || 7;
        const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

        const newCodeRecord = await CheckinCode.create({
            codeHash,
            roomId,
            landlordId,
            expiresAt,
            note: note || `Mã nhận phòng tạo bởi ${req.user.fullName || 'Chủ trọ'}`
        });

        // Chỉ trả mã plaintext 1 LẦN DUY NHẤT cho chủ trọ, không bao giờ log ra console hay lưu plaintext vào DB
        res.status(201).json({
            success: true,
            message: `Tạo mã nhận phòng thành công! Mã có hiệu lực trong ${expiresDays} ngày.`,
            data: {
                id: newCodeRecord._id,
                code: formattedCode, // Mã hiển thị 1 lần để chủ trọ sao chép gửi cho khách
                expiresAt,
                roomId,
                roomTitle: room.title
            }
        });
    } catch (error) {
        console.error('Lỗi create checkin code:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo mã nhận phòng', error: error.message });
    }
});

// ==========================================
// 8. DANH SÁCH MÃ CHECK-IN CỦA MỘT PHÒNG
// ==========================================
router.get('/rooms/:roomId/checkin-codes', async (req, res) => {
    try {
        const { roomId } = req.params;
        const landlordId = req.user._id || req.user.id;

        const codes = await CheckinCode.find({
            roomId,
            ...(req.user.role !== 'admin' && { landlordId })
        })
        .populate('redeemedBy', 'fullName email phone')
        .sort({ createdAt: -1 })
        .select('-codeHash'); // Không trả hash

        res.status(200).json({
            success: true,
            count: codes.length,
            data: codes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách mã nhận phòng', error: error.message });
    }
});

// ==========================================
// 9. THU HỒI / HỦY MÃ CHECK-IN
// ==========================================
router.delete('/checkin-codes/:codeId', async (req, res) => {
    try {
        const { codeId } = req.params;
        const landlordId = req.user._id || req.user.id;

        const codeRecord = await CheckinCode.findById(codeId);
        if (!codeRecord) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã cần thu hồi.' });
        }

        if (req.user.role !== 'admin' && String(codeRecord.landlordId) !== String(landlordId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thu hồi mã này.' });
        }

        await CheckinCode.findByIdAndDelete(codeId);

        res.status(200).json({
            success: true,
            message: 'Đã thu hồi mã nhận phòng thành công.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thu hồi mã nhận phòng', error: error.message });
    }
});

module.exports = router;

