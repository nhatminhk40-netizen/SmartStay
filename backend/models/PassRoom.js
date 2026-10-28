const mongoose = require('mongoose');

const passRoomSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Vui lòng nhập tiêu đề phòng pass'], 
        trim: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    address: { 
        type: String, 
        required: [true, 'Vui lòng nhập địa chỉ phòng'], 
        trim: true 
    },
    campus: { 
        type: String, 
        required: [true, 'Vui lòng chọn khu vực trường học'], 
        trim: true 
    },
    area_sqm: { 
        type: Number, 
        default: 20 
    },
    room_type: { 
        type: String, 
        default: 'Phòng trọ khép kín' 
    },
    images: [{ 
        type: String 
    }],
    contractImages: [{ 
        type: String 
    }],

    // Tài chính & Thời hạn
    monthlyRent: { 
        type: Number, 
        required: [true, 'Vui lòng nhập giá thuê mỗi tháng'] 
    },
    passPrice: { 
        type: Number, 
        required: [true, 'Vui lòng nhập số tiền nhượng lại cho người nhận (giá pass)'] 
    },
    depositAmount: { 
        type: Number, 
        required: [true, 'Vui lòng nhập số tiền cọc đã đóng trước đó cho chủ trọ'] 
    },
    remainingMonths: { 
        type: Number, 
        required: [true, 'Vui lòng nhập số tháng hợp đồng còn lại'],
        min: 1 
    },
    moveInDate: { 
        type: Date 
    },
    isFlexibleMoveIn: { 
        type: Boolean, 
        default: false 
    },

    // Tiện ích & Nội quy
    amenities: [{ 
        type: String 
    }],
    rules: [{ 
        type: String 
    }],

    // Thông tin chủ trọ (PRIVATE: chỉ trả cho owner/admin, không công khai cho người xem)
    landlordName: { 
        type: String, 
        required: [true, 'Vui lòng nhập họ tên chủ trọ'],
        trim: true 
    },
    landlordPhone: { 
        type: String, 
        required: [true, 'Vui lòng nhập số điện thoại chủ trọ'],
        trim: true 
    },
    landlordEmail: { 
        type: String, 
        trim: true, 
        lowercase: true,
        default: '' 
    },

    // Trạng thái Pass phòng
    status: {
        type: String,
        enum: [
            'draft',
            'pending_landlord',
            'verified',
            'reserved',
            'completed',
            'rejected',
            'expired',
            'cancelled'
        ],
        default: 'pending_landlord',
        index: true
    },

    // Bảo mật xác nhận của chủ trọ (Link /xac-nhan-pass/<token>)
    landlordConfirmation: {
        tokenHash: { 
            type: String, 
            index: true,
            select: false // Mặc định không trả trong query thường
        },
        expiresAt: { 
            type: Date 
        },
        confirmedAt: { 
            type: Date 
        },
        rejectedAt: { 
            type: Date 
        },
        note: { 
            type: String, 
            default: '' 
        }
    },

    // Chủ sở hữu tin (Người đang thuê cần pass phòng)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    posterName: { 
        type: String, 
        default: 'Sinh viên' 
    },
    posterPhone: { 
        type: String, 
        default: '' 
    },
    ownerEmail: { 
        type: String, 
        default: '' 
    },

    // Tương tác & Thống kê
    viewCount: { 
        type: Number, 
        default: 0 
    },
    savedBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],

    // Báo cáo vi phạm / nghi vấn lừa đảo
    reports: [{
        reportedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        reporterEmail: { type: String, default: '' },
        reporterName: { type: String, default: '' },
        reason: { 
            type: String, 
            required: true 
        },
        description: { 
            type: String, 
            default: '' 
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
    }],

    // Yêu cầu nhận phòng (Reservation)
    reservation: {
        requestedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        requesterName: { type: String, default: '' },
        requesterPhone: { type: String, default: '' },
        message: { type: String, default: '' },
        requestedAt: { type: Date },
        respondedAt: { type: Date },
        status: { 
            type: String, 
            enum: ['none', 'pending', 'accepted', 'rejected'], 
            default: 'none' 
        },
        responseNote: { type: String, default: '' }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Tính số tiền người nhận tiết kiệm được so với tiền cọc gốc đã đóng
passRoomSchema.virtual('savingsAmount').get(function () {
    const deposit = Number(this.depositAmount) || 0;
    const pass = Number(this.passPrice) || 0;
    return Math.max(0, deposit - pass);
});

// Compound indexes phục vụ bộ lọc và sắp xếp
passRoomSchema.index({ status: 1, createdAt: -1 });
passRoomSchema.index({ campus: 1, status: 1 });
passRoomSchema.index({ passPrice: 1, status: 1 });
passRoomSchema.index({ remainingMonths: 1 });

module.exports = mongoose.model('PassRoom', passRoomSchema);
