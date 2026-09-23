const mongoose = require('mongoose');

const roommateSurveySchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactZalo: { type: String, required: true },
    campus: { type: String, default: 'FPT Can Tho' },
    gender: { type: String, enum: ['Nam', 'Nu', 'Khac'], required: true },

    // 5 Tiêu chí khảo sát tìm bạn cùng phòng
    sleepSchedule: {
        type: String,
        enum: ['early', 'night_owl'],
        required: true // 'early': Ngủ sớm (trước 23h), 'night_owl': Cú đêm (sau 0h)
    },
    cleanliness: {
        type: String,
        enum: ['daily', 'weekly', 'flexible'],
        required: true // 'daily': Dọn mỗi ngày, 'weekly': 1-2 lần/tuần, 'flexible': Khi nào bẩn mới dọn
    },
    smokingDrinking: {
        type: String,
        enum: ['none', 'sometimes', 'regular'],
        required: true // 'none': Tuyệt đối không, 'sometimes': Thỉnh thoảng, 'regular': Thường xuyên
    },
    guestPolicy: {
        type: String,
        enum: ['strict', 'ask_first', 'open'],
        required: true // 'strict': Không dẫn người lạ, 'ask_first': Báo trước, 'open': Thoải mái
    },
    budgetRange: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true // 'low': Dưới 1.5tr, 'medium': 1.5tr - 2.5tr, 'high': Trên 2.5tr
    }
}, { timestamps: true });

module.exports = mongoose.model('RoommateSurvey', roommateSurveySchema);