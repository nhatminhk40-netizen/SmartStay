const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

const sampleRooms = [
    {
        title: 'Phòng Trọ Thanh Sơn',
        campus: 'ĐH FPT Cần Thơ',
        address: '256c đường Vườn Mận phường Long Tuyền CT',
        location: 'Ninh Kiều, Cần Thơ',
        price: 2200000,
        area_sqm: 25,
        room_type: 'Phòng trọ khép kín',
        contactPhone: '0907297338',
        description: 'Dãy trọ Thanh Sơn thoáng mát, an ninh, giờ giấc tự do.',
        rating: 4.8,
        image_url: 'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
        images: [
            'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
            'https://lh3.googleusercontent.com/d/16e67ubyEHyRX12-_SDcYFs7jLth3fpFA',
            'https://lh3.googleusercontent.com/d/17_Y20bngboPHi57eMkUcDm7xtkKlLKwv',
            'https://lh3.googleusercontent.com/d/1XHvuCrepg6y90WixkwEYIXiGm0_k26NY'
        ],
        amenities: ['Máy lạnh', 'Gác lửng'],
        safe_badge: true,
        isSafeBadge: true,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '10.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: false,
        verificationStatus: 'verified',
        listingType: 'safe',
        fireSafetyCertified: true
    },
    {
        title: 'Phòng Trọ Lê khải',
        campus: 'ĐH FPT Cần Thơ',
        address: 'Khu vực gần ĐH FPT Cần Thơ, Cần Thơ',
        location: 'Ninh Kiều, Cần Thơ',
        price: 1800000,
        area_sqm: 25,
        room_type: 'Phòng trọ khép kín',
        contactPhone: '0907297338',
        description: 'Phòng sạch sẽ, an ninh tốt, gần trường.',
        rating: 4.8,
        image_url: 'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
        images: [
            'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
            'https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6',
            'https://lh3.googleusercontent.com/d/1lZdIaZ0_em938DJ4hTinFEcMWO_Hl-Kb',
            'https://lh3.googleusercontent.com/d/1NfaJ421eRJuQYPRKjpp_VK2DdTTGWcmO'
        ],
        amenities: ['Gác lửng'],
        safe_badge: true,
        isSafeBadge: true,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '15.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: false,
        verificationStatus: 'verified',
        listingType: 'safe',
        fireSafetyCertified: true
    },
    {
        title: 'Phòng Trọ Thanh Sơn',
        campus: 'ĐH FPT Cần Thơ',
        address: '256c đường Vườn Mận phường Long Tuyền CT',
        location: 'Ninh Kiều, Cần Thơ',
        price: 2400000,
        area_sqm: 30,
        room_type: 'Phòng trọ khép kín',
        contactPhone: '0907297338',
        description: 'Có ban công thuận tiện cho việc phơi đồ',
        rating: 4.8,
        image_url: 'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
        images: [
            'https://lh3.googleusercontent.com/d/1RfcMWHVi-78DD6cvoY4jMHZn5L-HCBlS',
            'https://lh3.googleusercontent.com/d/1IEQ9ITgnXtrZ2jcrJm39k--NLqpReCNs',
            'https://lh3.googleusercontent.com/d/1xt1PXWYvhhjLN3oFLEmMYgaTXVl-geHq',
            'https://lh3.googleusercontent.com/d/1wINldbqxIIdVPfRMkv4NeYM6lNnZN93t'
        ],
        amenities: ['Máy lạnh', 'Gác lửng'],
        safe_badge: true,
        isSafeBadge: true,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '10.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: false,
        verificationStatus: 'verified',
        listingType: 'safe',
        fireSafetyCertified: true
    },
    {
        title: 'Phòng trọ cao cấp gần ĐH FPT Cần Thơ (Gác lửng, full nội thất)',
        address: 'Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
        location: 'An Bình, Ninh Kiều',
        campus: 'FPT Can Tho',
        price: 2500000,
        area_sqm: 25,
        room_type: 'Phòng khép kín',
        description: 'Phòng trọ mới xây 100%, có gác lửng đúc kiên cố, giờ giấc tự do không chung chủ, khoá vân tay an ninh. Đi xe máy tới cổng ĐH FPT chỉ 5 phút.',
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
        image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        contactPhone: '0901234567',
        amenities: ['Máy lạnh', 'Gác lửng', 'Tủ lạnh', 'Máy giặt', 'Tủ quần áo', 'Cách âm'],
        electricityCostType: 'nha_nuoc',
        waterCost: 'Theo giá nhà nước',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 50000, trash: 30000, parking: 0 },
        listingType: 'safe',
        isSafeBadge: true,
        safe_badge: true,
        seeking_roommate: true
    },
    {
        title: 'Phòng trọ sinh viên giá rẻ gần ĐH Cần Thơ - Khu 2',
        address: 'Hẻm 51 đường 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ',
        location: 'Xuân Khánh, Ninh Kiều',
        campus: 'ĐH Cần Thơ (Khu 2)',
        price: 1600000,
        area_sqm: 18,
        room_type: 'Phòng trọ khép kín',
        description: 'Phòng sạch sẽ thoáng mát, đồng hồ điện nước riêng từng phòng, wifi cáp quang tốc độ cao, có camera 24/7.',
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        contactPhone: '0912345678',
        amenities: ['Máy lạnh', 'Gác lửng', 'Tủ quần áo'],
        electricityCostType: 'kinh_doanh',
        waterCost: '15.000 VNĐ/khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 30000, trash: 20000, parking: 0 },
        listingType: 'standard',
        isSafeBadge: false,
        safe_badge: false,
        seeking_roommate: false
    },
    {
        title: 'SmartStay Pass: Sang nhượng phòng ban công view thoáng (còn cọc 2 tháng)',
        address: 'Đường Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ',
        location: 'An Bình, Ninh Kiều',
        campus: 'FPT Can Tho',
        price: 2800000,
        area_sqm: 28,
        room_type: 'Căn hộ mini / Studio',
        description: 'Mình cần chuyển sang làm việc ở TP.HCM nên pass lại phòng hợp đồng còn 5 tháng. Đã đóng cọc 2 tháng, để lại toàn bộ tủ lạnh và bàn học.',
        images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'],
        image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
        contactPhone: '0987654321',
        amenities: ['Máy lạnh', 'Tủ lạnh', 'Máy nước nóng', 'Tủ quần áo', 'Cách âm'],
        electricityCostType: 'gia_co_dinh',
        waterCost: '100.000 VNĐ/người',
        hasSeparateMeter: true,
        depositMonths: 2,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        listingType: 'pass',
        isSafeBadge: true,
        safe_badge: true,
        has_pass: true,
        remaining_duration: 5,
        remaining_deposit: 5600000,
        pass_reason: 'Chuyển chỗ thực tập lên TP.HCM',
        is_boosted: true,
        seeking_roommate: false
    },
    {
        title: 'Homestay sinh viên full tiện ích gần ĐH Y Dược Cần Thơ',
        address: 'Đường Nguyễn Văn Linh, An Khánh, Ninh Kiều, Cần Thơ',
        location: 'An Khánh, Ninh Kiều',
        campus: 'ĐH Y Dược Cần Thơ',
        price: 2200000,
        area_sqm: 22,
        room_type: 'Homestay sinh viên',
        description: 'Môi trường sống văn minh, yên tĩnh cho sinh viên ôn thi. Có bếp chung rộng rãi, máy giặt dùng chung miễn phí.',
        images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
        image_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
        contactPhone: '0933445566',
        amenities: ['Máy lạnh', 'Máy giặt', 'Máy nước nóng', 'Tủ lạnh', 'Cách âm'],
        electricityCostType: 'nha_nuoc',
        waterCost: 'Theo giá nhà nước',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 20000, parking: 0 },
        listingType: 'safe',
        isSafeBadge: true,
        safe_badge: true,
        seeking_roommate: true
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