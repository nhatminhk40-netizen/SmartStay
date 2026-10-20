const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    codeHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0 // TTL index: MongoDB sẽ tự động xóa document khi thời gian hiện tại vượt quá expiresAt
    },
    attempts: {
        type: Number,
        default: 0
    },
    purpose: {
        type: String,
        enum: ['REGISTER', 'RESET_PASSWORD', 'VERIFY_EMAIL'],
        default: 'VERIFY_EMAIL'
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Đánh index phục vụ tra cứu nhanh theo email và purpose
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('Otp', otpSchema);
