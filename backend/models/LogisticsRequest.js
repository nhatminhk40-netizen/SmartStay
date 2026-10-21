const mongoose = require('mongoose');

const logisticsRequestSchema = new mongoose.Schema({
    requestCode: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: {
        type: String,
        required: [true, 'Vui lòng cung cấp họ tên khách hàng']
    },
    phone: {
        type: String,
        required: [true, 'Vui lòng cung cấp số điện thoại liên hệ']
    },
    vehicleType: {
        type: String,
        default: 'Xe ba gác chuyển trọ'
    },
    distanceKm: {
        type: Number,
        default: 5
    },
    estimatedDurationMins: {
        type: Number,
        default: 15
    },
    servicePackage: {
        type: String,
        default: 'Cơ bản'
    },
    selectedAddons: [{
        type: String // 'loading', 'wrapping', 'assembly'
    }],
    pickupLocation: {
        name: { type: String, default: '' },
        address: { type: String, default: '' },
        lat: { type: Number },
        lng: { type: Number }
    },
    dropoffLocation: {
        name: { type: String, default: '' },
        address: { type: String, default: '' },
        lat: { type: Number },
        lng: { type: Number }
    },
    pickupAddress: { type: String, required: [true, 'Vui lòng nhập địa chỉ điểm đón'] },
    dropoffAddress: { type: String, required: [true, 'Vui lòng nhập địa chỉ điểm đến'] },
    moveDate: {
        type: String,
        default: 'Hôm nay'
    },
    notes: {
        type: String,
        default: ''
    },

    // Minh bạch cước phí & Chống phát sinh chi phí
    basePrice: { type: Number, default: 0 },
    distancePrice: { type: Number, default: 0 },
    addonsPrice: { type: Number, default: 0 },
    rawTotal: { type: Number, default: 0 },
    studentDiscount: { type: Number, default: 0 }, // Trợ giá sinh viên (15%)
    estimatedPrice: { type: Number, required: true }, // Giá chốt thanh toán cuối cùng (VNĐ)
    fixedPriceGuarantee: { type: Boolean, default: true }, // Cam kết giá niêm yết, không phát sinh phụ phí

    // Luồng tài xế / đơn vị vận chuyển
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    driverVehicle: { type: String, default: '' },
    driverLicensePlate: { type: String, default: '' },
    assignedAt: { type: Date },

    // Trạng thái cuốc xe
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    cancellationReason: { type: String, default: '' },
    completedAt: { type: Date },

    // Đánh giá tài xế từ sinh viên
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, default: '' },
        costAccurate: { type: Boolean, default: true }, // Có đúng giá niêm yết không
        createdAt: { type: Date }
    }
}, { timestamps: true });

logisticsRequestSchema.pre('save', function () {
    if (!this.requestCode) {
        this.requestCode = `MOVE-${Date.now().toString().slice(-6)}`;
    }
    if (!this.pickupAddress && this.pickupLocation?.address) {
        this.pickupAddress = this.pickupLocation.address;
    }
    if (!this.dropoffAddress && this.dropoffLocation?.address) {
        this.dropoffAddress = this.dropoffLocation.address;
    }
});

module.exports = mongoose.model('LogisticsRequest', logisticsRequestSchema);
