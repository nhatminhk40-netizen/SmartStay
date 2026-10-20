const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema({
    reason: { 
        type: String, 
        required: [true, 'Vui lòng nhập lý do khấu trừ tiền cọc'] 
    },
    amount: { 
        type: Number, 
        required: [true, 'Vui lòng nhập số tiền khấu trừ'],
        min: [0, 'Số tiền khấu trừ không thể âm']
    }
}, { _id: false });

const contractSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Vui lòng chọn phòng trọ']
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vui lòng chọn khách thuê / sinh viên']
    },
    landlord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Hợp đồng cần liên kết với chủ nhà trọ']
    },
    startDate: {
        type: Date,
        required: [true, 'Vui lòng chọn ngày bắt đầu hợp đồng']
    },
    endDate: {
        type: Date
    },
    durationMonths: {
        type: Number,
        required: [true, 'Vui lòng nhập thời hạn hợp đồng (tháng)'],
        min: [1, 'Thời hạn hợp đồng tối thiểu là 1 tháng']
    },
    monthlyRent: {
        type: Number,
        required: [true, 'Vui lòng nhập giá thuê hàng tháng'],
        min: [0, 'Giá thuê không được âm']
    },
    paymentDay: {
        type: Number,
        default: 5,
        min: [1, 'Ngày thanh toán từ 1 đến 31 hàng tháng'],
        max: [31, 'Ngày thanh toán từ 1 đến 31 hàng tháng']
    },
    electricPrice: {
        type: Number,
        default: 3500,
        min: [0, 'Giá điện không được âm']
    },
    waterPrice: {
        type: Number,
        default: 20000,
        min: [0, 'Giá nước không được âm']
    },
    terms: {
        type: String,
        default: 'Hai bên cam kết thực hiện đúng nội quy phòng trọ, bảo quản tài sản và thanh toán đúng hạn.'
    },

    // Tiền cọc phòng và trạng thái thanh toán / hoàn cọc
    deposit: {
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Tiền cọc không được âm']
        },
        status: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded', 'partial_refund', 'withheld'],
            default: 'unpaid'
        },
        paidAt: {
            type: Date
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'transfer'],
            default: 'transfer'
        },
        refundedAmount: {
            type: Number,
            default: 0,
            min: [0, 'Số tiền hoàn cọc không được âm']
        },
        deductions: [deductionSchema],
        note: {
            type: String,
            default: ''
        }
    },

    // Trạng thái hợp đồng
    status: {
        type: String,
        enum: ['pending', 'active', 'ended', 'cancelled'],
        default: 'active'
    }
}, { timestamps: true });

// Tự động tính ngày kết thúc (endDate) từ startDate + durationMonths nếu chưa có
contractSchema.pre('save', function (next) {
    if (this.startDate && this.durationMonths && !this.endDate) {
        const calculatedEnd = new Date(this.startDate);
        calculatedEnd.setMonth(calculatedEnd.getMonth() + Number(this.durationMonths));
        this.endDate = calculatedEnd;
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('Contract', contractSchema);
