const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { inspectSensitiveContent } = require('../utils/sensitiveFilter');

// Fallback in-memory store phòng khi MongoDB offline
let fallbackConversations = [];
let fallbackMessages = [];

// Helper lấy socket io từ app
const getIO = (req) => req.app.locals.io || null;

/**
 * 1. LẤY DANH SÁCH CUỘC TRÒ CHUYỆN CỦA MỘT NGƯỜI DÙNG
 * GET /api/chat/conversations?userId=...
 */
router.get('/conversations', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp userId' });
        }

        const isDb = req.app.locals.isDbConnected;
        if (isDb) {
            const list = await Conversation.find({ participants: String(userId) }).sort({ updatedAt: -1 });
            return res.status(200).json({ success: true, count: list.length, data: list });
        }

        // Fallback
        const list = fallbackConversations
            .filter((c) => c.participants.includes(String(userId)))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * 2. TẠO HOẶC LẤY CUỘC TRÒ CHUYỆN GIỮA 2 NGƯỜI DÙNG
 * POST /api/chat/conversations
 */
router.post('/conversations', async (req, res) => {
    try {
        const { participantA, participantB } = req.body;
        if (!participantA?.id || !participantB?.id) {
            return res.status(400).json({ success: false, message: 'Cần thông tin participantA và participantB' });
        }

        const idA = String(participantA.id);
        const idB = String(participantB.id);

        const isDb = req.app.locals.isDbConnected;
        if (isDb) {
            // Tìm cuộc trò chuyện chứa cả 2 thành viên
            let conv = await Conversation.findOne({
                participants: { $all: [idA, idB] }
            });

            if (!conv) {
                conv = await Conversation.create({
                    participants: [idA, idB],
                    participantDetails: [
                        {
                            id: idA,
                            name: participantA.name || 'Người dùng',
                            avatar: participantA.avatar || '',
                            phone: participantA.phone || '',
                            campus: participantA.campus || 'Cần Thơ',
                            role: participantA.role || 'student'
                        },
                        {
                            id: idB,
                            name: participantB.name || 'Người dùng',
                            avatar: participantB.avatar || '',
                            phone: participantB.phone || '',
                            campus: participantB.campus || 'Cần Thơ',
                            role: participantB.role || 'student'
                        }
                    ],
                    unreadCounts: { [idA]: 0, [idB]: 0 }
                });
            } else {
                // Cập nhật thông tin chi tiết người tham gia nếu có thay đổi
                let updated = false;
                const details = conv.participantDetails || [];
                [participantA, participantB].forEach((p) => {
                    const idx = details.findIndex((d) => d.id === String(p.id));
                    if (idx !== -1) {
                        if (p.phone && !details[idx].phone) {
                            details[idx].phone = p.phone;
                            updated = true;
                        }
                        if (p.name && details[idx].name !== p.name) {
                            details[idx].name = p.name;
                            updated = true;
                        }
                    } else {
                        details.push({
                            id: String(p.id),
                            name: p.name || 'Người dùng',
                            avatar: p.avatar || '',
                            phone: p.phone || '',
                            campus: p.campus || 'Cần Thơ',
                            role: p.role || 'student'
                        });
                        updated = true;
                    }
                });
                if (updated) {
                    conv.participantDetails = details;
                    await conv.save();
                }
            }

            return res.status(200).json({ success: true, data: conv });
        }

        // Fallback in-memory
        let conv = fallbackConversations.find(
            (c) => c.participants.includes(idA) && c.participants.includes(idB)
        );

        if (!conv) {
            conv = {
                _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                id: `conv_${Date.now()}`,
                participants: [idA, idB],
                participantDetails: [
                    {
                        id: idA,
                        name: participantA.name || 'Người dùng',
                        avatar: participantA.avatar || '',
                        phone: participantA.phone || '',
                        campus: participantA.campus || 'Cần Thơ',
                        role: participantA.role || 'student'
                    },
                    {
                        id: idB,
                        name: participantB.name || 'Người dùng',
                        avatar: participantB.avatar || '',
                        phone: participantB.phone || '',
                        campus: participantB.campus || 'Cần Thơ',
                        role: participantB.role || 'student'
                    }
                ],
                lastMessage: { text: '', senderId: '', createdAt: new Date() },
                unreadCounts: { [idA]: 0, [idB]: 0 },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            fallbackConversations.unshift(conv);
        }

        res.status(200).json({ success: true, data: conv });
    } catch (error) {
        console.error('Lỗi tạo/lấy cuộc trò chuyện:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * 3. LẤY LỊCH SỬ TIN NHẮN THEO CUỘC TRÒ CHUYỆN
 * GET /api/chat/messages/:conversationId
 */
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const isDb = req.app.locals.isDbConnected;

        if (isDb && mongoose.Types.ObjectId.isValid(conversationId)) {
            const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
            return res.status(200).json({ success: true, count: messages.length, data: messages });
        }

        // Fallback
        const messages = fallbackMessages
            .filter((m) => String(m.conversationId) === String(conversationId))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        console.error('Lỗi lấy lịch sử tin nhắn:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * 4. GỬI TIN NHẮN (KIỂM DUYỆT THÔNG TIN CÁ NHÂN & MỞ QUA ZALO)
 * POST /api/chat/messages
 */
router.post('/messages', async (req, res) => {
    try {
        const { conversationId, senderId, senderName, recipientId, text, recipientPhone } = req.body;
        if (!conversationId || !senderId || !recipientId || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: conversationId, senderId, recipientId, text'
            });
        }

        // 1. Phân tích nội dung: phát hiện SĐT hoặc từ khóa trao đổi liên hệ
        const inspection = inspectSensitiveContent(text);

        // Nếu phát hiện SĐT hoặc người gửi muốn trao đổi SĐT, thông tin liên lạc được chuẩn bị chuyển qua Zalo
        const containsSensitiveInfo = inspection.containsSensitiveInfo;
        const detectedPhone = inspection.cleanPhone || recipientPhone || '';
        const maskedText = inspection.maskedText;

        const isDb = req.app.locals.isDbConnected;
        let savedMessage;

        if (isDb && mongoose.Types.ObjectId.isValid(conversationId)) {
            savedMessage = await Message.create({
                conversationId,
                senderId: String(senderId),
                senderName: senderName || 'Người dùng',
                recipientId: String(recipientId),
                text: text.trim(),
                containsSensitiveInfo,
                sensitiveType: inspection.sensitiveType,
                detectedPhone,
                maskedText,
                redirectZalo: containsSensitiveInfo,
                read: false
            });

            // Cập nhật Conversation
            const conv = await Conversation.findById(conversationId);
            if (conv) {
                conv.lastMessage = {
                    text: containsSensitiveInfo ? maskedText : text.trim(),
                    senderId: String(senderId),
                    senderName: senderName || 'Người dùng',
                    createdAt: new Date()
                };

                const currentUnread = (conv.unreadCounts?.get(String(recipientId)) || 0) + 1;
                if (!conv.unreadCounts) conv.unreadCounts = new Map();
                conv.unreadCounts.set(String(recipientId), currentUnread);
                await conv.save();
            }
        } else {
            // Fallback
            savedMessage = {
                _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                conversationId: String(conversationId),
                senderId: String(senderId),
                senderName: senderName || 'Người dùng',
                recipientId: String(recipientId),
                text: text.trim(),
                containsSensitiveInfo,
                sensitiveType: inspection.sensitiveType,
                detectedPhone,
                maskedText,
                redirectZalo: containsSensitiveInfo,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            fallbackMessages.push(savedMessage);

            const conv = fallbackConversations.find((c) => String(c._id) === String(conversationId) || String(c.id) === String(conversationId));
            if (conv) {
                conv.lastMessage = {
                    text: containsSensitiveInfo ? maskedText : text.trim(),
                    senderId: String(senderId),
                    senderName: senderName || 'Người dùng',
                    createdAt: new Date()
                };
                conv.updatedAt = new Date();
                conv.unreadCounts = conv.unreadCounts || {};
                conv.unreadCounts[String(recipientId)] = (conv.unreadCounts[String(recipientId)] || 0) + 1;
            }
        }

        // 2. Phát thông báo thời gian thực qua Socket.IO (nếu có client đang kết nối)
        const io = getIO(req);
        if (io) {
            // Phát vào phòng cuộc trò chuyện
            io.to(`conv_${conversationId}`).emit('chat:message', savedMessage);
            // Phát cho riêng người nhận để cập nhật thông báo/badge
            io.to(`user_${recipientId}`).emit('chat:notification', {
                conversationId,
                message: savedMessage
            });
        }

        return res.status(201).json({
            success: true,
            data: savedMessage,
            inspection: {
                containsSensitiveInfo,
                notice: inspection.notice,
                redirectZaloUrl: detectedPhone ? `https://zalo.me/${detectedPhone}` : null
            }
        });
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * 5. ĐÁNH DẤU TIN NHẮN ĐÃ ĐỌC
 * PUT /api/chat/messages/read/:conversationId
 */
router.put('/messages/read/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp userId' });
        }

        const isDb = req.app.locals.isDbConnected;
        if (isDb && mongoose.Types.ObjectId.isValid(conversationId)) {
            await Message.updateMany(
                { conversationId, recipientId: String(userId), read: false },
                { $set: { read: true } }
            );

            const conv = await Conversation.findById(conversationId);
            if (conv && conv.unreadCounts) {
                conv.unreadCounts.set(String(userId), 0);
                await conv.save();
            }
        } else {
            fallbackMessages.forEach((m) => {
                if (String(m.conversationId) === String(conversationId) && String(m.recipientId) === String(userId)) {
                    m.read = true;
                }
            });
            const conv = fallbackConversations.find((c) => String(c._id) === String(conversationId) || String(c.id) === String(conversationId));
            if (conv && conv.unreadCounts) {
                conv.unreadCounts[String(userId)] = 0;
            }
        }

        res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        console.error('Lỗi đánh dấu tin nhắn đã đọc:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

