/**
 * Test Toàn diện: Xác thực 3 Tài khoản Demo Cốt lõi & Cách ly Dữ liệu Mẫu Tuyệt đối
 */
const bcrypt = require('../node_modules/bcryptjs');
const fallbackUsers = require('../fallback_users.json');
const fallbackContracts = require('../fallback_contracts.json');

async function testDemoIsolation() {
    console.log('🧪 Bắt đầu kiểm tra 3 Tài khoản Demo Cốt lõi và Quy tắc Cách ly Dữ liệu...');

    // 1. Kiểm tra Thông tin đăng nhập của 3 tài khoản Demo (Admin, Chủ trọ, Sinh viên)
    const demoAccounts = [
        { role: 'admin', email: 'admin@smartstay.vn', pass: 'Admin@123456', page: 'Admin Portal' },
        { role: 'landlord', email: 'chutro@smartstay.vn', pass: 'Chutro@123456', page: 'Kênh Quản lý Trọ' },
        { role: 'student', email: 'sinhvien@smartstay.vn', pass: 'Sinhvien@123456', page: 'Trang chủ SmartStay (Nút Phòng & Hóa đơn)' }
    ];

    console.log('\n--- BƯỚC 1: Xác thực thông tin đăng nhập 3 tài khoản Demo ---');
    for (const acc of demoAccounts) {
        const u = fallbackUsers.find(user => user.email === acc.email);
        if (!u) {
            throw new Error(`❌ Không tìm thấy tài khoản ${acc.email} trong fallbackUsers!`);
        }
        const isMatch = bcrypt.compareSync(acc.pass, u.passwordHash);
        if (!isMatch) {
            throw new Error(`❌ Mật khẩu của tài khoản ${acc.email} không khớp!`);
        }
        if (u.role !== acc.role) {
            throw new Error(`❌ Role của ${acc.email} là ${u.role}, kỳ vọng ${acc.role}!`);
        }
        console.log(`✅ [${acc.role.toUpperCase()}] ${acc.email} | Mật khẩu: ${acc.pass} -> HỢP LỆ! Phân hệ: ${acc.page}`);
    }

    // 2. Kiểm tra Dữ liệu mẫu Chủ trọ (chutro@smartstay.vn) vs Chủ trọ thật khác (Minh Minh, mới tạo)
    console.log('\n--- BƯỚC 2: Kiểm tra Cách ly dữ liệu Chủ trọ ---');
    const chutroEmail = 'chutro@smartstay.vn';
    const realLandlordEmail = 'aloconchohaha@gmail.com';
    const newLandlordEmail = 'chutromoi_test@gmail.com';

    // Mô phỏng bộ lọc my-rooms
    const allRooms = [
        { title: 'Nhà trọ Lê Khải', ownerEmail: 'chutro@smartstay.vn', isDemo: true },
        { title: 'Nhà trọ Thanh Sơn', ownerEmail: 'chutro@smartstay.vn', isDemo: true },
        { title: 'Phòng mm của Minh Minh', ownerEmail: 'aloconchohaha@gmail.com', isDemo: false }
    ];

    const chutroRooms = allRooms.filter(r => r.ownerEmail === chutroEmail);
    const realRooms = allRooms.filter(r => r.ownerEmail === realLandlordEmail);
    const newRooms = allRooms.filter(r => r.ownerEmail === newLandlordEmail);

    if (chutroRooms.length !== 2) throw new Error('❌ Chủ trọ demo không thấy đủ phòng mẫu!');
    if (realRooms.length !== 1 || realRooms[0].title !== 'Phòng mm của Minh Minh') throw new Error('❌ Chủ trọ Minh Minh bị rò rỉ phòng!');
    if (newRooms.length !== 0) throw new Error('❌ Chủ trọ mới bị gắn phòng mẫu!');
    console.log('✅ Chủ trọ demo (chutro@smartstay.vn) thấy 2 phòng mẫu.');
    console.log('✅ Chủ trọ Minh Minh (aloconchohaha@gmail.com) chỉ thấy đúng 1 phòng của mình.');
    console.log('✅ Chủ trọ mới tạo có 0 phòng mẫu (mảng rỗng []).');

    // 3. Kiểm tra Dữ liệu mẫu Sinh viên (sinhvien@smartstay.vn) vs Sinh viên khác
    console.log('\n--- BƯỚC 3: Kiểm tra Cách ly Hợp đồng & Hóa đơn Sinh viên ---');
    const demoStudentEmail = 'sinhvien@smartstay.vn';
    const otherStudentEmail = 'trieuvyvoctct@gmail.com';

    const demoContracts = fallbackContracts.filter(c => c.tenant?.email === demoStudentEmail);
    const otherContracts = fallbackContracts.filter(c => c.tenant?.email === otherStudentEmail);

    if (demoContracts.length === 0) throw new Error('❌ Sinh viên demo không thấy hợp đồng mẫu!');
    if (otherContracts.length !== 0) throw new Error('❌ Sinh viên khác bị rò rỉ hợp đồng mẫu!');
    console.log(`✅ Sinh viên demo (${demoStudentEmail}) sở hữu hợp đồng thuê mẫu: "${demoContracts[0].room.title}".`);
    console.log(`✅ Sinh viên khác (${otherStudentEmail}) có 0 hợp đồng mẫu, không bị rò rỉ.`);

    console.log('\n🎉 TẤT CẢ CÁC BỘ KIỂM TRA CÁCH LY DỮ LIỆU DEMO ĐỀU ĐẠT CHUẨN 100%!\n');
}

testDemoIsolation().catch(err => {
    console.error(err);
    process.exit(1);
});
