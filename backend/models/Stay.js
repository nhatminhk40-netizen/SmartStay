const mongoose = require('mongoose');

const staySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vui lòng cung cấp thông tin người thuê']
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Vui lòng cung cấp phòng trọ lưu trú']
    },
    landlordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        default: null
    },

    // Trạng thái đợt lưu trú
    status: {
        type: String,
        enum: ['requested', 'approved', 'active', 'completed', 'cancelled', 'disputed'],
        default: 'requested',
        index: true
    },

    // Phương thức xác minh
    verificationMethod: {
        type: String,
        enum: ['landlord_confirm', 'checkin_code', 'contract_upload'],
        default: 'landlord_confirm'
    },

    // Thời gian lưu trú
    checkInDate: {
        type: Date,
        default: null
    },
    checkOutDate: {
        type: Date,
        default: null
    },

    // Người xác nhận
    checkInConfirmedBy: {
        type: String,
        default: null // 'landlord' | 'admin' | 'system_code'
    },
    checkOutConfirmedBy: {
        type: String,
        default: null // 'landlord' | 'admin' | 'mutual'
    },

    // Tài liệu chứng minh hợp đồng (nếu chọn phương thức contract_upload)
    contractFileUrl: {
        type: String,
        default: ''
    },
    contractFilePath: {
        type: String,
        default: ''
    },
    contractConfirmationTokenHash: {
        type: String,
        default: null,
        select: false
    },
    contractConfirmationExpiresAt: {
        type: Date,
        default: null
    },

    // Ghi chú và trao đổi
    tenantNote: {
        type: String,
        default: ''
    },
    landlordNote: {
        type: String,
        default: ''
    },
    disputeReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index đảm bảo mỗi người thuê chỉ có 1 Stay active/requested tại 1 phòng trong cùng 1 thời điểm
staySchema.index(
    { tenantId: 1, roomId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ['requested', 'approved', 'active'] }
        }
    }
);

// Virtual tính số ngày đã ở
staySchema.virtual('stayDurationDays').get(function () {
    if (!this.checkInDate) return 0;
    const start = new Date(this.checkInDate).getTime();
    const end = this.checkOutDate ? new Date(this.checkOutDate).getTime() : Date.now();
    const diff = Math.max(0, end - start);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual tính số tháng đã ở (tối thiểu 1 tháng nếu đã ở >= 14 ngày, làm tròn chuẩn)
staySchema.virtual('stayDurationMonths').get(function () {
    if (!this.checkInDate) return 0;
    const start = new Date(this.checkInDate).getTime();
    const end = this.checkOutDate ? new Date(this.checkOutDate).getTime() : Date.now();
    const diffDays = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) return 0;
    return Math.max(1, Math.round(diffDays / 30));
});

module.exports = mongoose.model('Stay', staySchema);
