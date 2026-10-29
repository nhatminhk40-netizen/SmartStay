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
        default: '3.500 đ / kWh'
    },
    waterCost: { type: String, default: 'Theo giá nhà nước' },
    hasSeparateMeter: { type: Boolean, default: true }, // Đồng hồ riêng
    depositMonths: { type: Number, default: 1 },        // Tiền cọc (số tháng)
    extraFees: {
        wifi: { type: Number, default: 0 },
        trash: { type: Number, default: 0 },
        parking: { type: Number, default: 0 }
    },

    // Xác thực chủ sở hữu & Trạng thái kiểm duyệt
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ownerEmail: { type: String, default: '' },
    isDemo: { type: Boolean, default: false }, // Đánh dấu tin demo/minh họa
    demoNote: { type: String, default: '' },

    // Phân loại: standard / safe (Safe Listing) / pass (SmartStay Pass)
    listingType: {
        type: String,
        enum: ['standard', 'safe', 'pass'],
        default: 'standard'
    },
    // Quy trình xác minh Safe Badge có căn cứ
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    verificationEvidence: {
        idCardVerified: { type: Boolean, default: false },
        landlordOwnershipVerified: { type: Boolean, default: false },
        fireSafetyInspected: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        verifiedBy: { type: String, default: '' },
        inspectorNotes: { type: String, default: '' }
    },
    isSafeBadge: { type: Boolean, default: false },
    safe_badge: { type: Boolean, default: false },

    // Thông tin an toàn thực tế & Điều kiện sinh hoạt (P1)
    fireSafetyCertified: { type: Boolean, default: false }, // Có lối thoát hiểm & bình chữa cháy
    fireSafetyDetails: { type: String, default: 'Đã trang bị bình chữa cháy và lối thoát hiểm thứ 2' },
    curfewType: {
        type: String,
        enum: ['tu_do', 'co_gio_gioi_nghiem'],
        default: 'tu_do'
    },
    curfewDetails: { type: String, default: 'Giờ giấc tự do, chìa khóa/vân tay riêng' },
    isWithLandlord: { type: Boolean, default: false }, // Không chung chủ
    petAllowed: { type: Boolean, default: false },       // Cho nuôi thú cưng
    lastAvailabilityConfirmedAt: { type: Date, default: Date.now }, // Ngày xác nhận còn phòng gần nhất

    // Roommate Matcher
    seeking_roommate: { type: Boolean, default: false },

    // SmartStay Pass (Sang nhượng phòng giữa hợp đồng)
    has_pass: { type: Boolean, default: false },
    remaining_duration: { type: Number, default: 0 }, // Số tháng còn lại
    remaining_deposit: { type: Number, default: 0 },  // Tiền cọc còn lại (VNĐ)
    pass_reason: { type: String, default: '' },        // Lý do chuyển đi
    is_boosted: { type: Boolean, default: false },     // Đã trả phí đẩy tin lên đầu
    pass_status: { 
        type: String, 
        enum: ['pending_landlord', 'landlord_confirmed', 'landlord_rejected', 'landlord_conditional'],
        default: 'pending_landlord'
    },
    landlordNote: { type: String, default: '' },
    landlordPhone: { type: String, default: '' },
    moveOutDate: { type: String, default: '' },
    posterName: { type: String, default: 'Sinh viên SmartStay' },

    // Trạng thái cho thuê thực tế của phòng
    status: {
        type: String,
        enum: ['available', 'rented', 'repairing'],
        default: 'available'
    },

    // Quản lý khu trọ & nhiều phòng trong cùng một dãy
    property_name: { type: String, default: '' },       // Tên khu trọ / Dãy trọ (vd: Nhà trọ Lê Khải)
    room_number: { type: String, default: '' },         // Tên/Mã phòng riêng (vd: P.101, P.102)
    price_min: { type: Number },                        // Khoảng giá tối thiểu (VNĐ/tháng)
    price_max: { type: Number },                        // Khoảng giá tối đa (VNĐ/tháng)
    total_rooms: { type: Number, default: 1 },          // Tổng số phòng trong dãy trọ
    available_rooms: { type: Number, default: 1 },      // Số phòng còn trống trong dãy trọ
    rooms_list: [{                                      // Danh sách các phòng cụ thể thuộc trọ
        room_number: { type: String },
        price: { type: Number },
        area_sqm: { type: Number },
        status: { type: String, default: 'available' },
        amenities: [{ type: String }],
        tenant: {
            name: { type: String },
            phone: { type: String },
            startDate: { type: String },
            endDate: { type: String }
        }
    }]
}, { timestamps: true });

// Tự đồng bộ ảnh và badge trước khi lưu
roomSchema.pre('save', function () {
    if (!this.image_url && this.images && this.images.length > 0) {
        this.image_url = this.images[0];
    }
    if (this.listingType === 'pass') {
        this.has_pass = true;
    }
});

module.exports = mongoose.model('Room', roomSchema);