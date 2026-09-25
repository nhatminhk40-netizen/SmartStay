const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    studentName: { type: String, default: 'Sinh viên ẩn danh' },
    anonymous_name: { type: String, default: 'Sinh viên ẩn danh' },
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
    comment: { type: String, required: true },
    content: { type: String }, // Đồng bộ alias cho comment

    // Xác thực người từng ở & độ uy tín
    has_stayed: { type: Boolean, default: true }, // Tag xác thực "Đã ở"
    trust_score: { type: Number, default: 95 },    // Điểm tin cậy (0 - 100)
    stayed_period: { type: String, default: 'Đã từng ở tại đây' }
}, { timestamps: true });

reviewSchema.pre('save', function (next) {
    if (!this.anonymous_name && this.studentName) {
        this.anonymous_name = this.studentName;
    }
    if (!this.content && this.comment) {
        this.content = this.comment;
    }
    next();
});

module.exports = mongoose.model('Review', reviewSchema);