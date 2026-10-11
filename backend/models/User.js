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
    }
}, { timestamps: true });

// Hash mật khẩu trước khi lưu vào database
userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu đã hash
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);