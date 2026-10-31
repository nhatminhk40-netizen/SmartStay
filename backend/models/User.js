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
        enum: ['student', 'landlord', 'employee', 'admin'], 
        default: 'student' 
    },
    phoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    verificationStatus: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'NONE', 'UNVERIFIED'], 
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
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: String, default: '' },

    // ── Bảo mật Quản trị viên (Admin 2FA & Brute Force Lockout) ──
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: '' },
    twoFactorBackupCodes: [{ type: String }],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
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
