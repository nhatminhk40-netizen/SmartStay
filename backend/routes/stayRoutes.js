const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const Stay = require('../models/Stay');
const Room = require('../models/Room');
const CheckinCode = require('../models/CheckinCode');
const { protect } = require('../middleware/auth');
const { uploadContract } = require('../middleware/contractUpload');
const { createNotification } = require('../utils/notify');
const { canUserReview } = require('../services/stayReviewService');

// Rate limiter chống brute force mã check-in: tối đa 5 lần thử sai trong 1 giờ
const redeemCodeRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đã thử nhập mã check-in quá nhiều lần. Vui lòng thử lại sau 1 giờ.'
    }
});

// ==========================================
// 1. NGƯỜI THUÊ GỬI YÊU CẦU NHẬN PHÒNG (landlord_confirm)
// ==========================================
router.post('/request-checkin', protect, async (req, res) => {
    try {
        const { roomId, tenantNote, checkInDate } = req.body;
        const tenantId = req.user._id || req.user.id;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng cần nhận.' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });
        }

        // Không cho chủ trọ tự nhận phòng của mình
        if (room.owner && String(room.owner) === String(tenantId)) {
            return res.status(400).json({ success: false, message: 'Bạn là chủ sở hữu của phòng này, không thể gửi yêu cầu nhận phòng.' });
        }

        // Kiểm tra xem đã có Stay active hoặc requested chưa
        const existingStay = await Stay.findOne({
            tenantId,
            roomId,
            status: { $in: ['requested', 'active'] }
        });

        if (existingStay) {
            if (existingStay.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn hiện đang có đợt lưu trú đang hoạt động tại phòng này.',
                    stay: existingStay
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu nhận phòng trước đó của bạn đang chờ chủ trọ phê duyệt.',
                stay: existingStay
            });
        }

        const landlordId = room.owner;
        const stay = await Stay.create({
            tenantId,
            roomId,
            landlordId,
            status: 'requested',
            verificationMethod: 'landlord_confirm',
            tenantNote: tenantNote || '',
            checkInDate: checkInDate ? new Date(checkInDate) : null
        });

        // Gửi thông báo cho chủ trọ
        if (landlordId) {
            await createNotification({
                userId: landlordId,
                title: '🔔 Yêu cầu xác nhận nhận phòng mới',
                message: `Khách thuê ${req.user.fullName || 'Người thuê'} đã gửi yêu cầu xác nhận đang ở tại phòng "${room.title}". Vui lòng kiểm tra và duyệt.`,
                type: 'stay_request',
                referenceId: stay._id,
                link: '/chu-tro'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu nhận phòng thành công! Chủ trọ sẽ nhận được thông báo để xác nhận.',
            data: stay
        });
    } catch (error) {
        console.error('Lỗi request-checkin:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi yêu cầu nhận phòng', error: error.message });
    }
});

