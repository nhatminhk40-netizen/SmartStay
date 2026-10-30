const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: String,
        required: true
    }],
    participantDetails: [{
        id: { type: String, required: true },
        name: { type: String, default: 'Người dùng' },
        avatar: { type: String, default: '' },
        phone: { type: String, default: '' },
        campus: { type: String, default: 'Cần Thơ' },
        role: { type: String, default: 'student' }
    }],
    lastMessage: {
        text: { type: String, default: '' },
        senderId: { type: String, default: '' },
        senderName: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

