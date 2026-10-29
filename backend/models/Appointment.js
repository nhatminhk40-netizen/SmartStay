const mongoose = require('mongoose');

// Regex kiểm thực số điện thoại Việt Nam
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
// Regex kiểm thực định dạng ngày YYYY-MM-DD
const DATE_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
// Regex kiểm thực định dạng giờ 24h HH:mm
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const appointmentSchema = new mongoose.Schema({
    appointmentCode: {
        type: String,
        required: [true, 'Mã lịch hẹn là bắt buộc'],
        unique: true
    },
    roomId: {
        type: mongoose.Schema.Types.Mixed, // Hỗ trợ cả ObjectId và ID dự phòng
        ref: 'Room',
        required: [true, 'Mã phòng trọ là bắt buộc']
    },
    roomTitle: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Tiêu đề phòng không quá 200 ký tự']
    },
    studentName: {
        type: String,
        required: [true, 'Họ và tên người xem phòng là bắt buộc'],
        trim: true,
        minlength: [2, 'Tên người xem phòng phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Tên người xem phòng không quá 100 ký tự']
    },
    studentPhone: {
        type: String,
        required: [true, 'Số điện thoại người xem phòng là bắt buộc'],
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return false;
                const clean = v.replace(/[\s.-]/g, '');
                return VN_PHONE_REGEX.test(clean);
            },
            message: props => `Số điện thoại "${props.value}" không đúng định dạng số điện thoại Việt Nam (10 chữ số).`
        }
    },
    landlordPhone: {
        type: String,
        default: '',
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Cho phép rỗng
                const clean = v.replace(/[\s.-]/g, '');
                return VN_PHONE_REGEX.test(clean);
            },
            message: props => `Số điện thoại chủ trọ "${props.value}" không đúng định dạng số điện thoại Việt Nam.`
        }
    },
    visitDate: {
        type: String,
        required: [true, 'Ngày hẹn xem phòng là bắt buộc'],
        trim: true,
        validate: {
            validator: function (v) {
                if (!v || !DATE_FORMAT_REGEX.test(v)) return false;
                const [year, month, day] = v.split('-').map(Number);
                const parsed = new Date(Date.UTC(year, month - 1, day));
                return parsed.getUTCFullYear() === year &&
                    parsed.getUTCMonth() === month - 1 &&
                    parsed.getUTCDate() === day;
            },
            message: props => `Ngày hẹn "${props.value}" không hợp lệ hoặc không tồn tại (yêu cầu định dạng YYYY-MM-DD).`
        }
    },
    visitTime: {
        type: String,
        required: [true, 'Giờ hẹn xem phòng là bắt buộc'],
        trim: true,
        validate: {
            validator: function (v) {
                return TIME_FORMAT_REGEX.test(v);
            },
            message: props => `Giờ hẹn "${props.value}" không đúng định dạng 24h HH:mm từ 00:00 đến 23:59.`
        }
    },
    transportType: {
        type: String,
        default: 'Xe máy',
        trim: true,
        maxlength: [50, 'Phương tiện di chuyển không quá 50 ký tự']
    },
    notes: {
        type: String,
        default: '',
        trim: true,
        maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    },
    status: {
        type: String,
        enum: ['pending_landlord', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
        default: 'pending_landlord'
    },
    landlordResponseNote: {
        type: String,
        default: 'Chờ chủ trọ xác nhận lịch hẹn',
        trim: true,
        maxlength: [500, 'Phản hồi chủ trọ không quá 500 ký tự']
    }
}, { timestamps: true });

// Index hỗ trợ tìm kiếm nhanh & ngăn chặn lịch hẹn rác
appointmentSchema.index({ studentPhone: 1, visitDate: 1 });
appointmentSchema.index({ roomId: 1, visitDate: 1, visitTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
