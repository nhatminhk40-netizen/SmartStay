const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { 
        type: String, 
        required: function() { return this.authProvider === 'local'; } 
    },
    authProvider: { 
        type: String, 
        enum: ['local', 'google'], 
        default: 'local' 
    },
    avatar: { type: String, default: '' },
    googleId: { type: String, default: '' },
    phone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    campus: { type: String, default: 'FPT Can Tho' },
    role: { 
        type: String, 
        enum: ['student', 'landlord', 'transporter', 'employee', 'admin'], 
        default: 'student' 
    },
    phoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    verificationStatus: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'NONE'], 
        default: 'NONE' 
    },
    landlordDocuments: {
        idCardNumber: { type: String, default: '' },
        propertyName: { type: String, default: '' },
        propertyAddress: { type: String, default: '' },
        idCardFrontUrl: { type: String, default: '' },
        idCardBackUrl: { type: String, default: '' },
        ownershipDocUrl: { type: String, default: '' },
        ownershipDocType: { type: String, default: 'UTILITY_BILL' },
        ownershipDocTypeName: { type: String, default: 'Hóa đơn tiền điện / nước' },
        note: { type: String, default: '' }
    },
    transporterProfile: {
        vehicleType: { type: String, default: 'Xe ba gác chuyển trọ' }, // Xe ba gác, Xe tải 500kg, Xe tải 1.5 tấn
        licensePlate: { type: String, default: '' },
        driverLicenseNumber: { type: String, default: '' },
        operatingArea: { type: String, default: 'Ninh Kiều / Cái Răng, Cần Thơ' },
        rating: { type: Number, default: 5.0 },
        totalTrips: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: true },
        bio: { type: String, default: 'Tài xế đối tác SmartStay Cần Thơ, hỗ trợ bốc xếp cẩn thận và đúng giờ.' }
    },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: String, default: '' }
}, { timestamps: true });

// Hash mật khẩu trước khi lưu vào database
userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu đã hash
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);