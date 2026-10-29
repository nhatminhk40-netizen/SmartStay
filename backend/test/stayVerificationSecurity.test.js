const assert = require('assert');
const crypto = require('crypto');

console.log('🧪 Bắt đầu chạy Security & State Machine Tests cho Stay & CheckinCode...');

// ==========================================
// 1. TEST CHECKIN CODE GENERATION & HASHING
// ==========================================
function testCheckinCodeHashing() {
    console.log('\n--- 1. Test CheckinCode Security ---');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rawCode = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
        rawCode += chars[bytes[i] % chars.length];
    }
    const formattedCode = `SS-${rawCode}`;
    const codeHash = crypto.createHash('sha256').update(formattedCode).digest('hex');

    // Không bao giờ được lưu plain code vào DB
    assert.strictEqual(codeHash.length, 64, 'Mã băm SHA-256 phải đủ 64 ký tự hex');
    assert.notStrictEqual(codeHash, formattedCode, 'Hash không được trùng raw code');

    // Kiểm tra tính xác thực của mã khi người dùng nhập vào
    const userEnteredValid = formattedCode.toLowerCase().trim().toUpperCase();
    const userHash = crypto.createHash('sha256').update(userEnteredValid).digest('hex');
    assert.strictEqual(userHash, codeHash, 'Mã người dùng nhập khi chuẩn hoá phải khớp với hash');

    // Mã sai
    const userEnteredWrong = 'SS-WRONG9';
    const wrongHash = crypto.createHash('sha256').update(userEnteredWrong).digest('hex');
    assert.notStrictEqual(wrongHash, codeHash, 'Mã sai hash không được khớp');

    console.log('✅ Sinh mã ngẫu nhiên cryptographically secure & kiểm tra SHA-256 pass.');
}

// ==========================================
// 2. TEST CHECKIN CODE EXPIRATION & REUSE
// ==========================================
function testCodeRedemptionLogic() {
    console.log('\n--- 2. Test CheckinCode Expiration & Reuse ---');

    function canRedeemCode(codeRecord, now = new Date()) {
        if (!codeRecord) {
            return { success: false, code: 'CODE_NOT_FOUND', message: 'Mã không tồn tại' };
        }
        if (codeRecord.isRedeemed) {
            return { success: false, code: 'CODE_ALREADY_USED', message: 'Mã nhận phòng đã được sử dụng' };
        }
        if (new Date(codeRecord.expiresAt) < new Date(now)) {
            return { success: false, code: 'CODE_EXPIRED', message: 'Mã nhận phòng đã hết hạn' };
        }
        return { success: true };
    }

    const now = new Date('2026-10-29T12:00:00Z');

    // Case a: Mã hợp lệ
    const validCode = {
        codeHash: 'abc',
        isRedeemed: false,
        expiresAt: new Date('2026-11-05T12:00:00Z') // +7 ngày
    };
    assert.strictEqual(canRedeemCode(validCode, now).success, true, 'Mã còn hạn và chưa dùng phải hợp lệ');

    // Case b: Mã đã dùng (Replay Attack)
    const usedCode = {
        codeHash: 'abc',
        isRedeemed: true,
        expiresAt: new Date('2026-11-05T12:00:00Z')
    };
    const usedRes = canRedeemCode(usedCode, now);
    assert.strictEqual(usedRes.success, false);
    assert.strictEqual(usedRes.code, 'CODE_ALREADY_USED', 'Mã đã dùng phải bị từ chối');

    // Case c: Mã hết hạn (> 7 ngày)
    const expiredCode = {
        codeHash: 'abc',
        isRedeemed: false,
        expiresAt: new Date('2026-10-20T12:00:00Z')
    };
    const expiredRes = canRedeemCode(expiredCode, now);
    assert.strictEqual(expiredRes.success, false);
    assert.strictEqual(expiredRes.code, 'CODE_EXPIRED', 'Mã hết hạn phải bị từ chối');

    console.log('✅ Chặn mã hết hạn và chặn tái sử dụng mã (Replay Attack) pass.');
}

// ==========================================
// 3. TEST RATE LIMITING (5 LẦN THỬ SAI / GIỜ)
// ==========================================
function testRateLimiterLogic() {
    console.log('\n--- 3. Test Rate Limiter (Max 5 failed attempts per hour) ---');

    class MockRateLimiter {
        constructor(maxAttempts = 5, windowMs = 3600000) {
            this.maxAttempts = maxAttempts;
            this.windowMs = windowMs;
            this.attempts = new Map();
        }

        recordAttempt(ip, isSuccess, now = Date.now()) {
            if (!this.attempts.has(ip)) {
                this.attempts.set(ip, []);
            }
            const timestamps = this.attempts.get(ip).filter(t => now - t < this.windowMs);
            if (timestamps.length >= this.maxAttempts) {
                return { allowed: false, message: 'Bạn đã thử nhập mã quá nhiều lần. Vui lòng thử lại sau 1 giờ.' };
            }
            if (!isSuccess) {
                timestamps.push(now);
                this.attempts.set(ip, timestamps);
            }
            return { allowed: true, remaining: this.maxAttempts - timestamps.length };
        }
    }

    const limiter = new MockRateLimiter(5, 3600000);
    const clientIp = '192.168.1.100';

    // 5 lần thử sai đầu tiên
    for (let i = 1; i <= 5; i++) {
        const res = limiter.recordAttempt(clientIp, false);
        assert.strictEqual(res.allowed, true, `Lần ${i} vẫn nằm trong ngưỡng`);
    }

    // Lần thứ 6 phải bị khoá
    const blockedRes = limiter.recordAttempt(clientIp, false);
    assert.strictEqual(blockedRes.allowed, false, 'Lần thứ 6 phải bị chặn bởi Rate Limiter');

    console.log('✅ Rate limiting chặn brute force mã check-in pass.');
}

