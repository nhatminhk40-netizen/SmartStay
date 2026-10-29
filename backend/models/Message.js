const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: String,
        required: true,
        index: true
    },
    senderName: {
        type: String,
        default: 'Người dùng'
    },
    recipientId: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    // Trạng thái kiểm duyệt thông tin cá nhân (SĐT / Zalo)
    containsSensitiveInfo: {
        type: Boolean,
        default: false,
        index: true
    },
    sensitiveType: {
        type: String,
        enum: ['none', 'phone', 'contact_keywords'],
        default: 'none'
    },
    detectedPhone: {
        type: String,
        default: ''
    },
    maskedText: {
        type: String,
        default: ''
    },
    redirectZalo: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    clientMsgId: {
        type: String,
        default: '',
        index: true
    }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
