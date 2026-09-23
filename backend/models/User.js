const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    studentId: { type: String }, // Mã số sinh viên (nếu có)
    campus: { type: String, default: 'FPT Can Tho' },
    role: { type: String, enum: ['student', 'landlord'], default: 'student' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);