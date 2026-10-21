const mongoose = require('mongoose');

const otherFeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const billSchema = new mongoose.Schema({
    contract: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: [true, 'Hóa đơn phải thuộc một hợp đồng cụ thể']
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Hóa đơn phải thuộc một phòng trọ cụ thể']
    },
    landlord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    billingDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    monthlyRent: {
        type: Number,
        required: true,
        min: 0
    },
    // Minh bạch chỉ số điện & Ảnh chụp công tơ
    electric: {
        previousNumber: { type: Number, default: 0, min: 0 },
        currentNumber: { type: Number, default: 0, min: 0 },
        usage: { type: Number, default: 0, min: 0 },
        pricePerKwh: { type: Number, default: 3500, min: 0 },
        total: { type: Number, default: 0, min: 0 },
        meterPhotoUrl: { 
            type: String, 
            default: '',
            comment: 'Ảnh chụp đồng hồ điện minh bạch' 
        }
    },
    // Minh bạch chỉ số nước & Ảnh chụp đồng hồ nước
    water: {
        previousNumber: { type: Number, default: 0, min: 0 },
        currentNumber: { type: Number, default: 0, min: 0 },
        usage: { type: Number, default: 0, min: 0 },
        pricePerM3: { type: Number, default: 20000, min: 0 },
        total: { type: Number, default: 0, min: 0 },
        meterPhotoUrl: { 
            type: String, 
            default: '',
            comment: 'Ảnh chụp đồng hồ nước minh bạch' 
        }
    },
    otherFees: [otherFeeSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['unpaid', 'paid', 'confirmed'],
        default: 'unpaid'
    },
    paymentProofUrl: {
        type: String,
        default: ''
    },
    paidAt: {
        type: Date
    },
    confirmedAt: {
        type: Date
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Tự động tính toán tổng tiền trước khi lưu
billSchema.pre('save', function (next) {
    // Tính usage điện
    if (this.electric.currentNumber >= this.electric.previousNumber) {
        this.electric.usage = this.electric.currentNumber - this.electric.previousNumber;
    }
    this.electric.total = (this.electric.usage || 0) * (this.electric.pricePerKwh || 0);

    // Tính usage nước
    if (this.water.currentNumber >= this.water.previousNumber) {
        this.water.usage = this.water.currentNumber - this.water.previousNumber;
    }
    this.water.total = (this.water.usage || 0) * (this.water.pricePerM3 || 0);

    // Tính phụ phí
    const otherTotal = (this.otherFees || []).reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

    // Tổng tiền
    this.totalAmount = (Number(this.monthlyRent) || 0) + this.electric.total + this.water.total + otherTotal;

    if (typeof next === 'function') next();
});

module.exports = mongoose.model('Bill', billSchema);
