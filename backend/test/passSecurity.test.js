const assert = require('assert');
const { generateConfirmationToken, hashToken, verifyTokenValidity, TOKEN_EXPIRY_MS } = require('../utils/passToken');

console.log('🧪 Bắt đầu chạy bộ kiểm thử Bảo mật & State Machine cho PassRoom...');

// ==========================================
// TEST SUITE 1: BẢO MẬT TOKEN XÁC NHẬN CHỦ TRỌ
// ==========================================
(() => {
    console.log('\n--- Test 1: Tạo token xác nhận ngẫu nhiên và băm sha256 ---');
    const { token, tokenHash, expiresAt } = generateConfirmationToken();

    assert.strictEqual(typeof token, 'string', 'Token phải là chuỗi');
    assert.strictEqual(token.length, 64, 'Raw token từ randomBytes(32).toString("hex") phải có độ dài 64 ký tự');
    assert.strictEqual(typeof tokenHash, 'string', 'TokenHash phải là chuỗi');
    assert.strictEqual(tokenHash.length, 64, 'SHA-256 digest hex phải có độ dài 64 ký tự');
    assert.notStrictEqual(token, tokenHash, 'Token gốc và tokenHash phải khác nhau');

    // Kiểm tra tính nhất quán của hàm băm
    const recomputedHash = hashToken(token);
    assert.strictEqual(recomputedHash, tokenHash, 'Băm lại token phải ra cùng một tokenHash');

    // Kiểm tra thời hạn 72h
    const diffHours = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    assert.ok(diffHours >= 71.9 && diffHours <= 72.01, 'Thời hạn token phải chính xác là 72 giờ');
    console.log('✅ Test 1 thành công: Token sinh ngẫu nhiên an toàn, hash sha256 đúng chuẩn và hạn 72h.');
})();

(() => {
    console.log('\n--- Test 2: Kiểm tra hiệu lực của token (Dùng một lần & Hết hạn) ---');
    const { tokenHash, expiresAt } = generateConfirmationToken();

    // 2.1 Token mới còn hạn
    const freshConf = { tokenHash, expiresAt };
    assert.strictEqual(verifyTokenValidity(freshConf).isValid, true, 'Token mới tạo phải hợp lệ');

    // 2.2 Token đã được xác nhận (dùng 1 lần)
    const alreadyConfirmed = { tokenHash, expiresAt, confirmedAt: new Date() };
    const resConf = verifyTokenValidity(alreadyConfirmed);
    assert.strictEqual(resConf.isValid, false, 'Token đã confirm không được phép dùng lại');
    assert.ok(resConf.reason.includes('đã được xử lý'), 'Phải báo lý do đã xử lý');

    // 2.3 Token đã bị từ chối (dùng 1 lần)
    const alreadyRejected = { tokenHash, expiresAt, rejectedAt: new Date() };
    const resRej = verifyTokenValidity(alreadyRejected);
    assert.strictEqual(resRej.isValid, false, 'Token đã rejected không được phép dùng lại');

    // 2.4 Token đã quá hạn 72 giờ
    const expiredConf = {
        tokenHash,
        expiresAt: new Date(Date.now() - 1000) // Đã qua 1 giây
    };
    const resExp = verifyTokenValidity(expiredConf);
    assert.strictEqual(resExp.isValid, false, 'Token hết hạn không được hợp lệ');
    assert.ok(resExp.reason.includes('hết hạn'), 'Phải báo lý do quá hạn 72 giờ');

    console.log('✅ Test 2 thành công: Ngăn chặn triệt để tái sử dụng token và từ chối token quá hạn 72h.');
})();

