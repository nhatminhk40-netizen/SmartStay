const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// ==========================================
// REGEX ĐẶC TẢ CHUẨN XÁC THỰC
// ==========================================
// 1. Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0 hoặc +84 kết hợp đầu số nhà mạng (3, 5, 7, 8, 9)
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

// 2. Định dạng ngày chuẩn ISO: YYYY-MM-DD
const DATE_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// 3. Định dạng giờ 24h: HH:mm từ 00:00 đến 23:59
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Lấy thời gian hiện tại chuẩn múi giờ Việt Nam (UTC+7)
 */
function getVietnamNow() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (7 * 3600000));
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại Việt Nam
 */
function validateVietnamesePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, message: 'Số điện thoại là trường bắt buộc.' };
    }
    const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
    if (!VN_PHONE_REGEX.test(cleanPhone)) {
        return {
            isValid: false,
            message: `Số điện thoại "${phone}" không hợp lệ. Phải là số điện thoại Việt Nam 10 chữ số (VD: 0912345678 hoặc +84912345678).`
        };
    }
    return { isValid: true, cleanPhone };
}

/**
 * Kiểm tra tính hợp lệ & logic nghiệp vụ của ngày hẹn xem phòng
 */
function validateVisitDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return { isValid: false, message: 'Ngày hẹn xem phòng là trường bắt buộc (YYYY-MM-DD).' };
    }

    const cleanDate = dateStr.trim();
    if (!DATE_FORMAT_REGEX.test(cleanDate)) {
        return {
            isValid: false,
            message: `Định dạng ngày "${dateStr}" không hợp lệ. Vui lòng nhập định dạng chuẩn YYYY-MM-DD (VD: 2026-10-30).`
        };
    }

    const [year, month, day] = cleanDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    // Kiểm tra tính tồn tại thực tế của ngày (ví dụ 2026-02-31 là không hợp lệ)
    if (
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
    ) {
        return {
            isValid: false,
            message: `Ngày ${dateStr} không tồn tại trong lịch thực tế.`
        };
    }

    // Logic kiểm tra quá khứ dựa trên giờ Việt Nam
    const vnNow = getVietnamNow();
    const todayVN = new Date(Date.UTC(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate()));

    if (parsedDate < todayVN) {
        return {
            isValid: false,
            message: `Ngày hẹn "${dateStr}" ở trong quá khứ! Lịch hẹn phải được đặt từ hôm nay trở đi.`
        };
    }

    // Giới hạn đặt trước tối đa 90 ngày (ngăn chặn ngày phi lý như năm 2099, 2999)
    const maxFuture = new Date(todayVN);
    maxFuture.setUTCDate(maxFuture.getUTCDate() + 90);
    if (parsedDate > maxFuture) {
        return {
            isValid: false,
            message: `Không thể đặt lịch hẹn vượt quá 90 ngày tới (tối đa đến ${maxFuture.toISOString().slice(0, 10)}).`
        };
    }

    return {
        isValid: true,
        cleanDate,
        isToday: parsedDate.getTime() === todayVN.getTime()
    };
}

/**
 * Kiểm tra tính hợp lệ & logic nghiệp vụ của giờ hẹn xem phòng
 */
function validateVisitTime(timeStr, isToday = false) {
    if (!timeStr || typeof timeStr !== 'string') {
        return { isValid: false, message: 'Giờ hẹn xem phòng là trường bắt buộc (HH:mm).' };
    }

    const cleanTime = timeStr.trim();
    if (!TIME_FORMAT_REGEX.test(cleanTime)) {
        return {
            isValid: false,
            message: `Giờ hẹn "${timeStr}" không hợp lệ. Phải theo định dạng 24 giờ HH:mm từ 00:00 đến 23:59 (VD: 09:30, 15:00).`
        };
    }

    const [hours, minutes] = cleanTime.split(':').map(Number);
    const normalizedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    // Nếu hẹn trong ngày hôm nay, giờ hẹn phải sau giờ hiện tại ít nhất 15 phút
    if (isToday) {
        const vnNow = getVietnamNow();
        const currentHours = vnNow.getHours();
        const currentMinutes = vnNow.getMinutes();
        const scheduledMinutes = hours * 60 + minutes;
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        if (scheduledMinutes < currentTotalMinutes + 15) {
            return {
                isValid: false,
                message: `Lịch hẹn trong ngày hôm nay phải đặt sau thời điểm hiện tại ít nhất 15 phút (hiện tại là ${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}).`
            };
        }
    }

    return { isValid: true, cleanTime: normalizedTime };
}

/**
 * Kiểm tra toàn bộ dữ liệu lịch hẹn (pure validator dùng cho cả controller và unit test)
 */