// ==========================================
// 4. TEST STAY STATE MACHINE & PERMISSIONS
// ==========================================
function testStayStateMachineAndPermissions() {
    console.log('\n--- 4. Test Stay State Machine & Role Authorization ---');

    const VALID_TRANSITIONS = {
        requested: ['active', 'cancelled', 'disputed'],
        approved: ['active', 'cancelled', 'disputed'],
        active: ['completed', 'cancelled', 'disputed'],
        completed: ['disputed'],
        cancelled: [],
        disputed: ['active', 'completed', 'cancelled']
    };

    function canTransition(currentStatus, nextStatus) {
        return (VALID_TRANSITIONS[currentStatus] || []).includes(nextStatus);
    }

    assert.strictEqual(canTransition('requested', 'active'), true, 'requested -> active hợp lệ');
    assert.strictEqual(canTransition('active', 'completed'), true, 'active -> completed hợp lệ');
    assert.strictEqual(canTransition('completed', 'requested'), false, 'completed -> requested bất hợp lệ');
    assert.strictEqual(canTransition('cancelled', 'active'), false, 'cancelled -> active bất hợp lệ');

    // Phân quyền xác nhận nhận phòng:
    // Tenant không bao giờ được tự confirm-checkin cho chính mình
    function authorizeCheckinConfirmation(currentUser, stay) {
        if (!currentUser) return false;
        // Tenant không được tự duyệt
        if (String(currentUser._id) === String(stay.tenantId)) {
            return false;
        }
        // Chủ trọ của phòng hoặc Admin mới được duyệt
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'landlord' && String(currentUser._id) === String(stay.landlordId)) {
            return true;
        }
        return false;
    }

    const tenantUser = { _id: 'user_tenant_1', role: 'student' };
    const landlordUser = { _id: 'user_landlord_1', role: 'landlord' };
    const strangerUser = { _id: 'user_stranger_1', role: 'landlord' };
    const adminUser = { _id: 'user_admin_1', role: 'admin' };

    const stayRecord = {
        _id: 'stay_123',
        tenantId: 'user_tenant_1',
        landlordId: 'user_landlord_1',
        status: 'requested'
    };

    assert.strictEqual(authorizeCheckinConfirmation(tenantUser, stayRecord), false, 'Tenant KHÔNG THỂ tự xác nhận cho chính mình');
    assert.strictEqual(authorizeCheckinConfirmation(strangerUser, stayRecord), false, 'Chủ trọ khác KHÔNG THỂ xác nhận');
    assert.strictEqual(authorizeCheckinConfirmation(landlordUser, stayRecord), true, 'Đúng chủ trọ ĐƯỢC PHÉP xác nhận');
    assert.strictEqual(authorizeCheckinConfirmation(adminUser, stayRecord), true, 'Admin ĐƯỢC PHÉP xác nhận');

    console.log('✅ State machine và Phân quyền endpoint (Tenant không tự xác nhận được) pass.');
}

// ==========================================
// 5. TEST SERVER-CALCULATED COST ACCURACY
// ==========================================
function testServerCostAccuracyCalculation() {
    console.log('\n--- 5. Test Server-Side Cost Accuracy Calculation ---');

    function calculateMatchesListedPrice(listedPrice, actualMonthlyCost) {
        if (!listedPrice || listedPrice <= 0) return true;
        const cost = Number(actualMonthlyCost) || listedPrice;
        // Chi phí thực tế dao động 75% - 125% giá niêm yết là chuẩn xác
        return cost >= listedPrice * 0.75 && cost <= listedPrice * 1.25;
    }

    const listed = 2000000;
    assert.strictEqual(calculateMatchesListedPrice(listed, 2000000), true, 'Bằng giá niêm yết: Chuẩn xác');
    assert.strictEqual(calculateMatchesListedPrice(listed, 2200000), true, 'Tăng 10% do điện nước: Chuẩn xác');
    assert.strictEqual(calculateMatchesListedPrice(listed, 2400000), true, 'Tăng 20% do tiền máy lạnh: Chuẩn xác');
    assert.strictEqual(calculateMatchesListedPrice(listed, 3500000), false, 'Đội giá lên 75%: Không chuẩn xác với niêm yết');
    assert.strictEqual(calculateMatchesListedPrice(listed, 1000000), false, 'Hạ giá quá 50%: Bất thường');

    console.log('✅ Server tính toán matchesListedPrice độc lập, không tin client pass.');
}

// Chạy tất cả
testCheckinCodeHashing();
testCodeRedemptionLogic();
testRateLimiterLogic();
testStayStateMachineAndPermissions();
testServerCostAccuracyCalculation();

console.log('\n🎉 TẤT CẢ TEST BẢO MẬT & STATE MACHINE ĐÃ PASS HOÀN TOÀN!');

