/**
 * Script hỗ trợ Test nhanh: Tạo ngay một đợt lưu trú (Stay) hợp lệ đã ở 30 ngày
 * Cách dùng: node backend/scripts/quickSeedStay.js [tenantEmail]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Stay = require('../models/Stay');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function quickSeed() {
    console.log('🚀 Bắt đầu khởi tạo dữ liệu test Stay...');
    if (!MONGO_URI || MONGO_URI.includes('your_mongodb_connection_string')) {
        console.log('⚠️ MONGO_URI chưa được cấu hình trong .env.');
        console.log('👉 Bạn có thể test trực tiếp trên giao diện web (Xem hướng dẫn chi tiết).');
        return;
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB.');

        const tenantEmail = process.argv[2];
        let tenant = tenantEmail ? await User.findOne({ email: tenantEmail.toLowerCase().trim() }) : null;
        if (!tenant) {
            tenant = await User.findOne({ role: { $in: ['student', 'user', 'tenant'] } });
        }

        if (!tenant) {
            console.log('❌ Không tìm thấy người dùng thuê trọ nào trong hệ thống.');
            return;
        }

        const room = await Room.findOne({});
        if (!room) {
            console.log('❌ Không tìm thấy phòng trọ nào trong hệ thống.');
            return;
        }

        // Tạo ngày dọn vào là 30 ngày trước để đủ điều kiện MIN_STAY_DAYS (14 ngày)
        const checkInDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Xóa stay cũ của user tại phòng này nếu có để test sạch
        await Stay.deleteMany({ tenantId: tenant._id, roomId: room._id });

        const stay = await Stay.create({
            tenantId: tenant._id,
            roomId: room._id,
            landlordId: room.owner || tenant._id,
            status: 'active',
            verificationMethod: 'landlord_confirm',
            checkInDate: checkInDate,
            checkInConfirmedBy: 'landlord',
            tenantNote: 'Đợt lưu trú test nhanh tự động (30 ngày)'
        });

        console.log('\n🎉 ĐÃ TẠO THÀNH CÔNG ĐỢT LƯU TRÚ HỢP LỆ ĐỂ TEST:');
        console.log(`- Người thuê: ${tenant.fullName || tenant.email} (ID: ${tenant._id})`);
        console.log(`- Phòng trọ: "${room.title}" (ID: ${room._id})`);
        console.log(`- Ngày dọn vào: ${checkInDate.toLocaleDateString('vi-VN')} (Đã ở ~30 ngày -> ĐỦ ĐIỀU KIỆN REVIEW)`);
        console.log(`\n👉 Bây giờ bạn chỉ cần đăng nhập tài khoản "${tenant.email}" và mở URL:`);
        console.log(`   http://localhost:5173/phong/${room._id} (hoặc https://smart-stay-swart.vercel.app/phong/${room._id})`);
        console.log('   Form đánh giá sẽ tự động mở sẵn với huy hiệu "✓ Đủ điều kiện" để bạn gửi review ngay!\n');

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

quickSeed();