function validateAppointmentData(data = {}) {
    const errors = [];

    // 1. Kiểm tra roomId
    const roomId = data.roomId || data.room;
    if (!roomId || typeof roomId !== 'string' || !roomId.trim()) {
        errors.push({ field: 'roomId', message: 'Vui lòng cung cấp mã phòng trọ (roomId).' });
    } else {
        const cleanRoomId = roomId.trim();
        const isMongoId = mongoose.Types.ObjectId.isValid(cleanRoomId);
        const isCustomRoomId = cleanRoomId.startsWith('room_') || cleanRoomId.startsWith('r') || !isNaN(Number(cleanRoomId));
        if (!isMongoId && !isCustomRoomId) {
            errors.push({ field: 'roomId', message: 'Mã phòng trọ (roomId) không hợp lệ.' });
        }
    }

    // 2. Kiểm tra studentPhone
    const phoneRes = validateVietnamesePhone(data.studentPhone || data.phone);
    if (!phoneRes.isValid) {
        errors.push({ field: 'studentPhone', message: phoneRes.message });
    }

    // 3. Kiểm tra landlordPhone (nếu có truyền)
    if (data.landlordPhone && String(data.landlordPhone).trim()) {
        const landlordPhoneRes = validateVietnamesePhone(data.landlordPhone);
        if (!landlordPhoneRes.isValid) {
            errors.push({ field: 'landlordPhone', message: landlordPhoneRes.message });
        }
    }

    // 4. Kiểm tra visitDate
    const dateRes = validateVisitDate(data.visitDate || data.appointmentDate);
    if (!dateRes.isValid) {
        errors.push({ field: 'visitDate', message: dateRes.message });
    }

    // 5. Kiểm tra visitTime
    const isToday = dateRes.isValid ? dateRes.isToday : false;
    const timeRes = validateVisitTime(data.visitTime || data.appointmentTime, isToday);
    if (!timeRes.isValid) {
        errors.push({ field: 'visitTime', message: timeRes.message });
    }

    // 6. Kiểm tra studentName
    const studentName = data.studentName;
    if (studentName !== undefined && studentName !== null) {
        const cleanName = String(studentName).trim();
        if (cleanName.length > 0 && cleanName.length < 2) {
            errors.push({ field: 'studentName', message: 'Họ và tên người xem phòng phải có ít nhất 2 ký tự.' });
        } else if (cleanName.length > 100) {
            errors.push({ field: 'studentName', message: 'Họ và tên người xem phòng không được vượt quá 100 ký tự.' });
        } else if (/[<>]/.test(cleanName)) {
            errors.push({ field: 'studentName', message: 'Họ và tên chứa ký tự không hợp lệ.' });
        }
    }

    // 7. Kiểm tra notes (giới hạn độ dài chống spam DoS payload lớn)
    const notes = data.notes || data.note;
    if (notes && typeof notes === 'string' && notes.length > 500) {
        errors.push({ field: 'notes', message: 'Ghi chú không được vượt quá 500 ký tự.' });
    }

    return {
        isValid: errors.length === 0,
        errors,
        cleanData: errors.length === 0 ? {
            roomId: String(roomId).trim(),
            roomTitle: typeof data.roomTitle === 'string' ? data.roomTitle.trim().slice(0, 200) : '',
            studentName: data.studentName && String(data.studentName).trim() ? String(data.studentName).trim().slice(0, 100) : 'Sinh viên SmartStay',
            studentPhone: phoneRes.cleanPhone,
            landlordPhone: data.landlordPhone ? String(data.landlordPhone).trim().replace(/[\s.-]/g, '') : '',
            visitDate: dateRes.cleanDate,
            visitTime: timeRes.cleanTime,
            transportType: typeof data.transportType === 'string' && data.transportType.trim() ? data.transportType.trim().slice(0, 50) : 'Xe máy',
            notes: notes && typeof notes === 'string' ? notes.trim().slice(0, 500) : ''
        } : null
    };
}

/**
 * Middleware Express: Chặn đứng mọi request sai chuẩn (CWE-20) trước khi chạm tới Controller
 */
const validateAppointmentMiddleware = (req, res, next) => {
    const validation = validateAppointmentData(req.body);

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đặt lịch xem phòng không hợp lệ. Vui lòng kiểm tra lại.',
            errors: validation.errors
        });
    }

    // Gắn dữ liệu đã được làm sạch và chuẩn hóa vào req.validatedAppointment
    req.validatedAppointment = validation.cleanData;
    next();
};

/**
 * Rate Limiter chống Spam / Database Flooding (DoS)
 * Giới hạn mỗi IP tối đa 10 yêu cầu đặt lịch hẹn trong 15 phút
 */
const appointmentRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // Tối đa 10 requests / 15 phút
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đã gửi quá nhiều yêu cầu đặt lịch xem phòng từ địa chỉ IP này. Vui lòng chờ 15 phút trước khi thử lại.'
    }
});

module.exports = {
    VN_PHONE_REGEX,
    DATE_FORMAT_REGEX,
    TIME_FORMAT_REGEX,
    getVietnamNow,
    validateVietnamesePhone,
    validateVisitDate,
    validateVisitTime,
    validateAppointmentData,
    validateAppointmentMiddleware,
    appointmentRateLimiter
};
