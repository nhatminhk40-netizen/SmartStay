const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    campus: { type: String, required: true }, // Ví dụ: FPT Can Tho
    price: { type: Number, required: true },   // Giá thuê niêm yết (VNĐ/tháng)
    images: [{ type: String }],
    contactPhone: { type: String, required: true },

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

    // Phân loại phục vụ Safe Listing / Pass phòng ở các tuần sau
    listingType: {
        type: String,
        enum: ['standard', 'safe', 'pass'],
        default: 'standard'
    },
    isSafeBadge: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);