const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: String, default: 'Ninh Kiều, Cần Thơ' },
    campus: { type: String, required: true }, // Ví dụ: FPT Can Tho, Đại học Cần Thơ, Y Dược
    price: { type: Number, required: true },   // Giá thuê niêm yết (VNĐ/tháng)
    images: [{ type: String }],
    image_url: { type: String }, // Đường dẫn ảnh đại diện
    contactPhone: { type: String, required: true },
    area_sqm: { type: Number, default: 20 },
    room_type: { type: String, default: 'Phòng trọ khép kín' },
    description: { type: String, default: '' },
    amenities: [{ type: String }], // Máy lạnh, Tủ lạnh, Gác lửng, Máy giặt, Cách âm, v.v.

    // Bảng kiểm kê chi phí minh bạch
    electricityCostType: {
        type: String,
        enum: ['nha_nuoc', 'kinh_doanh', 'gia_co_dinh'],
        default: 'nha_nuoc'
    },
    waterCost: { type: String, default: 'Theo giá nhà nước' },
    hasSeparateMeter: { type: Boolean, default: true }, // Đồng hồ riêng
    depositMonths: { type: Number, default: 1 },        // Tiền cọc (số tháng)
    extraFees: {
        wifi: { type: Number, default: 0 },
        trash: { type: Number, default: 0 },
        parking: { type: Number, default: 0 }
    },

    // Phân loại: standard / safe (Safe Listing) / pass (SmartStay Pass)
    listingType: {
        type: String,
        enum: ['standard', 'safe', 'pass'],
        default: 'standard'
    },
    isSafeBadge: { type: Boolean, default: false },
    safe_badge: { type: Boolean, default: false },

    // Roommate Matcher
    seeking_roommate: { type: Boolean, default: false },

    // SmartStay Pass (Sang nhượng phòng giữa hợp đồng)
    has_pass: { type: Boolean, default: false },
    remaining_duration: { type: Number, default: 0 }, // Số tháng còn lại
    remaining_deposit: { type: Number, default: 0 },  // Tiền cọc còn lại (VNĐ)
    pass_reason: { type: String, default: '' },        // Lý do chuyển đi
    is_boosted: { type: Boolean, default: false }      // Đã trả phí đẩy tin lên đầu
}, { timestamps: true });

// Tự đồng bộ ảnh và badge trước khi lưu
roomSchema.pre('save', function (next) {
    if (!this.image_url && this.images && this.images.length > 0) {
        this.image_url = this.images[0];
    }
    if (this.isSafeBadge) {
        this.safe_badge = true;
    }
    if (this.listingType === 'pass') {
        this.has_pass = true;
    }
    next();
});

module.exports = mongoose.model('Room', roomSchema);