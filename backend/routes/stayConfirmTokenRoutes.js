const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const Stay = require('../models/Stay');
const Room = require('../models/Room');
const { createNotification } = require('../utils/notify');

const confirmRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đã thao tác quá nhiều lần từ IP này. Vui lòng thử lại sau 15 phút.'
    }
});

router.use(confirmRateLimiter);

// 1. Xem thông tin token xác thực hợp đồng lưu trú
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const stay = await Stay.findOne({
            contractConfirmationTokenHash: tokenHash,
            contractConfirmationExpiresAt: { $gt: new Date() }
        })
        .populate('tenantId', 'fullName email phone avatar campus')
        .populate('roomId', 'title address price campus contactPhone image_url');

        if (!stay) {
            return res.status(404).json({
                success: false,
                message: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 72 giờ).'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                stayId: stay._id,
                status: stay.status,
                tenant: stay.tenantId,
                room: stay.roomId,
                contractFileUrl: `/api/stay-confirmation/${token}/contract-file`,
                expiresAt: stay.contractConfirmationExpiresAt,
                createdAt: stay.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tra cứu mã xác thực', error: error.message });
    }
});

// 2. Tải/Xem tệp hợp đồng bằng token an toàn
router.get('/:token/contract-file', async (req, res) => {
    try {
        const { token } = req.params;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const stay = await Stay.findOne({
            contractConfirmationTokenHash: tokenHash,
            contractConfirmationExpiresAt: { $gt: new Date() }
        });

        if (!stay || !stay.contractFilePath) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tệp hợp đồng hoặc liên kết đã hết hạn.'
            });
        }

        if (!fs.existsSync(stay.contractFilePath)) {
            return res.status(404).json({ success: false, message: 'Tệp không còn tồn tại trên máy chủ.' });
        }

        res.sendFile(stay.contractFilePath);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải tệp hợp đồng', error: error.message });
    }
});

// 3. Chủ trọ xác nhận hoặc từ chối thông qua token
router.post('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { action, note } = req.body; // 'confirm' | 'reject'
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const stay = await Stay.findOne({
            contractConfirmationTokenHash: tokenHash,
            contractConfirmationExpiresAt: { $gt: new Date() }
        }).populate('roomId').populate('tenantId');

        if (!stay) {
            return res.status(404).json({
                success: false,
                message: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.'
            });
        }

        if (action === 'confirm') {
            stay.status = 'active';
            stay.checkInDate = new Date();
            stay.checkInConfirmedBy = 'contract_token';
            stay.contractConfirmationTokenHash = null; // Huỷ token sau khi dùng một lần
            if (note) stay.landlordNote = note;
            await stay.save();

            if (stay.tenantId) {
                await createNotification({
                    userId: stay.tenantId._id || stay.tenantId,
                    title: '🎉 Hợp đồng lưu trú đã được Chủ trọ xác nhận!',
                    message: `Chủ trọ đã xác nhận hợp đồng và đợt lưu trú của bạn tại "${stay.roomId?.title || 'Phòng'}". Bạn đã được công nhận là người thuê chính thức!`,
                    type: 'stay_contract_confirmed',
                    referenceId: stay._id,
                    link: `/phong/${stay.roomId?._id}`
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Đã xác nhận đợt lưu trú thành công! Người thuê hiện đã được kích hoạt lưu trú.',
                data: stay
            });
        } else if (action === 'reject') {
            stay.status = 'cancelled';
            stay.contractConfirmationTokenHash = null;
            stay.landlordNote = note || 'Chủ trọ từ chối xác nhận hợp đồng này.';
            await stay.save();

            if (stay.tenantId) {
                await createNotification({
                    userId: stay.tenantId._id || stay.tenantId,
                    title: '⚠️ Chủ trọ từ chối xác nhận hợp đồng lưu trú',
                    message: `Chủ trọ đã từ chối xác nhận hợp đồng tại "${stay.roomId?.title || 'Phòng'}". Lý do: ${note || 'Không hợp lệ'}`,
                    type: 'stay_contract_rejected',
                    referenceId: stay._id,
                    link: `/phong/${stay.roomId?._id}`
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Đã từ chối xác nhận hợp đồng.',
                data: stay
            });
        }

        res.status(400).json({ success: false, message: 'Hành động không hợp lệ (confirm hoặc reject).' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xác thực lưu trú', error: error.message });
    }
});

module.exports = router;
