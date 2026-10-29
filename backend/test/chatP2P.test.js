const assert = require('assert');
const { inspectSensitiveContent } = require('../utils/sensitiveFilter');

async function runTests() {
    console.log('🧪 Bắt đầu kiểm thử tính năng Chat P2P và Lọc Thông Tin Cá Nhân / Zalo...\n');

    // 1. Kiểm tra lọc tin nhắn thông thường
    const normalMsg = inspectSensitiveContent('Chào bạn, mình cũng đang tìm phòng ở gần trường FPT.');
    assert.strictEqual(normalMsg.containsSensitiveInfo, false, 'Tin nhắn thông thường không được đánh dấu nhạy cảm');
    assert.strictEqual(normalMsg.redirectZalo, false, 'Tin nhắn thông thường không yêu cầu chuyển Zalo');
    console.log('✅ 1. Kiểm tra tin nhắn bình thường: ĐẠT');

    // 2. Kiểm tra phát hiện số điện thoại chuẩn (10 chữ số)
    const phoneMsg = inspectSensitiveContent('Bạn gọi cho mình qua số 0907297338 nhé!');
    assert.strictEqual(phoneMsg.containsSensitiveInfo, true, 'Phải phát hiện số điện thoại');
    assert.strictEqual(phoneMsg.cleanPhone, '0907297338', 'Số điện thoại sạch phải là 0907297338');
    assert.strictEqual(phoneMsg.redirectZalo, true, 'Phải yêu cầu chuyển Zalo');
    assert(phoneMsg.maskedText.includes('[Đã ẩn SĐT - Vui lòng mở qua Zalo]'), 'Phải che số điện thoại trong tin nhắn');
    console.log('✅ 2. Kiểm tra phát hiện & che số điện thoại 10 số: ĐẠT');

    // 3. Kiểm tra số điện thoại có định dạng dấu chấm / khoảng cách
    const spacedPhoneMsg = inspectSensitiveContent('Số điện thoại: 091.234.5678');
    assert.strictEqual(spacedPhoneMsg.containsSensitiveInfo, true, 'Phải phát hiện số điện thoại có dấu chấm');
    assert.strictEqual(spacedPhoneMsg.cleanPhone, '0912345678', 'Chuẩn hóa số điện thoại chính xác');
    console.log('✅ 3. Kiểm tra số điện thoại có dấu chấm/khoảng cách: ĐẠT');

    // 4. Kiểm tra đầu số quốc tế +84
    const intlPhoneMsg = inspectSensitiveContent('Zalo mình là +84939112233');
    assert.strictEqual(intlPhoneMsg.containsSensitiveInfo, true, 'Phải phát hiện đầu số +84');
    assert.strictEqual(intlPhoneMsg.cleanPhone, '0939112233', 'Phải chuyển +84 thành đầu số 09...');
    console.log('✅ 4. Kiểm tra đầu số +84: ĐẠT');

    // 5. Kiểm tra từ khóa yêu cầu liên hệ cá nhân
    const keywordMsg = inspectSensitiveContent('Bạn cho mình xin sđt để trao đổi thêm');
    assert.strictEqual(keywordMsg.containsSensitiveInfo, true, 'Phải phát hiện từ khóa "sđt"');
    assert.strictEqual(keywordMsg.sensitiveType, 'contact_keywords', 'Loại nhạy cảm là từ khóa liên hệ');
    console.log('✅ 5. Kiểm tra từ khóa xin SĐT/Zalo: ĐẠT');

    console.log('\n🎉 TẤT CẢ CÁC BÀI TEST CHAT P2P & BẢO MẬT SĐT QUA ZALO ĐỀU THÀNH CÔNG 100%!');
}

runTests().catch(err => {
    console.error('❌ Lỗi kiểm thử:', err);
    process.exit(1);
});

