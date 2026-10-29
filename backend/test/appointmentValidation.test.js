const assert = require('assert');
const {
    validateVietnamesePhone,
    validateVisitDate,
    validateVisitTime,
    validateAppointmentData,
    VN_PHONE_REGEX,
    DATE_FORMAT_REGEX,
    TIME_FORMAT_REGEX,
    getVietnamNow
} = require('../middleware/appointmentValidator');

console.log('🧪 Bắt đầu chạy bộ kiểm thử Bảo mật Kiểm thực Dữ liệu Đầu vào (CWE-20) cho /api/appointments...\n');

// ==========================================
// TEST SUITE 1: TÁI HIỆN VÀ CHẶN ĐỨNG PAYLOAD TỪ OWASP ZAP
// ==========================================
(() => {
    console.log('--- Test 1: Tái hiện đúng Payload tấn công từ OWASP ZAP ---');
    const zapPayload = {
        roomId: '6ade0175585f101375633e78',
        roomTitle: 'Phòng Trọ Lê Khải',
        studentName: 'Minh ten Min',
        studentPhone: 'wtf',             // Lỗi 1: chuỗi ký tự rác thay vì SĐT
        landlordPhone: '0907297338',
        visitDate: '2008-12-31',         // Lỗi 2: ngày cách đây gần 2 thập kỷ
        visitTime: '44:30',              // Lỗi 3: 44 giờ phi lý
        notes: ''
    };

    const result = validateAppointmentData(zapPayload);
    assert.strictEqual(result.isValid, false, 'Payload rác từ ZAP phải bị chặn ngay lập tức (isValid === false)');
    assert.ok(result.errors.length >= 3, `Phải phát hiện ít nhất 3 lỗi, thực tế phát hiện: ${result.errors.length}`);

    const errorFields = result.errors.map(e => e.field);
    assert.ok(errorFields.includes('studentPhone'), 'Phải bắt lỗi studentPhone');
    assert.ok(errorFields.includes('visitDate'), 'Phải bắt lỗi visitDate');
    assert.ok(errorFields.includes('visitTime'), 'Phải bắt lỗi visitTime');

    console.log('  -> Các lỗi CWE-20 đã được chặn:');
    result.errors.forEach(e => console.log(`     ❌ [${e.field}]: ${e.message}`));
    console.log('✅ Test 1 thành công: Chặn đứng hoàn toàn request từ OWASP ZAP!\n');
})();

// ==========================================
// TEST SUITE 2: KIỂM THỰC SỐ ĐIỆN THOẠI VIỆT NAM (studentPhone)
// ==========================================
(() => {
    console.log('--- Test 2: Kiểm thực Số điện thoại Việt Nam (Regex & Clean) ---');

    // 2.1 Các số điện thoại hợp lệ
    const validPhones = [
        '0907297338',
        '0381234567',
        '0798765432',
        '0561122334',
        '0888999888',
        '+84907297338',
        '+84381234567',
        '090 729 7338',     // Có khoảng trắng cần làm sạch
        '090-729-7338',     // Có dấu gạch nối
        '090.729.7338'      // Có dấu chấm
    ];

    for (const phone of validPhones) {
        const res = validateVietnamesePhone(phone);
        assert.strictEqual(res.isValid, true, `SĐT hợp lệ "${phone}" phải được chấp nhận`);
        assert.ok(VN_PHONE_REGEX.test(res.cleanPhone), `Clean phone "${res.cleanPhone}" phải khớp VN_PHONE_REGEX`);
    }

    // 2.2 Các số điện thoại không hợp lệ / cố tình tấn công
    const invalidPhones = [
        'wtf',
        'abc1234567',
        '0123456789',       // Đầu 01 không còn tồn tại sau chuyển đổi 11 số sang 10 số
        '09012345',         // Quá ngắn (8 số)
        '090123456789',     // Quá dài (12 số)
        '1234567890',       // Không có số 0 hoặc +84 ở đầu
        '<script>alert(1)</script>',
        '',
        null,
        undefined
    ];

    for (const phone of invalidPhones) {
        const res = validateVietnamesePhone(phone);
        assert.strictEqual(res.isValid, false, `SĐT không hợp lệ "${phone}" phải bị từ chối`);
    }

    console.log('✅ Test 2 thành công: Xác thực số điện thoại chuẩn viễn thông Việt Nam.\n');
})();

