const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    studentEmail: { type: String, default: '' },
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

    // Xác thực người từng ở & độ uy tín (Không để client tùy ý gán)
    has_stayed: { type: Boolean, default: false }, // Mặc định FALSE - Chỉ gán TRUE khi có minh chứng
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    verificationProofUrl: { type: String, default: '' }, // Hóa đơn tiền điện/nước hoặc hợp đồng thuê
    trust_score: { type: Number, default: 50 },          // Điểm tin cậy (0 - 100), do server tính toán
    stayed_period: { type: String, default: 'Người thuê quan tâm' },
    isDemo: { type: Boolean, default: false }
}, { timestamps: true });

reviewSchema.pre('save', function () {
    if (!this.anonymous_name && this.studentName) {
        this.anonymous_name = this.studentName;
    }
    if (!this.content && this.comment) {
        this.content = this.comment;
    }
    // Nếu có minh chứng đã được duyệt, gắn nhãn has_stayed = true và tăng điểm trust_score
    if (this.verificationStatus === 'verified') {
        this.has_stayed = true;
        this.trust_score = Math.max(this.trust_score, 90);
    }
});

module.exports = mongoose.model('Review', reviewSchema);