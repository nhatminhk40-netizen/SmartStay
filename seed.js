const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

const sampleRooms = [
    {
        title: 'Phòng trọ cao cấp gần ĐH FPT Cần Thơ',
        address: 'Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
        campus: 'FPT Can Tho',
        price: 2500000,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
        contactPhone: '0901234567',
        electricityCostType: 'nha_nuoc',
        waterCost: 'Theo giá nhà nước',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 50000, trash: 30000, parking: 0 },
        listingType: 'standard',
        isSafeBadge: true
    },
    {
        title: 'Phòng trọ khép kín full nội thất',
        address: 'Đường Nguyễn Văn Cừ nối dài, An Bình, Cần Thơ',
        campus: 'FPT Can Tho',
        price: 1800000,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
        contactPhone: '0912345678',
        electricityCostType: 'kinh_doanh',
        waterCost: '15.000 VNĐ/khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 20000, parking: 50000 },
        listingType: 'standard',
        isSafeBadge: false
    },
    {
        title: 'Homestay sinh viên - Phòng ban công thoáng mát',
        address: 'Đường Trần Hoàng Na, Hưng Lợi, Ninh Kiều, Cần Thơ',
        campus: 'FPT Can Tho',
        price: 3200000,
        images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb'],
        contactPhone: '0987654321',
        electricityCostType: 'gia_co_dinh',
        waterCost: '100.000 VNĐ/người',
        hasSeparateMeter: false,
        depositMonths: 2,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        listingType: 'safe',
        isSafeBadge: true
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas for seeding...');

        // Xóa dữ liệu cũ (nếu có) và nạp dữ liệu mới
        await Room.deleteMany();
        await Room.insertMany(sampleRooms);

        console.log('Seeding sample rooms successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();