// ==========================================
// 2. NGƯỜI THUÊ NHẬP MÃ NHẬN PHÒNG (checkin_code)
// ==========================================
router.post('/redeem-code', protect, redeemCodeRateLimiter, async (req, res) => {
    try {
        const { code, roomId } = req.body;
        const tenantId = req.user._id || req.user.id;

        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã nhận phòng.' });
        }

        const cleanCode = code.trim().toUpperCase();
        const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

        // Tìm mã hợp lệ
        const checkinCode = await CheckinCode.findOne({
            codeHash,
            isRedeemed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!checkinCode) {
            return res.status(400).json({
                success: false,
                message: 'Mã nhận phòng không chính xác, đã được sử dụng hoặc đã hết hạn.'
            });
        }

        // Nếu client gửi kèm roomId, kiểm tra xem có khớp không
        if (roomId && String(checkinCode.roomId) !== String(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Mã nhận phòng này không thuộc về phòng trọ bạn đang xem.'
            });
        }

        const room = await Room.findById(checkinCode.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Phòng trọ tương ứng không tồn tại.' });
        }

        // Không cho chủ trọ dùng mã của mình
        if (room.owner && String(room.owner) === String(tenantId)) {
            return res.status(400).json({ success: false, message: 'Chủ trọ không thể tự kích hoạt lưu trú bằng mã của mình.' });
        }

        // Đánh dấu mã đã sử dụng
        checkinCode.isRedeemed = true;
        checkinCode.redeemedBy = tenantId;
        checkinCode.redeemedAt = new Date();
        await checkinCode.save();

        // Kiểm tra xem đã có Stay nào chưa, nếu có thì kích hoạt, nếu chưa thì tạo mới active
        let stay = await Stay.findOne({
            tenantId,
            roomId: room._id,
            status: { $in: ['requested', 'active'] }
        });

        if (stay) {
            stay.status = 'active';
            stay.checkInDate = stay.checkInDate || new Date();
            stay.verificationMethod = 'checkin_code';
            stay.checkInConfirmedBy = 'system_code';
            await stay.save();
        } else {
            stay = await Stay.create({
                tenantId,
                roomId: room._id,
                landlordId: room.owner,
                status: 'active',
                verificationMethod: 'checkin_code',
                checkInDate: new Date(),
                checkInConfirmedBy: 'system_code'
            });
        }

        // Gửi thông báo cho chủ trọ và người thuê
        if (room.owner) {
            await createNotification({
                userId: room.owner,
                title: '🔑 Khách đã kích hoạt nhận phòng bằng Mã Check-in',
                message: `Khách thuê ${req.user.fullName || 'Người thuê'} đã nhập mã nhận phòng thành công cho phòng "${room.title}".`,
                type: 'stay_code_redeemed',
                referenceId: stay._id,
                link: '/chu-tro'
            });
        }

        await createNotification({
            userId: tenantId,
            title: '🎉 Nhận phòng thành công!',
            message: `Bạn đã kích hoạt thành công lưu trú tại "${room.title}". Bạn sẽ đủ điều kiện gửi đánh giá sau 14 ngày sinh sống.`,
            type: 'stay_activated',
            referenceId: stay._id,
            link: `/phong/${room._id}`
        });

        res.status(200).json({
            success: true,
            message: 'Kích hoạt nhận phòng thành công! Chúc bạn có trải nghiệm tuyệt vời.',
            data: stay
        });
    } catch (error) {
        console.error('Lỗi redeem-code:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác thực mã nhận phòng', error: error.message });
    }
});

