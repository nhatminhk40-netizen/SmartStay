const Stay = require('../models/Stay');
const Review = require('../models/Review');
const Room = require('../models/Room');

const MIN_STAY_DAYS = parseInt(process.env.MIN_STAY_DAYS, 10) || 14;
const MAX_REVIEW_WINDOW_DAYS = parseInt(process.env.MAX_REVIEW_WINDOW_DAYS, 10) || 90;

/**
 * Kiểm tra điều kiện được phép đánh giá phòng của một người dùng
 * @param {string} userId - ID người dùng cần kiểm tra
 * @param {string} roomId - ID phòng trọ
 * @param {Object} [options] - Tuỳ chọn DB fallback hoặc test mock
 * @returns {Promise<{eligible: boolean, code: string, message: string, stayId?: string, stayDurationMonths?: number}>}
 */
async function canUserReview(userId, roomId, options = {}) {
    if (!userId || !roomId) {
        return {
            eligible: false,
            code: 'INVALID_PARAMETERS',
            message: 'Thiếu thông tin người dùng hoặc phòng trọ.'
        };
    }

    // 1. Kiểm tra phòng và quyền sở hữu (Chủ trọ không được tự review phòng mình)
    let room = options.mockRoom;
    if (!room) {
        try {
            room = await Room.findById(roomId);
        } catch (e) {
            // bỏ qua lỗi nếu dùng mock
        }
    }

    if (room && room.owner && String(room.owner) === String(userId)) {
        return {
            eligible: false,
            code: 'LANDLORD_CANNOT_REVIEW',
            message: 'Chủ nhà trọ không thể tự gửi đánh giá cho phòng của chính mình.'
        };
    }

    // 2. Tìm bản ghi Stay hợp lệ
    let stay = options.mockStay;
    if (options.mockStay === undefined) {
        try {
            stay = await Stay.findOne({
                tenantId: userId,
                roomId: roomId,
                status: { $in: ['active', 'completed'] }
            }).sort({ createdAt: -1 });
        } catch (e) {
            console.warn('Lỗi query Stay:', e.message);
        }
    }

    // Nếu không có stay active/completed, kiểm tra xem có stay đang requested không
    if (!stay) {
        let requestedStay = options.mockRequestedStay;
        if (options.mockRequestedStay === undefined) {
            try {
                requestedStay = await Stay.findOne({
                    tenantId: userId,
                    roomId: roomId,
                    status: 'requested'
                });
            } catch (e) {
                // ignore
            }
        }

        if (requestedStay) {
            return {
                eligible: false,
                code: 'STAY_PENDING_CONFIRMATION',
                message: 'Yêu cầu nhận phòng của bạn đang chờ chủ trọ xác nhận.',
                stayId: requestedStay._id
            };
        }

        return {
            eligible: false,
            code: 'NO_VERIFIED_STAY',
            message: 'Chỉ tài khoản đã thực sự sinh sống tại phòng này (được chủ trọ xác nhận) mới có thể gửi đánh giá.'
        };
    }

    // 3. Kiểm tra số ngày đã ở tối thiểu (MIN_STAY_DAYS)
    const checkInTime = new Date(stay.checkInDate).getTime();
    const nowTime = options.mockNow ? new Date(options.mockNow).getTime() : Date.now();
    const checkOutTime = stay.checkOutDate ? new Date(stay.checkOutDate).getTime() : nowTime;

    const daysStayed = Math.max(0, Math.floor((Math.min(checkOutTime, nowTime) - checkInTime) / (1000 * 60 * 60 * 24)));

    if (stay.status === 'active' && daysStayed < MIN_STAY_DAYS) {
        const daysLeft = MIN_STAY_DAYS - daysStayed;
        const availableDate = new Date(checkInTime + MIN_STAY_DAYS * 24 * 60 * 60 * 1000);
        return {
            eligible: false,
            code: 'STAY_TOO_SHORT',
            daysStayed,
            daysLeft,
            minStayDays: MIN_STAY_DAYS,
            availableDate,
            message: `Bạn cần ở tối thiểu ${MIN_STAY_DAYS} ngày để gửi đánh giá (hiện tại: ${daysStayed} ngày, còn ${daysLeft} ngày nữa).`
        };
    }

    // 4. Nếu đã completed (trả trọ), kiểm tra thời hạn tối đa 90 ngày
    if (stay.status === 'completed' && stay.checkOutDate) {
        const daysSinceCheckout = Math.floor((nowTime - new Date(stay.checkOutDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCheckout > MAX_REVIEW_WINDOW_DAYS) {
            return {
                eligible: false,
                code: 'REVIEW_WINDOW_EXPIRED',
                daysSinceCheckout,
                maxDays: MAX_REVIEW_WINDOW_DAYS,
                message: `Thời hạn đánh giá phòng đã hết (chỉ cho phép đánh giá trong vòng ${MAX_REVIEW_WINDOW_DAYS} ngày sau khi trả phòng).`
            };
        }
    }

    // 5. Kiểm tra xem Stay này đã gửi review chưa (Mỗi Stay chỉ 1 review)
    let existingReview = options.mockExistingReview;
    if (options.mockExistingReview === undefined) {
        try {
            existingReview = await Review.findOne({ stayId: stay._id });
        } catch (e) {
            // ignore
        }
    }

    if (existingReview) {
        return {
            eligible: false,
            code: 'ALREADY_REVIEWED',
            reviewId: existingReview._id,
            message: 'Bạn đã gửi đánh giá cho đợt lưu trú này rồi.'
        };
    }

    // 6. Tính số tháng lưu trú hợp lệ
    const stayDurationMonths = Math.max(1, Math.round(daysStayed / 30));

    return {
        eligible: true,
        code: 'ELIGIBLE',
        message: 'Bạn đủ điều kiện gửi đánh giá trải nghiệm thực tế.',
        stayId: stay._id,
        stayStatus: stay.status,
        daysStayed,
        stayDurationMonths,
        checkInDate: stay.checkInDate
    };
}

module.exports = {
    canUserReview,
    MIN_STAY_DAYS,
    MAX_REVIEW_WINDOW_DAYS
};
