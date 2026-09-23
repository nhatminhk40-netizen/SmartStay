const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    studentName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },

    // Trọng tâm minh bạch của SmartStay
    isCostAccurate: {
        type: Boolean,
        required: true // true: Đúng giá cam kết, false: Có chi phí phát sinh bất thường
    },
    actualMonthlyCost: {
        type: Number,
        required: true // Tổng chi phí thực tế mỗi tháng sinh viên phải trả (tiền phòng + điện + nước + phụ phí)
    },
    comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);