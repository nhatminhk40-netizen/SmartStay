const Stay = require('../models/Stay');
const Contract = require('../models/Contract');
const { createNotification } = require('./notify');

/**
 * Tự động hoàn tất (completed) các đợt lưu trú đã quá hạn hợp đồng nếu không có tranh chấp
 */
const checkAndCompleteExpiredStays = async (isDbConnected) => {
    if (!isDbConnected) return;

    try {
        const now = new Date();
        // Tìm các Stay active có contractId
        const activeStays = await Stay.find({
            status: 'active',
            contractId: { $ne: null }
        }).populate('contractId');

        for (const stay of activeStays) {
            if (stay.contractId && stay.contractId.endDate && new Date(stay.contractId.endDate) < now) {
                stay.status = 'completed';
                stay.checkOutDate = stay.contractId.endDate;
                stay.checkOutConfirmedBy = 'auto_contract_expired';
                await stay.save();

                // Gửi thông báo cho người thuê
                if (stay.tenantId) {
                    await createNotification({
                        userId: stay.tenantId,
                        title: '📅 Hợp đồng lưu trú đã kết thúc',
                        message: 'Thời hạn hợp đồng của bạn đã kết thúc. Hãy để lại đánh giá thực tế cho phòng trọ nhé!',
                        type: 'stay_completed',
                        referenceId: stay._id
                    });
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Lỗi cron checkAndCompleteExpiredStays:', err.message);
    }
};

const startStayCron = (getIsDbConnected) => {
    // Chạy kiểm tra mỗi 1 giờ
    setInterval(() => {
        checkAndCompleteExpiredStays(getIsDbConnected());
    }, 60 * 60 * 1000);
    console.log('⏰ Đã kích hoạt Stay Auto-Complete Cron Job (chu kỳ 60 phút).');
};

module.exports = {
    startStayCron,
    checkAndCompleteExpiredStays
};

