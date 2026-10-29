/**
 * Migration Script: Migrate Old Reviews
 * Đánh dấu các review cũ (chưa qua quy trình xác minh Stay) là verified: false
 * và has_stayed: false để đảm bảo huy hiệu "Đã ở thật" phản ánh chính xác 100% dữ liệu thực tế.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function migrate() {
    console.log('🔄 Đang bắt đầu migration đánh dấu review cũ...');
    if (!MONGO_URI) {
        console.warn('⚠️ MONGO_URI không có trong .env, bỏ qua migration DB thực.');
        return;
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB Atlas.');

        const result = await Review.updateMany(
            { stayId: { $in: [null, undefined] } },
            {
                $set: {
                    verified: false,
                    has_stayed: false,
                    verificationStatus: 'unverified',
                    stayed_period: 'Đánh giá trước đây'
                }
            }
        );

        console.log(`✅ Hoàn tất migration: Đã cập nhật ${result.modifiedCount} review cũ về verified=false.`);
    } catch (err) {
        console.error('❌ Lỗi khi chạy migration review cũ:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🏁 Đã ngắt kết nối database.');
    }
}

if (require.main === module) {
    migrate();
}

module.exports = migrate;

