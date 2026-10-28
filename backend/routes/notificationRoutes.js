const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserNotifications, markAsRead } = require('../utils/notify');

router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const notifs = await getUserNotifications(userId);
        res.status(200).json({ success: true, count: notifs.length, data: notifs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tải thông báo', error: error.message });
    }
});

router.patch('/:id/read', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { id } = req.params;
        await markAsRead(userId, id);
        res.status(200).json({ success: true, message: 'Đã đánh dấu thông báo đã đọc' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo', error: error.message });
    }
});

module.exports = router;
