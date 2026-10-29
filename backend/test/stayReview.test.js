const assert = require('assert');
const { canUserReview, MIN_STAY_DAYS, MAX_REVIEW_WINDOW_DAYS } = require('../services/stayReviewService');

async function runTests() {
    console.log('🧪 Bắt đầu chạy Unit Tests cho stayReviewService...');

    const tenantId = '666666666666666666666661';
    const landlordId = '666666666666666666666662';
    const roomId = '666666666666666666666663';
    const stayId = '666666666666666666666664';

    // Test 1: Chủ trọ không được tự review phòng mình
    const res1 = await canUserReview(landlordId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId }
    });
    assert.strictEqual(res1.eligible, false);
    assert.strictEqual(res1.code, 'LANDLORD_CANNOT_REVIEW');
    console.log('✅ Test 1: Chủ trọ không được tự review phòng mình -> PASS');

    // Test 2: Người chưa có Stay nào
    const res2 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: null,
        mockRequestedStay: null
    });
    assert.strictEqual(res2.eligible, false);
    assert.strictEqual(res2.code, 'NO_VERIFIED_STAY');
    console.log('✅ Test 2: Người chưa từng lưu trú -> PASS (NO_VERIFIED_STAY)');

    // Test 3: Stay đang ở trạng thái chờ duyệt (requested)
    const res3 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: null,
        mockRequestedStay: { _id: stayId, status: 'requested' }
    });
    assert.strictEqual(res3.eligible, false);
    assert.strictEqual(res3.code, 'STAY_PENDING_CONFIRMATION');
    console.log('✅ Test 3: Stay đang chờ duyệt -> PASS (STAY_PENDING_CONFIRMATION)');

    // Test 4: Stay active nhưng mới ở 5 ngày (< MIN_STAY_DAYS 14 ngày)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const res4 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: { _id: stayId, status: 'active', checkInDate: fiveDaysAgo }
    });
    assert.strictEqual(res4.eligible, false);
    assert.strictEqual(res4.code, 'STAY_TOO_SHORT');
    assert.strictEqual(res4.daysStayed, 5);
    assert.strictEqual(res4.daysLeft, 9);
    console.log('✅ Test 4: Stay chưa đủ 14 ngày tối thiểu -> PASS (STAY_TOO_SHORT)');

    // Test 5: Stay active đã ở 35 ngày (đủ điều kiện)
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const res5 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: { _id: stayId, status: 'active', checkInDate: thirtyFiveDaysAgo },
        mockExistingReview: null
    });
    assert.strictEqual(res5.eligible, true);
    assert.strictEqual(res5.code, 'ELIGIBLE');
    assert.strictEqual(res5.stayDurationMonths, 1);
    console.log('✅ Test 5: Stay active đủ 35 ngày -> PASS (ELIGIBLE)');

    // Test 6: Stay completed trong vòng 30 ngày (< 90 ngày)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const res6 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: { _id: stayId, status: 'completed', checkInDate: sixtyDaysAgo, checkOutDate: twentyDaysAgo },
        mockExistingReview: null
    });
    assert.strictEqual(res6.eligible, true);
    assert.strictEqual(res6.code, 'ELIGIBLE');
    console.log('✅ Test 6: Stay completed trong hạn 90 ngày -> PASS (ELIGIBLE)');

    // Test 7: Stay completed đã quá 90 ngày (100 ngày trước)
    const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const res7 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: { _id: stayId, status: 'completed', checkInDate: sixtyDaysAgo, checkOutDate: hundredDaysAgo },
        mockExistingReview: null
    });
    assert.strictEqual(res7.eligible, false);
    assert.strictEqual(res7.code, 'REVIEW_WINDOW_EXPIRED');
    console.log('✅ Test 7: Stay completed quá hạn 90 ngày -> PASS (REVIEW_WINDOW_EXPIRED)');

    // Test 8: Đã gửi review cho Stay này rồi
    const res8 = await canUserReview(tenantId, roomId, {
        mockRoom: { _id: roomId, owner: landlordId },
        mockStay: { _id: stayId, status: 'active', checkInDate: thirtyFiveDaysAgo },
        mockExistingReview: { _id: 'rev_existing_123' }
    });
    assert.strictEqual(res8.eligible, false);
    assert.strictEqual(res8.code, 'ALREADY_REVIEWED');
    console.log('✅ Test 8: Đã có review cho Stay -> PASS (ALREADY_REVIEWED)');

    console.log('\n🎉 TẤT CẢ 8/8 UNIT TESTS ĐÃ PASS 100%!');
}

runTests().catch(err => {
    console.error('❌ Test thất bại:', err);
    process.exit(1);
});

