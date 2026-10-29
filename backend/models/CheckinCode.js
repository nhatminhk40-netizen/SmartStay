const mongoose = require('mongoose');

const checkinCodeSchema = new mongoose.Schema({
    codeHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    landlordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: MongoDB tự động dọn dẹp khi hết hạn
    },
    isRedeemed: {
        type: Boolean,
        default: false,
        index: true
    },
    redeemedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    redeemedAt: {
        type: Date,
        default: null
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('CheckinCode', checkinCodeSchema);