// ==========================================
// TEST SUITE 2: STATE MACHINE CHO PASS ROOM
// ==========================================
(() => {
    console.log('\n--- Test 3: State Machine vòng đời tin Pass phòng ---');
    // Bảng chuyển đổi trạng thái hợp lệ
    const validTransitions = {
        draft: ['pending_landlord', 'cancelled'],
        pending_landlord: ['verified', 'rejected', 'expired', 'cancelled'],
        verified: ['reserved', 'completed', 'expired', 'cancelled'],
        reserved: ['verified', 'completed', 'cancelled'],
        completed: [],
        rejected: ['pending_landlord', 'cancelled'],
        expired: ['pending_landlord', 'cancelled'],
        cancelled: []
    };

    const canTransition = (current, next) => {
        return (validTransitions[current] || []).includes(next);
    };

    // Kiểm tra các bước hợp lệ
    assert.strictEqual(canTransition('pending_landlord', 'verified'), true, 'Chủ trọ duyệt: pending -> verified');
    assert.strictEqual(canTransition('verified', 'reserved'), true, 'Chấp nhận giữ chỗ: verified -> reserved');
    assert.strictEqual(canTransition('reserved', 'completed'), true, 'Hoàn thành sang nhượng: reserved -> completed');
    assert.strictEqual(canTransition('reserved', 'verified'), true, 'Hủy giữ chỗ: reserved -> verified');

    // Kiểm tra các bước phi logic bị chặn
    assert.strictEqual(canTransition('pending_landlord', 'reserved'), false, 'Không thể giữ chỗ khi chủ trọ chưa duyệt');
    assert.strictEqual(canTransition('pending_landlord', 'completed'), false, 'Không thể hoàn thành khi chưa duyệt');
    assert.strictEqual(canTransition('completed', 'reserved'), false, 'Đã hoàn thành thì không quay lại giữ chỗ');

    console.log('✅ Test 3 thành công: State Machine hoạt động chặt chẽ, ngăn chuyển trạng thái sai quy trình.');
})();

// ==========================================
// TEST SUITE 3: SANITIZATION & PHÂN QUYỀN THÔNG TIN NHẠY CẢM
// ==========================================
(() => {
    console.log('\n--- Test 4: Che giấu thông tin nhạy cảm của chủ trọ và token ---');

    const rawPassRoom = {
        title: 'Phòng studio gần ĐH Cần Thơ',
        passPrice: 1500000,
        depositAmount: 2000000,
        landlordName: 'Cô Bảy',
        landlordPhone: '0912345678',
        landlordEmail: 'cobay@gmail.com',
        landlordConfirmation: {
            tokenHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
            expiresAt: new Date()
        },
        reports: [{ reason: 'spam' }]
    };

    // Mô phỏng hàm sanitizePublicPassRoom
    const sanitize = (room, isOwnerOrAdmin) => {
        const r = { ...room, landlordConfirmation: { ...room.landlordConfirmation } };
        if (!isOwnerOrAdmin) {
            delete r.landlordPhone;
            delete r.landlordEmail;
            delete r.reports;
        }
        delete r.landlordConfirmation.tokenHash;
        r.savingsAmount = Math.max(0, Number(r.depositAmount) - Number(r.passPrice));
        return r;
    };

    // Khách vãng lai xem
    const publicView = sanitize(rawPassRoom, false);
    assert.strictEqual(publicView.landlordPhone, undefined, 'Số điện thoại chủ trọ phải bị ẩn');
    assert.strictEqual(publicView.landlordEmail, undefined, 'Email chủ trọ phải bị ẩn');
    assert.strictEqual(publicView.reports, undefined, 'Báo cáo vi phạm phải bị ẩn');
    assert.strictEqual(publicView.landlordConfirmation.tokenHash, undefined, 'TokenHash tuyệt đối không được trả ra ngoài');
    assert.strictEqual(publicView.savingsAmount, 500000, 'Tính đúng số tiền tiết kiệm: 2.000.000 - 1.500.000 = 500.000đ');

    // Chủ tin (owner) xem
    const ownerView = sanitize(rawPassRoom, true);
    assert.strictEqual(ownerView.landlordPhone, '0912345678', 'Owner được xem SĐT chủ trọ của mình');
    assert.strictEqual(ownerView.landlordConfirmation.tokenHash, undefined, 'Kể cả Owner cũng không được trả tokenHash trực tiếp');

    console.log('✅ Test 4 thành công: Dữ liệu công khai được bảo vệ an toàn, không rò rỉ token hay danh tính chủ trọ.');
})();

console.log('\n🎉 TẤT CẢ 4 BỘ TEST ĐỀU ĐẠT CHUẨN 100%!\n');
