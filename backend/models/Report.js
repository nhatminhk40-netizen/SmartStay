const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    ticketCode: {
        type: String,
        required: true,
        unique: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    roomTitle: { type: String, default: '' },
    reporterName: { type: String, default: 'Người thuê SmartStay' },
    reporterContact: { type: String, required: true },
    reason: {
        type: String,
        enum: ['fake_price', 'fake_address', 'fake_photos', 'unauthorized_poster', 'deposit_fraud', 'curfew_issue', 'other'],
        required: true
    },
    description: { type: String, required: true },
    evidenceUrls: [{ type: String }],
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'rejected'],
        default: 'pending'
    },
    resolutionNote: { type: String, default: 'Đang tiếp nhận hồ sơ khiếu nại. SmartStay sẽ liên hệ trong 24h làm việc.' },
    resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
