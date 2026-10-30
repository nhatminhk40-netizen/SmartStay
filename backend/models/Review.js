const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    stayId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stay',
        default: null
    },

    studentEmail: { type: String, default: '' },
    studentName: { type: String, default: 'Sinh viên ẩn danh' },
    anonymous_name: { type: String, default: 'Sinh viên ẩn danh' },
    rating: { type: Number, min: 1, max: 5, required: true },

    // Trọng tâm chi phí thực tế & so sánh với niêm yết
    isCostAccurate: {
        type: Boolean,
        default: true
    },
    matchesListedPrice: {
        type: Boolean,
        default: true
    },
    actualMonthlyCost: {
        type: Number,
        required: true // Tổng chi phí thực tế mỗi tháng sinh viên phải trả (tiền phòng + điện + nước + phụ phí)
    },
    comment: { type: String, required: true, trim: true },
    content: { type: String }, // Đồng bộ alias cho comment

    // Xác thực người từng ở thật (SERVER-MANAGED)
    verified: {
        type: Boolean,
        default: false,
        index: true
    },
    has_stayed: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    stayDurationSnapshot: {
        type: Number,
        default: 0 // Số tháng đã ở tại thời điểm đánh giá
    },
    stayed_period: {
        type: String,
        default: 'Người thuê quan tâm'
    },
    trust_score: {
        type: Number,
        default: 50
    },
    isDemo: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Mỗi Stay chỉ có tối đa 1 review (sparse để các review cũ không có stayId không bị xung đột)
reviewSchema.index({ stayId: 1 }, { unique: true, sparse: true });

reviewSchema.pre('save', function () {
    if (!this.anonymous_name && this.studentName) {
        this.anonymous_name = this.studentName;
    }
    if (!this.content && this.comment) {
        this.content = this.comment;
    }
    if (this.verified) {
        this.has_stayed = true;
        this.verificationStatus = 'verified';
        this.trust_score = Math.max(this.trust_score || 50, 95);
    }
});

module.exports = mongoose.model('Review', reviewSchema);
