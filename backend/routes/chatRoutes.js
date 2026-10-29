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

// Helper escape regex
const escapeRegex = (str) => (str ? str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '');

/**
 * 1. LẤY DANH SÁCH CUỘC TRÒ CHUYỆN CỦA MỘT NGƯỜI DÙNG (THEO USERID HOẶC TÊN)
 * GET /api/chat/conversations?userId=...&name=...&phone=...
 */
// Hàm dùng chung tìm kiếm hội thoại (dùng cho cả GET và POST search an toàn)
const handleFindConversations = async (req, res, { userId, name, phone }) => {
    try {
        if (!userId && !name && !phone) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp thông tin định danh (userId, name hoặc phone)' });
        }

        const isDb = req.app.locals.isDbConnected;
        if (isDb) {
            const queryConditions = [];
            if (userId) {
                queryConditions.push({ participants: String(userId) });
                queryConditions.push({ 'participantDetails.id': String(userId) });
            }
            if (name && name.trim()) {
                const cleanName = name.trim();
                queryConditions.push({
                    'participantDetails.name': new RegExp(`^${escapeRegex(cleanName)}$`, 'i')
                });
            }
            if (phone && phone.trim()) {
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                if (cleanPhone.length >= 9) {
                    queryConditions.push({ 'participantDetails.phone': cleanPhone });
                }
            }

            const list = await Conversation.find({ $or: queryConditions }).sort({ updatedAt: -1 });
            return res.status(200).json({ success: true, count: list.length, data: list });
        }

        // Fallback
        const cleanName = name?.trim().toLowerCase();
        const cleanPhone = phone?.replace(/[^0-9]/g, '');
        const list = fallbackConversations
            .filter((c) => {
                const matchId = userId && (c.participants.includes(String(userId)) || c.participantDetails?.some((p) => String(p.id) === String(userId)));
                const matchName = cleanName && c.participantDetails?.some((p) => p.name?.trim().toLowerCase() === cleanName);
                const matchPhone = cleanPhone && cleanPhone.length >= 9 && c.participantDetails?.some((p) => p.phone?.replace(/[^0-9]/g, '') === cleanPhone);
                return matchId || matchName || matchPhone;
            })
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 1A. LẤY DANH SÁCH CUỘC TRÒ CHUYỆN (BẢO MẬT: TRUYỀN QUA POST BODY CHỐNG LỘ PII TRÊN URL - CWE-598)
 * POST /api/chat/conversations/search
 */
router.post('/conversations/search', async (req, res) => {
    const { userId, name, phone } = req.body || {};
    return handleFindConversations(req, res, { userId, name, phone });
});

/**
 * 1B. LẤY DANH SÁCH CUỘC TRÒ CHUYỆN (GET)
 * GET /api/chat/conversations?userId=...
 */
router.get('/conversations', async (req, res) => {
    const { userId, name, phone } = req.query;
    return handleFindConversations(req, res, { userId, name, phone });
});

/**
 * 2. TẠO HOẶC LẤY CUỘC TRÒ CHUYỆN GIỮA 2 NGƯỜI DÙNG
 */
router.post('/conversations', async (req, res) => {
    try {
        const { participantA, participantB } = req.body;
        if (!participantA?.id || !participantB?.id) {
            return res.status(400).json({ success: false, message: 'Cần thông tin participantA và participantB' });
        }

        const idA = String(participantA.id);
        const idB = String(participantB.id);
        const nameA = participantA.name?.trim() || '';
        const nameB = participantB.name?.trim() || '';

        const isDb = req.app.locals.isDbConnected;
        if (isDb) {
            // Tìm cuộc trò chuyện chứa cả 2 thành viên (theo id hoặc cặp tên)
            let conv = await Conversation.findOne({
                $or: [
                    { participants: { $all: [idA, idB] } },
                    {
                        $and: [
                            { 'participantDetails.name': new RegExp(`^${escapeRegex(nameA)}$`, 'i') },
                            { 'participantDetails.name': new RegExp(`^${escapeRegex(nameB)}$`, 'i') }
                        ]
                    }
                ]
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
                    const idx = details.findIndex((d) => d.id === String(p.id) || (p.name && d.name?.toLowerCase() === p.name.toLowerCase()));
                    if (idx !== -1) {
                        if (p.phone && !details[idx].phone) {
                            details[idx].phone = p.phone;
                            updated = true;
                        }
                        if (p.name && details[idx].name !== p.name) {
                            details[idx].name = p.name;
                            updated = true;
                        }
                        if (p.id && !conv.participants.includes(String(p.id))) {
                            conv.participants.push(String(p.id));
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
                        if (!conv.participants.includes(String(p.id))) {
                            conv.participants.push(String(p.id));
                        }
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
        let conv = fallbackConversations.find((c) => {
            const hasBothIds = c.participants.includes(idA) && c.participants.includes(idB);
            const hasBothNames = nameA && nameB && c.participantDetails?.some((p) => p.name?.toLowerCase() === nameA.toLowerCase()) && c.participantDetails?.some((p) => p.name?.toLowerCase() === nameB.toLowerCase());
            return hasBothIds || hasBothNames;
        });

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
        } else {
            if (!conv.participants.includes(idA)) conv.participants.push(idA);
            if (!conv.participants.includes(idB)) conv.participants.push(idB);
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
        const { conversationId, senderId, senderName, recipientId, recipientName, text, recipientPhone, clientMsgId } = req.body;
        if (!conversationId || !senderId || !recipientId || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: conversationId, senderId, recipientId, text'
            });
        }

        // 1. Phân tích nội dung: phát hiện SĐT hoặc từ khóa trao đổi liên hệ
        const inspection = inspectSensitiveContent(text);

        const containsSensitiveInfo = inspection.containsSensitiveInfo;
        const detectedPhone = inspection.cleanPhone || recipientPhone || '';
        const maskedText = inspection.maskedText;

        const isDb = req.app.locals.isDbConnected;
        let savedMessage;

        if (isDb && mongoose.Types.ObjectId.isValid(conversationId)) {
            // Chống trùng lặp tại server theo clientMsgId hoặc cùng nội dung trong vòng 3s
            if (clientMsgId) {
                const existing = await Message.findOne({ conversationId, clientMsgId });
                if (existing) {
                    return res.status(200).json({ success: true, data: existing });
                }
            }
            const duplicateRecent = await Message.findOne({
                conversationId,
                senderId: String(senderId),
                text: text.trim(),
                createdAt: { $gte: new Date(Date.now() - 3000) }
            });
            if (duplicateRecent) {
                return res.status(200).json({ success: true, data: duplicateRecent });
            }

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
                clientMsgId: clientMsgId || '',
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
            // Fallback in-memory
            if (clientMsgId) {
                const existing = fallbackMessages.find(m => String(m.conversationId) === String(conversationId) && m.clientMsgId === clientMsgId);
                if (existing) {
                    return res.status(200).json({ success: true, data: existing });
                }
            }
            const duplicateRecent = fallbackMessages.find(m =>
                String(m.conversationId) === String(conversationId) &&
                String(m.senderId) === String(senderId) &&
                m.text === text.trim() &&
                Math.abs(Date.now() - new Date(m.createdAt || 0).getTime()) < 3000
            );
            if (duplicateRecent) {
                return res.status(200).json({ success: true, data: duplicateRecent });
            }

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
                clientMsgId: clientMsgId || '',
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

            // Phát cho riêng người nhận theo ID
            io.to(`user_${recipientId}`).emit('chat:notification', {
                conversationId,
                message: savedMessage
            });

            // Phát theo tên người nhận (ví dụ: 'user_name_minh') để tab đối phương nhận ngay
            if (recipientName) {
                const norm = recipientName.trim().toLowerCase();
                io.to(`user_name_${norm}`).emit('chat:message', savedMessage);
                io.to(`user_name_${norm}`).emit('chat:notification', {
                    conversationId,
                    message: savedMessage
                });
            }
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
