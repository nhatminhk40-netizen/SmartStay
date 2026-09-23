const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');
const Review = require('./models/Review');

const seedReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecting to MongoDB Atlas...');

        // Lấy ID của phòng trọ đầu tiên
        const room = await Room.findOne();
        if (!room) {
            console.log('Chưa có phòng trọ nào. Hãy chạy seed.js trước!');
            process.exit(1);
        }

        await Review.deleteMany();

        const sampleReviews = [
            {
                room: room._id,
                studentName: 'Đặng Tuấn Kiệt',
                rating: 5,
                isCostAccurate: true,
                actualMonthlyCost: 2850000,
                comment: 'Phòng đúng giá như niêm yết, đồng hồ điện nước riêng rõ ràng, chủ trọ thân thiện.'
            },
            {
                room: room._id,
                studentName: 'Lê Hoàng Nam',
                rating: 4,
                isCostAccurate: true,
                actualMonthlyCost: 2900000,
                comment: 'An ninh tốt, chi phí minh bạch không có phụ phí phát sinh thêm.'
            }
        ];

        await Review.insertMany(sampleReviews);
        console.log(`Seeded reviews for room: ${room.title}`);
        console.log(`Kiểm tra API tại: http://localhost:5000/api/reviews/room/${room._id}`);
        process.exit();
    } catch (error) {
        console.error('Error seeding reviews:', error);
        process.exit(1);
    }
};

seedReviews();