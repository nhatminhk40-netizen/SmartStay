const path = require('path');
const fs = require('fs');
const PassRoom = require('../models/PassRoom');
const { createNotification } = require('./notify');

const FALLBACK_PASS_FILE = path.join(__dirname, '../fallback_pass_rooms.json');

const checkAndExpirePassRooms = async (isDbConnected) => {
    const now = new Date();

    try {
        if (isDbConnected) {
            // 1. Quá 72 giờ mà chủ trọ chưa phản hồi -> expired
            const pendingExpired = await PassRoom.find({
                status: 'pending_landlord',
                'landlordConfirmation.expiresAt': { $lt: now }
            });

            for (const r of pendingExpired) {
                r.status = 'expired';
                await r.save();
                if (r.owner) {
                    await createNotification({
                        userId: r.owner,
                        title: 'Tin Pass phòng đã hết hạn xác nhận',
                        message: `Yêu cầu xác nhận phòng "${r.title}" đã quá thời hạn 72 giờ mà chủ trọ chưa phản hồi. Bạn có thể tạo lại link mới trong mục Quản lý tin!`,
                        type: 'pass_expired',
                        referenceId: String(r._id),
                        link: '/pass-phong/cua-toi'
                    });
                }
            }

            // 2. Phòng đã quá ngày chuyển nhượng mà chưa hoàn thành
            const moveInExpired = await PassRoom.find({
                status: 'verified',
                moveInDate: { $lt: now, $ne: null }
            });

            for (const r of moveInExpired) {
                r.status = 'expired';
                await r.save();
            }

            return;
        }

        // Fallback JSON check
        if (fs.existsSync(FALLBACK_PASS_FILE)) {
            const list = JSON.parse(fs.readFileSync(FALLBACK_PASS_FILE, 'utf8'));
            let changed = false;

            for (const r of list) {
                if (r.status === 'pending_landlord' && r.landlordConfirmation?.expiresAt) {
                    if (now > new Date(r.landlordConfirmation.expiresAt)) {
                        r.status = 'expired';
                        changed = true;
                        if (r.owner) {
                            createNotification({
                                userId: r.owner,
                                title: 'Tin Pass phòng đã hết hạn xác nhận',
                                message: `Yêu cầu xác nhận phòng "${r.title}" đã quá 72 giờ chưa có phản hồi. Bạn có thể tạo link mới trong Quản lý tin.`,
                                type: 'pass_expired',
                                referenceId: String(r._id || r.id),
                                link: '/pass-phong/cua-toi'
                            });
                        }
                    }
                }
            }

            if (changed) {
                fs.writeFileSync(FALLBACK_PASS_FILE, JSON.stringify(list, null, 2), 'utf8');
            }
        }
    } catch (err) {
        console.warn('⚠️ Lỗi kiểm tra cron PassRoom expired:', err.message);
    }
};

const startPassRoomCron = (getIsDbConnected) => {
    // Chạy kiểm tra sau khi server khởi động 10 giây
    setTimeout(() => {
        checkAndExpirePassRooms(getIsDbConnected());
    }, 10000);

    // Chạy định kỳ mỗi 30 phút
    setInterval(() => {
        checkAndExpirePassRooms(getIsDbConnected());
    }, 30 * 60 * 1000);

    console.log('⏱️ Đã kích hoạt PassRoom Auto-Expire Cron Job (chu kỳ 30 phút).');
};

module.exports = {
    startPassRoomCron,
    checkAndExpirePassRooms
};
