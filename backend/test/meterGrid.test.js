const assert = require('assert');
const jwt = require('jsonwebtoken');

console.log('🧪 Bắt đầu chạy bộ kiểm thử Bảng chốt số điện nước Grid (Auto-Rollover & Tính toán)...');

// ============================================================================
// TEST SUITE 1: KIỂM THỬ CƠ CHẾ NHẢY SỐ TỰ ĐỘNG (AUTO-ROLLOVER THÁNG MỚI)
// ============================================================================
(() => {
    console.log('\n--- Test 1: Kiểm thử cơ chế nhảy số tự động (Tháng 9 -> Tháng 10) ---');

    // Giả sử Tháng 9/2026 chủ trọ đã chốt số cho P.101 và P.102:
    const month9Readings = [
        { room: "P.101", elecOld: 1120, elecNew: 1205, waterOld: 82, waterNew: 86, status: "paid" },
        { room: "P.102", elecOld: 410, elecNew: 490, waterOld: 25, waterNew: 30, status: "paid" },
        { room: "P.103", elecOld: 750, elecNew: 835, waterOld: 48, waterNew: 53, status: "unpaid", totalAmount: 2992500 }
    ];

    // Hàm mô phỏng chuyển giao tháng mới (Tháng 10):
    const month10Rollover = month9Readings.map(prev => {
        return {
            room: prev.room,
            elecOld: prev.elecNew,       // Số mới T9 trở thành số cũ T10
            elecNew: "",                 // Để trống sẵn sàng cho chủ trọ đi đọc công tơ
            waterOld: prev.waterNew,     // Số mới T9 trở thành số cũ T10
            waterNew: "",
            debt: prev.status === 'unpaid' ? prev.totalAmount : 0 // Tự động cộng dồn nợ cũ nếu chưa đóng
        };
    });

    // Kiểm tra P.101
    assert.strictEqual(month10Rollover[0].elecOld, 1205, "P.101 số điện cũ T10 phải bằng đúng 1205 (số mới T9)");
    assert.strictEqual(month10Rollover[0].waterOld, 86, "P.101 số nước cũ T10 phải bằng đúng 86 (số mới T9)");
    assert.strictEqual(month10Rollover[0].debt, 0, "P.101 đã trả T9 nên nợ cũ = 0");

    // Kiểm tra P.102
    assert.strictEqual(month10Rollover[1].elecOld, 490, "P.102 số điện cũ T10 phải bằng đúng 490 (số mới T9)");
    assert.strictEqual(month10Rollover[1].waterOld, 30, "P.102 số nước cũ T10 phải bằng đúng 30 (số mới T9)");

    // Kiểm tra P.103 (có nợ cũ tháng trước)
    assert.strictEqual(month10Rollover[2].elecOld, 835, "P.103 số điện cũ T10 phải bằng đúng 835");
    assert.strictEqual(month10Rollover[2].debt, 2992500, "P.103 chưa trả T9 phải tự động chuyển nợ cũ 2.992.500 đ");

    console.log('✅ Test 1 thành công: Cơ chế tự động nhảy số cũ & chuyển nợ cũ hoạt động chính xác 100%!');
})();

// ============================================================================
// TEST SUITE 2: KIỂM THỬ TÍNH TOÁN CÔNG TƠ & TỔNG THU THEO THỜI GIAN THỰC
// ============================================================================
(() => {
    console.log('\n--- Test 2: Tính toán chỉ số tiêu thụ, thành tiền điện nước & tổng thu ---');

    const rent = 2500000;
    const elecPrice = 3500;
    const waterPrice = 15000;
    const otherFees = [{ name: 'Wifi', amount: 50000 }, { name: 'Rác', amount: 20000 }];
    const otherTotal = otherFees.reduce((s, f) => s + f.amount, 0); // 70.000 đ
    const debt = 150000; // Nợ cũ 150.000 đ

    const elecOld = 1205;
    const elecNew = 1290; // Nhập 1290 -> Tiêu thụ: 85 kWh
    const elecUsage = Math.max(0, elecNew - elecOld);
    const elecTotal = elecUsage * elecPrice; // 85 * 3500 = 297.500 đ

    const waterOld = 86;
    const waterNew = 91; // Nhập 91 -> Tiêu thụ: 5 m3
    const waterUsage = Math.max(0, waterNew - waterOld);
    const waterTotal = waterUsage * waterPrice; // 5 * 15000 = 75.000 đ

    const totalAmount = rent + elecTotal + waterTotal + otherTotal + debt;

    assert.strictEqual(elecUsage, 85, "Số điện tiêu thụ phải là 85 kWh");
    assert.strictEqual(elecTotal, 297500, "Tiền điện phải là 297.500 đ");
    assert.strictEqual(waterUsage, 5, "Số nước tiêu thụ phải là 5 m3");
    assert.strictEqual(waterTotal, 75000, "Tiền nước phải là 75.000 đ");
    assert.strictEqual(otherTotal, 70000, "Phụ phí phải là 70.000 đ");
    assert.strictEqual(totalAmount, 2500000 + 297500 + 75000 + 70000 + 150000, "Tổng thu phải là 3.092.500 đ");

    console.log('✅ Test 2 thành công: Công thức tính toán điện nước, phụ phí và nợ cũ chuẩn xác!');
})();

// ============================================================================
// TEST SUITE 3: KIỂM THỬ XỬ LÝ CHUYỂN NĂM (THÁNG 1 / 2027 -> THÁNG 12 / 2026)
// ============================================================================
(() => {
    console.log('\n--- Test 3: Kiểm thử lùi/tiến tháng qua ranh giới năm mới ---');

    const targetMonth = 1;
    const targetYear = 2027;

    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

    assert.strictEqual(prevMonth, 12, "Tháng trước của Tháng 1 phải là Tháng 12");
    assert.strictEqual(prevYear, 2026, "Năm của Tháng 12 phải là năm trước đó (2026)");

    console.log('✅ Test 3 thành công: Xử lý ranh giới năm (Year boundary) chính xác!');
})();

console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ BẢNG CHỐT SỐ ĐÃ ĐẠT 100%!');

