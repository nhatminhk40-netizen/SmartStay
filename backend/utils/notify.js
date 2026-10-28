const Notification = require('../models/Notification');

let inMemoryNotifications = [];

/**
 * Tạo và gửi thông báo trong hệ thống SmartStay
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} params.type
 * @param {string} [params.referenceId]
 * @param {string} [params.link]
 */
const createNotification = async ({ userId, title, message, type = 'system', referenceId = '', link = '' }) => {
    try {
        if (!userId) return null;

        // Lưu vào DB nếu có kết nối
        try {
            const notif = await Notification.create({
                user: userId,
                title,
                message,
                type,
                referenceId,
                link
            });
            return notif;
        } catch (dbErr) {
            // Fallback lưu memory
            const memoryNotif = {
                _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                user: String(userId),
                title,
                message,
                type,
                referenceId,
                link,
                read: false,
                createdAt: new Date()
            };
            inMemoryNotifications.unshift(memoryNotif);
            if (inMemoryNotifications.length > 200) inMemoryNotifications.pop();
            return memoryNotif;
        }
    } catch (err) {
        console.warn('⚠️ Lỗi tạo thông báo:', err.message);
        return null;
    }
};

/**
 * Lấy danh sách thông báo của user
 */
const getUserNotifications = async (userId) => {
    try {
        const notifs = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30);
        return notifs;
    } catch (err) {
        return inMemoryNotifications.filter(n => String(n.user) === String(userId));
    }
};

/**
 * Đánh dấu đã đọc
 */
const markAsRead = async (userId, notifId) => {
    try {
        if (notifId === 'all') {
            await Notification.updateMany({ user: userId, read: false }, { read: true });
            inMemoryNotifications.forEach(n => {
                if (String(n.user) === String(userId)) n.read = true;
            });
            return true;
        }
        await Notification.findOneAndUpdate({ _id: notifId, user: userId }, { read: true });
        const item = inMemoryNotifications.find(n => n._id === notifId && String(n.user) === String(userId));
        if (item) item.read = true;
        return true;
    } catch (err) {
        return false;
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead
};