// ==========================================
// TEST SUITE 3: KIỂM THỰC NGÀY HẸN (visitDate - Format, Quá khứ & Giới hạn)
// ==========================================
(() => {
    console.log('--- Test 3: Kiểm thực Ngày hẹn (Format & Logic nghiệp vụ quá khứ/tương lai) ---');

    // 3.1 Ngày trong quá khứ phải bị chặn
    const pastDates = [
        '2008-12-31',
        '1999-01-01',
        '2020-05-15',
        '2025-10-28'
    ];

    for (const d of pastDates) {
        const res = validateVisitDate(d);
        assert.strictEqual(res.isValid, false, `Ngày quá khứ "${d}" phải bị từ chối`);
        assert.ok(res.message.includes('quá khứ'), `Thông báo phải đề cập đến "quá khứ" cho ngày ${d}`);
    }

    // 3.2 Ngày sai định dạng hoặc ngày không tồn tại trên thực tế
    const nonExistentDates = [
        '2026-02-31',   // Tháng 2 không có 31 ngày
        '2026-04-31',   // Tháng 4 chỉ có 30 ngày
        '31-12-2026',   // Sai format (phải là YYYY-MM-DD)
        '2026/12/31',   // Sai dấu gạch chéo
        '2026-13-01',   // Tháng 13 không tồn tại
        'not-a-date'
    ];

    for (const d of nonExistentDates) {
        const res = validateVisitDate(d);
        assert.strictEqual(res.isValid, false, `Ngày không hợp lệ "${d}" phải bị từ chối`);
    }

    // 3.3 Ngày quá xa trong tương lai (> 90 ngày)
    const farFuture = '2099-01-01';
    const resFar = validateVisitDate(farFuture);
    assert.strictEqual(resFar.isValid, false, 'Ngày năm 2099 phải bị từ chối');
    assert.ok(resFar.message.includes('90 ngày'), 'Phải cảnh báo giới hạn 90 ngày');

    // 3.4 Ngày hợp lệ trong tương lai (ngày mai và 1 tuần nữa)
    const vnNow = getVietnamNow();
    const tomorrow = new Date(vnNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const nextWeek = new Date(vnNow);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    const resTomorrow = validateVisitDate(tomorrowStr);
    assert.strictEqual(resTomorrow.isValid, true, `Ngày mai "${tomorrowStr}" phải hợp lệ`);

    const resNextWeek = validateVisitDate(nextWeekStr);
    assert.strictEqual(resNextWeek.isValid, true, `1 tuần nữa "${nextWeekStr}" phải hợp lệ`);

    console.log('✅ Test 3 thành công: Kiểm thực ngày hẹn chặt chẽ, chống ngày quá khứ & lịch rác.\n');
})();

// ==========================================
// TEST SUITE 4: KIỂM THỰC GIỜ HẸN (visitTime - 24h & Logic trong ngày)
// ==========================================
(() => {
    console.log('--- Test 4: Kiểm thực Giờ hẹn (Format 24h & Giờ quá khứ trong ngày) ---');

    // 4.1 Giờ phi lý
    const invalidTimes = [
        '44:30',    // Trích từ OWASP ZAP request
        '24:00',    // 24h chỉ từ 00 đến 23
        '25:30',
        '12:60',    // 60 phút phi lý
        '12:75',
        'morning',
        '2pm',
        '',
        null
    ];

    for (const t of invalidTimes) {
        const res = validateVisitTime(t, false);
        assert.strictEqual(res.isValid, false, `Giờ không hợp lệ "${t}" phải bị từ chối`);
    }

    // 4.2 Giờ hợp lệ
    const validTimes = [
        '00:00',
        '8:30',     // Khớp regex ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
        '08:30',
        '10:15',
        '14:00',
        '19:45',
        '23:59'
    ];

    for (const t of validTimes) {
        const res = validateVisitTime(t, false);
        assert.strictEqual(res.isValid, true, `Giờ hợp lệ "${t}" phải được chấp nhận`);
    }

    // Kiểm tra tự động chuẩn hóa 8:30 -> 08:30
    assert.strictEqual(validateVisitTime('8:30', false).cleanTime, '08:30');

    console.log('✅ Test 4 thành công: Giờ hẹn chuẩn định dạng 24h HH:mm.\n');
})();

// ==========================================
// TEST SUITE 5: ĐẶT LỊCH HẸN HỢP LỆ HOÀN CHỈNH
// ==========================================
(() => {
    console.log('--- Test 5: Xác thực đơn đặt lịch hoàn chỉnh chuẩn chỉ ---');

    const vnNow = getVietnamNow();
    const tomorrow = new Date(vnNow);
    tomorrow.setDate(tomorrow.getDate() + 2);
    const validDateStr = tomorrow.toISOString().slice(0, 10);

    const validPayload = {
        roomId: '6ade0175585f101375633e78',
        roomTitle: 'Phòng Trọ Lê Khải',
        studentName: 'Trần Minh Quân',
        studentPhone: '0907297338',
        landlordPhone: '0912345678',
        visitDate: validDateStr,
        visitTime: '15:30',
        transportType: 'Xe máy',
        notes: 'Em muốn xem phòng trực tiếp sau giờ học'
    };

    const res = validateAppointmentData(validPayload);
    assert.strictEqual(res.isValid, true, 'Đơn đặt lịch chuẩn phải hợp lệ (isValid === true)');
    assert.strictEqual(res.errors.length, 0, 'Không được có lỗi nào');
    assert.strictEqual(res.cleanData.studentPhone, '0907297338');
    assert.strictEqual(res.cleanData.visitDate, validDateStr);
    assert.strictEqual(res.cleanData.visitTime, '15:30');
    assert.strictEqual(res.cleanData.studentName, 'Trần Minh Quân');

    console.log('✅ Test 5 thành công: Payload hợp lệ được làm sạch và sẵn sàng lưu DB!\n');
})();

console.log('🎉 TẤT CẢ 5 BỘ TEST BẢO MẬT APPOINTMENT VALIDATION ĐỀU ĐẠT 100%!');