// ==========================================
// 3. TẢI HỢP ĐỒNG / GIẤY TỜ THUÊ (contract_upload)
// ==========================================
router.post('/:id/contract', protect, uploadContract.single('contractFile'), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user._id || req.user.id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp hợp đồng (PDF hoặc hình ảnh).' });
        }

        const stay = await Stay.findById(id);
        if (!stay) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt lưu trú.' });
        }

        if (String(stay.tenantId) !== String(tenantId) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật hồ sơ lưu trú này.' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 giờ

        stay.contractFilePath = req.file.path;
        stay.contractFileUrl = `/api/stays/${stay._id}/contract-file`;
        stay.contractConfirmationTokenHash = tokenHash;
        stay.contractConfirmationExpiresAt = expiresAt;
        stay.verificationMethod = 'contract_upload';
        await stay.save();

        const room = await Room.findById(stay.roomId);

        // Gửi thông báo kèm link xác thực cho chủ trọ
        if (stay.landlordId) {
            await createNotification({
                userId: stay.landlordId,
                title: '📄 Người thuê đã tải lên Hợp đồng lưu trú',
                message: `Người thuê ${req.user.fullName || 'Người thuê'} đã đính kèm hợp đồng thuê cho phòng "${room?.title || 'Phòng'}". Nhấn vào để đối chiếu và xác nhận.`,
                type: 'stay_contract_uploaded',
                referenceId: stay._id,
                link: `/xac-nhan-luu-tru/${rawToken}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã tải lên tệp hợp đồng thành công! Chủ trọ đã nhận được yêu cầu xác thực.',
            data: {
                stayId: stay._id,
                contractFileUrl: stay.contractFileUrl,
                confirmationUrl: `/xac-nhan-luu-tru/${rawToken}`
            }
        });
    } catch (error) {
        console.error('Lỗi upload contract:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải tệp hợp đồng', error: error.message });
    }
});

// ==========================================
// 4. TRUY CẬP TỆP HỢP ĐỒNG AN TOÀN (Private Access)
// Chỉ Tenant, Landlord và Admin mới được xem
// ==========================================
router.get('/:id/contract-file', protect, async (req, res) => {
    try {
        const stay = await Stay.findById(req.params.id);
        if (!stay || !stay.contractFilePath) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tệp hợp đồng.' });
        }

        const userId = String(req.user._id || req.user.id);
        const isTenant = String(stay.tenantId) === userId;
        const isLandlord = String(stay.landlordId) === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isTenant && !isLandlord && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tệp hợp đồng bảo mật này.' });
        }

        if (!fs.existsSync(stay.contractFilePath)) {
            return res.status(404).json({ success: false, message: 'Tệp hợp đồng vật lý không tồn tại trên hệ thống.' });
        }

        res.sendFile(stay.contractFilePath);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi tải tệp hợp đồng', error: err.message });
    }
});

// ==========================================
// 5. BÁO CÁO TRANH CHẤP LƯU TRÚ (Dispute)
// ==========================================
router.post('/:id/dispute', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = String(req.user._id || req.user.id);

        const stay = await Stay.findById(id);
        if (!stay) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt lưu trú.' });
        }

        const isTenant = String(stay.tenantId) === userId;
        const isLandlord = String(stay.landlordId) === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isTenant && !isLandlord && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền khiếu nại đợt lưu trú này.' });
        }

        stay.status = 'disputed';
        stay.disputeReason = reason || 'Có tranh chấp về đợt lưu trú giữa hai bên.';
        await stay.save();

        res.status(200).json({
            success: true,
            message: 'Đã ghi nhận tranh chấp. Ban Quản trị SmartStay sẽ tiến hành can thiệp thẩm định.',
            data: stay
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi ghi nhận tranh chấp', error: error.message });
    }
});

// ==========================================
// 6. DANH SÁCH LƯU TRÚ CỦA NGƯỜI THUÊ HIỆN TẠI
// ==========================================
router.get('/mine', protect, async (req, res) => {
    try {
        const tenantId = req.user._id || req.user.id;
        const stays = await Stay.find({ tenantId })
            .populate('roomId', 'title address price image_url images campus contactPhone')
            .populate('landlordId', 'fullName email phone')
            .sort({ createdAt: -1 });

        // Gắn kèm trạng thái điều kiện đánh giá cho mỗi stay
        const enrichedStays = await Promise.all(stays.map(async (stay) => {
            const stayObj = stay.toObject({ virtuals: true });
            if (stay.roomId?._id) {
                const eligibility = await canUserReview(tenantId, stay.roomId._id);
                stayObj.reviewEligibility = eligibility;
            }
            return stayObj;
        }));

        res.status(200).json({
            success: true,
            count: enrichedStays.length,
            data: enrichedStays
        });
    } catch (error) {
        console.error('Lỗi get mine stays:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải danh sách lưu trú', error: error.message });
    }
});

// ==========================================
// 7. KIỂM TRA TRẠNG THÁI LƯU TRÚ TẠI PHÒNG CỤ THỂ
// ==========================================
router.get('/room/:roomId/my-status', protect, async (req, res) => {
    try {
        const { roomId } = req.params;
        const tenantId = req.user._id || req.user.id;

        const stay = await Stay.findOne({
            tenantId,
            roomId
        }).sort({ createdAt: -1 });

        const eligibility = await canUserReview(tenantId, roomId);

        res.status(200).json({
            success: true,
            hasStay: Boolean(stay),
            stay: stay ? stay.toObject({ virtuals: true }) : null,
            eligibility
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái lưu trú', error: error.message });
    }
});

module.exports = router;
