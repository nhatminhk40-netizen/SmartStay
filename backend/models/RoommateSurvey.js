const mongoose = require('mongoose');

const roommateSurveySchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactZalo: { type: String, required: true },
    campus: { type: String, default: 'FPT Can Tho' },
    gender: { 
        type: String, 
        enum: ['Nam', 'Nữ', 'Nu', 'Khác', 'Khac', 'Linh hoạt', 'Nam/Nữ'], 
        default: 'Linh hoạt' 
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userEmail: { type: String, default: '' },
    isPrivate: { type: Boolean, default: false }, // Cho phép người dùng ẩn hồ sơ của mình
    allowShareContact: { type: Boolean, default: false }, // Chỉ chia sẻ liên hệ khi có yêu cầu ghép bạn được chấp thuận
    isDemo: { type: Boolean, default: false },

    // 5 Tiêu chí khảo sát tìm bạn cùng phòng
    sleepSchedule: {
        type: String,
        enum: ['early', 'early_bird', 'night_owl', 'flexible'],
        default: 'flexible'
    },
    cleanliness: {
        type: String,
        enum: ['daily', 'weekly', 'flexible'],
        default: 'daily'
    },
    smokingDrinking: {
        type: String,
        enum: ['none', 'sometimes', 'regular', 'rarely', 'smoker_friendly'],
        default: 'none'
    },
    guestPolicy: {
        type: String,
        enum: ['strict', 'ask_first', 'open', 'daytime_only', 'free'],
        default: 'ask_first'
    },
    budgetRange: {
        type: String,
        enum: ['low', 'medium', 'high', 'economy', 'standard', 'premium'],
        default: 'medium'
    }
}, { timestamps: true });

module.exports = mongoose.model('RoommateSurvey', roommateSurveySchema);