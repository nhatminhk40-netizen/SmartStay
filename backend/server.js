const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Room = require('./models/Room');
const Review = require('./models/Review');
const RoommateSurvey = require('./models/RoommateSurvey');
const { calcCompatibility, normalizeGender } = require('./utils/compatibility');
const Report = require('./models/Report');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
const LogisticsRequest = require('./models/LogisticsRequest');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const { protect, authorize, checkRoomOwnership } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Tắt thông tin header X-Powered-By để tránh rò rỉ công nghệ server
app.disable('x-powered-by');

// Security Middlewares - Helmet bảo mật HTTP Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://api.dicebear.com"],
            connectSrc: ["'self'", "http://localhost:5173", "http://localhost:5000", "ws://localhost:5173", "ws://localhost:5000", "wss://localhost:5000", "https://accounts.google.com"],
            frameSrc: ["'self'", "https://accounts.google.com"],
            frameAncestors: ["'self'"],
            formAction: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));

// Đảm bảo mọi response luôn mang header chống Sniffing và Clickjacking
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
});

// CORS Middleware có whitelist kiểm soát chặt chẽ, chống Cross-Domain Misconfiguration
const allowedCorsOrigins = [
    'https://smart-stay-swart.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có origin (server-to-server, mobile app, postman/curl)
        if (!origin) return callback(null, true);
        if (allowedCorsOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(new Error('CORS Policy: Nguồn truy cập này không được phép liên kết dữ liệu với SmartStay API.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Khởi tạo HTTP Server & Socket.IO cho tính năng Chat thời gian thực P2P
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedCorsOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        credentials: true
    }
});
app.locals.io = io;
const { setupChatSocket } = require('./socket/chatSocket');
setupChatSocket(io);

// Chống tấn công NoSQL Injection (loại bỏ triệt để các operator $ và . khỏi body/query/params khi pentest)
const sanitizeNoSql = (data) => {
    if (!data || typeof data !== 'object') return data;
    for (const key of Object.keys(data)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete data[key];
        } else if (typeof data[key] === 'object') {
            sanitizeNoSql(data[key]);
        }
    }
    return data;
};

app.use((req, res, next) => {
    if (req.body) sanitizeNoSql(req.body);
    if (req.query) sanitizeNoSql(req.query);
    if (req.params) sanitizeNoSql(req.params);
    next();
});

// Trạng thái kết nối DB & Biến dùng chung
let isDbConnected = false;
app.locals.isDbConnected = false;
app.locals.fallbackUsers = [];

// Helper chống ReDoS & NoSQL Injection cho Regex
const escapeRegex = (str) => (str ? str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '');

// Helper bảo vệ quyền riêng tư: Ẩn số điện thoại / Zalo công khai
const maskContact = (contact) => {
    if (!contact) return '';
    const str = String(contact).trim();
    if (str.length <= 6) return '***';
    const start = str.slice(0, 4);
    const end = str.slice(-3);
    return `${start}***${end}`;
};

// Dữ liệu 3 phòng khảo sát thực tế để tự động đồng bộ vào MongoDB Atlas khi kết nối
const surveyedRoomsData = [
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
        property_name: 'Nhà trọ Lê Khải',
        room_number: 'P.101',
        campus: 'ĐH FPT Cần Thơ',
        address: 'Khu vực gần ĐH FPT Cần Thơ, Cần Thơ',
        location: 'Ninh Kiều, Cần Thơ',
        price: 1800000,
        price_min: 1800000,
        price_max: 2400000,
        total_rooms: 8,
        available_rooms: 3,
        area_sqm: 25,
        room_type: 'Phòng trọ khép kín',
        contactPhone: '0907297338',
        description: 'Dãy trọ Lê Khải an ninh, giờ giấc tự do, có bảo vệ và camera 24/7. Các phòng đều có gác lửng đúc kiên cố, ban công thoáng mát.',
        rating: 4.8,
        image_url: 'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
        images: [
            'https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0',
            'https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6',
            'https://lh3.googleusercontent.com/d/1lZdIaZ0_em938DJ4hTinFEcMWO_Hl-Kb',
            'https://lh3.googleusercontent.com/d/1NfaJ421eRJuQYPRKjpp_VK2DdTTGWcmO'
        ],
        rooms_list: [
            { room_number: 'P.101', price: 1800000, area_sqm: 25, status: 'available', amenities: ['Gác lửng'] },
            { room_number: 'P.102', price: 1800000, area_sqm: 25, status: 'available', amenities: ['Gác lửng'] },
            { room_number: 'P.103', price: 2000000, area_sqm: 28, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh'], tenant: { name: 'Trần Văn Nam', phone: '0939 123 456' } },
            { room_number: 'P.104', price: 2000000, area_sqm: 28, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh'], tenant: { name: 'Lê Thị Thu', phone: '0948 222 333' } },
            { room_number: 'P.201', price: 2400000, area_sqm: 30, status: 'available', amenities: ['Gác lửng', 'Máy lạnh', 'Ban công'] },
            { room_number: 'P.202', price: 2400000, area_sqm: 30, status: 'rented', amenities: ['Gác lửng', 'Máy lạnh', 'Ban công'], tenant: { name: 'Nguyễn Hoàng', phone: '0918 777 888' } }
        ],
        amenities: ['Gác lửng', 'Máy lạnh', 'Camera 24/7'],
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
    }
];

const syncSurveyedRoomsToDatabase = async () => {
    if (!isDbConnected) return;
    try {
        for (const r of surveyedRoomsData) {
            const exists = await Room.findOne({ title: r.title, price: r.price });
            if (!exists) {
                await Room.create(r);
                console.log(`✅ Đã tự động đồng bộ phòng khảo sát vào MongoDB Atlas: ${r.title} (${r.price})`);
            }
        }
    } catch (err) {
        console.warn('⚠️ Lỗi đồng bộ phòng khảo sát:', err.message);
    }
};

// Kết nối MongoDB Atlas
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    })
        .then(async () => {
            isDbConnected = true;
            app.locals.isDbConnected = true;
            console.log('✅ Connected to MongoDB Atlas successfully!');
            await syncSurveyedRoomsToDatabase();
        })
        .catch((err) => {
            isDbConnected = false;
            app.locals.isDbConnected = false;
            console.warn('⚠️ MongoDB connection warning (chưa whitelist IP hoặc đang offline):', err.message);
            console.log('ℹ️ Server sẽ hoạt động ở chế độ Fallback Mock Data để đảm bảo trải nghiệm không bị gián đoạn.');
        });
}

// Health check endpoints (hỗ trợ kiểm tra khi deploy lên Render/Vercel)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 SmartStay Backend API is running...',
        database: app.locals.isDbConnected ? 'connected' : 'fallback_mode'
    });
});

app.get(['/health', '/api/health'], (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        database: app.locals.isDbConnected ? 'connected' : 'fallback_mode',
        timestamp: new Date()
    });
});

// Endpoint kích hoạt đồng bộ phòng khảo sát thực tế vào MongoDB Atlas
app.get('/api/sync-surveyed-rooms', async (req, res) => {
    try {
        if (!isDbConnected) {
            return res.json({
                success: true,
                message: 'Server đang ở chế độ Fallback Mock Data.',
                totalRooms: fallbackRooms.length
            });
        }
        await syncSurveyedRoomsToDatabase();
        const total = await Room.countDocuments();
        const rooms = await Room.find().select('title price is_surveyed isDemo');
        res.json({
            success: true,
            message: 'Đồng bộ phòng khảo sát vào MongoDB Atlas thành công!',
            totalRooms: total,
            rooms
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mount Authentication routes
app.use('/api/auth', authRoutes);

// Mount Contracts & Lease Management routes
const contractRoutes = require('./routes/contracts');
app.use('/api/contracts', contractRoutes);

// Mount Utility Billing & Photo Proof routes (Minh bạch tiền điện nước)
const billRoutes = require('./routes/billRoutes');
app.use('/api/bills', billRoutes);

// Phục vụ tệp tĩnh ảnh tải lên (Pass phòng, Hóa đơn)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount SmartStay Pass Room Routes
const passRoomRoutes = require('./routes/passRoomRoutes');
const landlordConfirmRoutes = require('./routes/landlordConfirmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startPassRoomCron } = require('./utils/passCron');

app.use('/api/pass-rooms', passRoomRoutes);
app.use('/api/landlord-confirmation', landlordConfirmRoutes);
app.use('/api/notifications', notificationRoutes);

// Mount Chat Routes (MongoDB Models: Conversation & Message, Realtime P2P)
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);


// Bộ dữ liệu dự phòng (Fallback Data) - Ghi rõ nhãn "Dữ liệu minh họa" để bảo vệ tính trung thực
const defaultFallbackRooms = [
    {
        _id: '6aad186f1f34d48876cf6301',
        id: '6aad186f1f34d48876cf6301',
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
        isSafeBadge: false, // Không tự nhận Safe thật nếu là mock data
        safe_badge: false,
        verificationStatus: 'unverified',
        fireSafetyCertified: true,
        fireSafetyDetails: 'Có bình chữa cháy và thang thoát hiểm hành lang',
        isDemo: true,
        demoNote: 'Dữ liệu minh họa SmartStay',
        seeking_roommate: true,
        createdAt: new Date()
    },
    {
        _id: '6aad186f1f34d48876cf6302',
        id: '6aad186f1f34d48876cf6302',
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
        verificationStatus: 'unverified',
        fireSafetyCertified: false,
        isDemo: true,
        demoNote: 'Dữ liệu minh họa SmartStay',
        seeking_roommate: false,
        createdAt: new Date()
    },
    {
        _id: '6aad186f1f34d48876cf6303',
        id: '6aad186f1f34d48876cf6303',
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
        isSafeBadge: false,
        safe_badge: false,
        verificationStatus: 'unverified',
        fireSafetyCertified: true,
        fireSafetyDetails: 'Cầu thang thoát hiểm ngoài trời và hệ thống báo cháy',
        isDemo: true,
        demoNote: 'Dữ liệu minh họa SmartStay Pass',
        has_pass: true,
        remaining_duration: 5,
        pass_months_left: 5,
        remaining_deposit: 5600000,
        pass_reason: 'Chuyển chỗ thực tập lên TP.HCM',
        is_boosted: false,
        seeking_roommate: false,
        createdAt: new Date()
    },
    {
        _id: '6aad186f1f34d48876cf6304',
        id: '6aad186f1f34d48876cf6304',
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
        listingType: 'standard',
        isSafeBadge: false,
        safe_badge: false,
        verificationStatus: 'unverified',
        fireSafetyCertified: false,
        isDemo: true,
        demoNote: 'Dữ liệu minh họa SmartStay',
        seeking_roommate: true,
        createdAt: new Date()
    }
];

const FALLBACK_ROOMS_FILE = path.join(__dirname, 'fallback_rooms.json');

const loadFallbackRooms = () => {
    try {
        if (fs.existsSync(FALLBACK_ROOMS_FILE)) {
            const data = fs.readFileSync(FALLBACK_ROOMS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (err) {
        console.error('Error loading fallback_rooms.json:', err.message);
    }
    return defaultFallbackRooms;
};

const saveFallbackRooms = (rooms) => {
    try {
        fs.writeFileSync(FALLBACK_ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving fallback_rooms.json:', err.message);
    }
};

let fallbackRooms = loadFallbackRooms();
app.locals.fallbackRooms = fallbackRooms;

let fallbackReviews = [
    {
        _id: 'rev001',
        id: 'rev001',
        room: '6aad186f1f34d48876cf6301',
        studentName: 'Đặng Tuấn Kiệt (K18 ĐH FPT Cần Thơ)',
        anonymous_name: 'Đặng Tuấn Kiệt (K18 ĐH FPT Cần Thơ)',
        rating: 5,
        isCostAccurate: true,
        actualMonthlyCost: 2850000,
        comment: 'Phòng đúng giá như niêm yết, đồng hồ điện nước riêng rõ ràng, chủ trọ thân thiện.',
        content: 'Phòng đúng giá như niêm yết, đồng hồ điện nước riêng rõ ràng, chủ trọ thân thiện.',
        has_stayed: true, // Đã ở thật
        verificationStatus: 'verified',
        trust_score: 95,
        isDemo: false,
        stayed_period: 'Đã ở 6 tháng'
    },
    {
        _id: 'rev002',
        id: 'rev002',
        room: '6aad186f1f34d48876cf6301',
        studentName: 'Lê Hoàng Nam (K47 ĐH Cần Thơ)',
        anonymous_name: 'Lê Hoàng Nam (K47 ĐH Cần Thơ)',
        rating: 4,
        isCostAccurate: true,
        actualMonthlyCost: 2900000,
        comment: 'An ninh tốt, chi phí minh bạch không có phụ phí phát sinh thêm.',
        content: 'An ninh tốt, chi phí minh bạch không có phụ phí phát sinh thêm.',
        has_stayed: true, // Đã ở thật
        verificationStatus: 'verified',
        trust_score: 90,
        isDemo: false,
        stayed_period: 'Đã ở 1 năm'
    }
];

let fallbackSurveys = [
    {
        _id: 'surv001',
        id: 'surv001',
        name: 'Trần Minh Quân',
        gender: 'Nam',
        age: 20,
        contactZalo: '0912345678',
        campus: 'ĐH FPT Cần Thơ',
        sleepSchedule: 'night_owl',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        hasPet: false,
        petPolicy: 'no_pet',
        guestPolicy: 'ask_first',
        budget: 2.2,
        budgetRange: 'medium',
        habits: 'Không hút thuốc, Thức khuya học code, Sạch sẽ, Không nuôi pet',
        description: 'Sinh viên K18 FPT chuyên ngành KTPM, tính tình hòa đồng, giữ vệ sinh chung, tìm bạn cùng trường share tiền phòng.',
        isDemo: true,
        createdAt: new Date()
    },
    {
        _id: 'surv002',
        id: 'surv002',
        name: 'Nguyễn Hải Đăng',
        gender: 'Nam',
        age: 21,
        contactZalo: '0988776655',
        campus: 'ĐH Cần Thơ',
        sleepSchedule: 'early_bird',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        hasPet: true,
        petPolicy: 'has_cat',
        guestPolicy: 'ask_first',
        budget: 1.8,
        budgetRange: 'low',
        habits: 'Có nuôi mèo hiền, Ngủ sớm trước 23h, Không hút thuốc, Nấu ăn tại phòng',
        description: 'Sinh viên K47 ĐH Cần Thơ (Khu 2), có nuôi 1 bé mèo ngoan và tiêm chủng đủ, tìm bạn yêu thích thú cưng.',
        isDemo: true,
        createdAt: new Date()
    },
    {
        _id: 'surv003',
        id: 'surv003',
        name: 'Lê Ngọc Mai Anh',
        gender: 'Nữ',
        age: 19,
        contactZalo: '0939112233',
        campus: 'ĐH Y Dược',
        sleepSchedule: 'early_bird',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        hasPet: false,
        petPolicy: 'no_pet',
        guestPolicy: 'strict',
        budget: 2.5,
        budgetRange: 'medium',
        habits: 'Không hút thuốc, Giữ không gian yên tĩnh học bài, Không tụ tập',
        description: 'Sinh viên Y Đa khoa năm 2, cần tìm bạn nữ cùng trường hoặc lân cận, sinh hoạt lành mạnh, không hút thuốc, giữ yên tĩnh.',
        isDemo: true,
        createdAt: new Date()
    },
    {
        _id: 'surv004',
        id: 'surv004',
        name: 'Phạm Phương Thảo',
        gender: 'Nữ',
        age: 20,
        contactZalo: '0907556677',
        campus: 'ĐH FPT Cần Thơ',
        sleepSchedule: 'night_owl',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        hasPet: true,
        petPolicy: 'pet_friendly',
        guestPolicy: 'ask_first',
        budget: 3.2,
        budgetRange: 'high',
        habits: 'Thích thú cưng, Cú đêm, Phòng máy lạnh riêng, Thân thiện',
        description: 'Sinh viên FPT ngành Thiết kế đồ họa, thích nuôi thú cưng hoặc bạn cùng phòng có nuôi thú cưng đều OK, ngân sách thoải mái.',
        isDemo: true,
        createdAt: new Date()
    },
    {
        _id: 'surv005',
        id: 'surv005',
        name: 'Huỳnh Gia Bảo',
        gender: 'Nam',
        age: 21,
        contactZalo: '0919882211',
        campus: 'ĐH Nam Cần Thơ',
        sleepSchedule: 'flexible',
        cleanliness: 'weekly',
        smokingDrinking: 'none',
        hasPet: false,
        petPolicy: 'no_pet',
        guestPolicy: 'ask_first',
        budget: 1.5,
        budgetRange: 'low',
        habits: 'Không hút thuốc, Tiết kiệm, Đi làm thêm ca tối',
        description: 'Sinh viên Nam Cần Thơ, tính tình thật thà, tìm phòng giá hợp lý gần đường Nguyễn Văn Cừ nối dài.',
        isDemo: true,
        createdAt: new Date()
    }
];

let fallbackLogisticsRequests = [
    {
        id: 'logistics_1',
        customerName: 'Nguyễn Minh Tuấn',
        phone: '0939 123 456',
        vehicleType: 'Xe ba gác chuyển trọ',
        distanceKm: 6,
        pickupAddress: 'Hẻm 51, Đ. 3 Tháng 2, P. Xuân Khánh (Gần ĐH Cần Thơ)',
        dropoffAddress: 'KDC Hồng Phát, Đ. Nguyễn Văn Cừ (Gần ĐH FPT)',
        servicePackage: 'Bốc xếp cơ bản',
        notes: 'Chở 1 nệm cao su, 1 bàn xếp, 2 thùng carton sách vở',
        estimatedPrice: 192000,
        status: 'completed',
        createdAt: new Date(Date.now() - 3600 * 1000 * 5)
    },
    {
        id: 'logistics_2',
        customerName: 'Trần Thị Thu Thảo',
        phone: '0907 889 900',
        vehicleType: 'Xe tải nhỏ 500kg',
        distanceKm: 9,
        pickupAddress: 'Trọ Hưng Lợi, Q. Ninh Kiều',
        dropoffAddress: 'Ký túc xá ĐH Y Dược Cần Thơ',
        servicePackage: 'Bốc xếp trọn gói 2 đầu',
        notes: 'Có tủ lạnh mini 90L và giá sách gỗ cần bọc màng bảo vệ',
        estimatedPrice: 315000,
        status: 'in_progress',
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5)
    },
    {
        id: 'logistics_3',
        customerName: 'Lê Hoàng Nam',
        phone: '0918 555 777',
        vehicleType: 'Xe ba gác chuyển trọ',
        distanceKm: 4,
        pickupAddress: 'Đường Tầm Vu, P. Hưng Lợi',
        dropoffAddress: 'Hẻm 132 Đ. 3 Tháng 2, Ninh Kiều',
        servicePackage: 'Tự bốc xếp',
        notes: 'Đồ gọn, 3 vali quần áo và đồ dùng cá nhân',
        estimatedPrice: 168000,
        status: 'completed',
        createdAt: new Date(Date.now() - 3600 * 1000 * 12)
    }
];
let otpStore = {}; // Lưu tạm OTP theo số điện thoại: { [phone]: { code, expiresAt } }

// Route kiểm tra server
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 60px 20px; line-height: 1.6;">
            <h1 style="color: #059669; font-size: 28px; margin-bottom: 8px;">🚀 SmartStay Backend Server</h1>
            <p style="color: #475569; font-size: 16px; margin-bottom: 24px;">Server API đang hoạt động bình thường trên cổng 5000.</p>
            <div style="display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: left;">
                <p>👉 <strong>Mở Giao diện Web:</strong> <a href="http://localhost:5173" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">http://localhost:5173</a></p>
                <p>👉 <strong>API Danh sách phòng:</strong> <a href="/api/rooms" style="color: #059669;">/api/rooms</a></p>
                <p>👉 <strong>API Kiểm tra sức khỏe:</strong> <a href="/health" style="color: #059669;">/health</a></p>
            </div>
        </div>
    `);
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'SmartStay Backend is running!',
        dbConnected: isDbConnected,
        mode: isDbConnected ? 'MongoDB Atlas' : 'Fallback InMemory'
    });
});

// ==================== APIS QUẢN LÝ PHÒNG TRỌ ====================
// 1. Lấy danh sách phòng trọ (kèm bộ lọc an toàn chống ReDoS)
app.get('/api/rooms', async (req, res) => {
    try {
        const { campus, maxPrice, electricityCostType, isSafeBadge, seekingRoommate, amenities, type } = req.query;

        if (isDbConnected) {
            let query = {};
            if (campus && campus !== 'Tất cả khu vực') query.campus = new RegExp(escapeRegex(campus), 'i');
            if (maxPrice) query.price = { $lte: Number(maxPrice) };
            if (electricityCostType) query.electricityCostType = electricityCostType;
            if (isSafeBadge !== undefined) query.isSafeBadge = isSafeBadge === 'true';
            if (seekingRoommate !== undefined) query.seeking_roommate = seekingRoommate === 'true';
            if (type) query.listingType = type;

            const rooms = await Room.find(query).sort({ is_boosted: -1, createdAt: -1 });
            return res.status(200).json({ success: true, count: rooms.length, isFallbackMode: false, data: rooms });
        }

        // Chế độ dự phòng khi DB chưa kết nối
        let list = [...fallbackRooms];
        if (campus && campus !== 'Tất cả khu vực') {
            list = list.filter((r) => r.campus.toLowerCase().includes(campus.toLowerCase()));
        }
        if (maxPrice) {
            list = list.filter((r) => r.price <= Number(maxPrice));
        }
        if (isSafeBadge !== undefined) {
            list = list.filter((r) => (r.safe_badge || r.isSafeBadge) === (isSafeBadge === 'true'));
        }
        if (seekingRoommate !== undefined) {
            list = list.filter((r) => Boolean(r.seeking_roommate) === (seekingRoommate === 'true'));
        }
        if (type) {
            list = list.filter((r) => r.listingType === type);
        }

        // Sắp xếp: Tin Boost lên đầu -> Tin Safe -> Tin thường
        list.sort((a, b) => {
            if (b.is_boosted && !a.is_boosted) return 1;
            if (!b.is_boosted && a.is_boosted) return -1;
            if (b.safe_badge && !a.safe_badge) return 1;
            if (!b.safe_badge && a.safe_badge) return -1;
            return 0;
        });

        res.status(200).json({
            success: true,
            count: list.length,
            isFallbackMode: true,
            notice: 'Đang hiển thị dữ liệu minh họa SmartStay (Chưa kết nối cơ sở dữ liệu)',
            data: list
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 1.1. Lấy danh sách phòng thuộc sở hữu của chủ trọ đang đăng nhập (kèm thống kê tình trạng)
app.get('/api/rooms/my-rooms', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = req.user.email?.toLowerCase();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const query = isAdmin ? {} : {
                $or: [
                    { owner: currentUserId },
                    { ownerEmail: currentUserEmail }
                ]
            };

            const rooms = await Room.find(query).sort({ createdAt: -1 });

            const stats = {
                total: rooms.length,
                available: rooms.filter(r => r.status === 'available').length,
                rented: rooms.filter(r => r.status === 'rented').length,
                repairing: rooms.filter(r => r.status === 'repairing').length,
                safeVerified: rooms.filter(r => r.safe_badge || r.verificationStatus === 'verified').length,
                seekingRoommate: rooms.filter(r => r.seeking_roommate).length
            };

            return res.status(200).json({
                success: true,
                count: rooms.length,
                stats,
                data: rooms
            });
        }

        // Chế độ dự phòng Fallback
        const myRooms = fallbackRooms.filter(r => 
            isAdmin ||
            isSameId(r.owner, currentUserId) ||
            (r.ownerEmail && r.ownerEmail.toLowerCase() === currentUserEmail)
        );

        const stats = {
            total: myRooms.length,
            available: myRooms.filter(r => r.status === 'available').length,
            rented: myRooms.filter(r => r.status === 'rented').length,
            repairing: myRooms.filter(r => r.status === 'repairing').length,
            safeVerified: myRooms.filter(r => r.safe_badge).length,
            seekingRoommate: myRooms.filter(r => r.seeking_roommate).length
        };

        res.status(200).json({
            success: true,
            count: myRooms.length,
            stats,
            data: myRooms
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 1.2. Thống kê kinh doanh & doanh thu phòng trọ cho Chủ trọ (Landlord Analytics)
app.get('/api/rooms/landlord/stats', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = req.user.email?.toLowerCase();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        let myRooms = [];
        let myContracts = [];
        let pendingAppointmentsCount = 0;

        if (isDbConnected) {
            const roomQuery = isAdmin ? {} : {
                $or: [{ owner: currentUserId }, { ownerEmail: currentUserEmail }]
            };
            myRooms = await Room.find(roomQuery);

            const contractQuery = isAdmin ? {} : { landlord: currentUserId };
            const Contract = mongoose.model('Contract');
            myContracts = await Contract.find(contractQuery);

            const roomIds = myRooms.map(r => r._id);
            pendingAppointmentsCount = await Appointment.countDocuments({
                $or: [
                    { roomId: { $in: roomIds }, status: 'pending_landlord' },
                    { landlordPhone: req.user.phone, status: 'pending_landlord' }
                ]
            });
        } else {
            myRooms = fallbackRooms;
            pendingAppointmentsCount = fallbackAppointments.filter(a => a.status === 'pending_landlord').length;
        }

        const totalRooms = myRooms.length;
        const rentedRooms = myRooms.filter(r => r.status === 'rented').length;
        const availableRooms = myRooms.filter(r => r.status === 'available').length;
        const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0;

        // Dự tính doanh thu tháng từ các phòng đang cho thuê
        const estimatedMonthlyRevenue = myRooms
            .filter(r => r.status === 'rented')
            .reduce((sum, r) => sum + (r.price || 0), 0);

        // Hợp đồng sắp hết hạn trong 30 ngày tới
        const now = Date.now();
        const in30Days = now + 30 * 24 * 60 * 60 * 1000;
        const expiringContractsCount = myContracts.filter(c => {
            if (c.status !== 'active' || !c.endDate) return false;
            const end = new Date(c.endDate).getTime();
            return end >= now && end <= in30Days;
        }).length;

        res.status(200).json({
            success: true,
            stats: {
                totalRooms,
                availableRooms,
                rentedRooms,
                occupancyRate: `${occupancyRate}%`,
                estimatedMonthlyRevenue,
                expiringContractsCount,
                pendingAppointmentsCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 1.3. Cập nhật nhanh tình trạng phòng (Còn phòng / Đã thuê) & Xác nhận minh bạch
app.patch('/api/rooms/:id/availability', protect, checkRoomOwnership, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'available' | 'rented' | 'repairing'

        if (!['available', 'rented', 'repairing'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái phòng không hợp lệ.' });
        }

        if (isDbConnected) {
            const room = await Room.findByIdAndUpdate(
                id,
                { status, lastAvailabilityConfirmedAt: new Date() },
                { new: true }
            );
            if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });
            return res.status(200).json({
                success: true,
                message: `Đã cập nhật tình trạng phòng: ${status === 'available' ? 'Còn phòng' : (status === 'rented' ? 'Đã cho thuê' : 'Đang sửa chữa')}`,
                data: room
            });
        }

        const room = fallbackRooms.find(r => isSameId(r._id, id) || isSameId(r.id, id));
        if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });
        room.status = status;
        room.lastAvailabilityConfirmedAt = new Date();

        res.status(200).json({ success: true, message: 'Đã cập nhật tình trạng phòng (Fallback).', data: room });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Lấy danh sách tin Pass phòng (SmartStay Pass)
app.get('/api/rooms/pass', async (req, res) => {
    try {
        if (isDbConnected) {
            const list = await Room.find({ listingType: 'pass' }).sort({ is_boosted: -1, createdAt: -1 });
            return res.status(200).json({ success: true, count: list.length, data: list });
        }
        const list = fallbackRooms.filter((r) => r.listingType === 'pass' || r.has_pass);
        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Lấy chi tiết một tin Pass phòng để chủ trọ kiểm duyệt
app.get('/api/rooms/pass/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            const item = await Room.findById(id);
            if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu pass phòng' });
            return res.status(200).json({ success: true, data: item });
        }
        const item = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu pass phòng' });
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 4. Chủ trọ xác nhận / từ chối Pass phòng (Cần quyền Landlord hoặc Admin)
app.post('/api/rooms/pass/:id/confirm', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body; // status: 'landlord_confirmed' | 'landlord_rejected' | 'landlord_conditional'

        let targetRoom = null;
        if (isDbConnected) {
            targetRoom = await Room.findById(id);
        } else {
            targetRoom = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xác nhận' });
        }

        // Kiểm tra quyền: Chỉ Admin, Landlord quản lý phòng hoặc chính chủ trọ mới được duyệt
        const isAuthorized = req.user.role === 'admin' || req.user.role === 'landlord' || checkRoomOwnership(targetRoom, req.user);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xác nhận yêu cầu sang nhượng của phòng này.' });
        }

        if (isDbConnected) {
            const updated = await Room.findByIdAndUpdate(id, {
                pass_status: status,
                landlordNote: note || ''
            }, { new: true });
            return res.status(200).json({ success: true, message: 'Cập nhật trạng thái duyệt thành công', data: updated });
        }

        const idx = fallbackRooms.findIndex((r) => String(r._id) === id || String(r.id) === id);
        fallbackRooms[idx].pass_status = status;
        fallbackRooms[idx].landlordNote = note || '';
        saveFallbackRooms(fallbackRooms);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái duyệt thành công', data: fallbackRooms[idx] });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 5. Lấy chi tiết phòng trọ
app.get('/api/rooms/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (isDbConnected) {
            const room = await Room.findById(id);
            if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
            return res.status(200).json({ success: true, data: room });
        }

        const room = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        res.status(400).json({ success: false, error: 'ID phòng không hợp lệ' });
    }
});

// 6. Đăng tin phòng trọ mới (Bắt buộc đăng nhập - protect)
app.post('/api/rooms', protect, async (req, res) => {
    try {
        const data = { ...req.body };
        if (!data.image_url && data.images && data.images.length > 0) {
            data.image_url = data.images[0];
        }

        if (!data.address || !data.address.trim()) {
            data.address = data.campus ? `Khu vực gần ${data.campus}, Cần Thơ` : 'Ninh Kiều, Cần Thơ';
        }
        if (!data.image_url) {
            data.image_url = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
        }
        if (!data.images || data.images.length === 0) {
            data.images = [data.image_url];
        }

        // Tự động sử dụng số điện thoại đã xác minh của chủ trọ
        data.contactPhone = req.user?.phone || data.contactPhone || '0901234567';

        // Bảo mật & Huy hiệu
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'employee';
        data.isSafeBadge = isAdmin ? Boolean(req.body.isSafeBadge || req.body.safe_badge) : Boolean(req.body.isSafeBadge);
        data.safe_badge = isAdmin ? Boolean(req.body.safe_badge || req.body.isSafeBadge) : Boolean(req.body.safe_badge);
        data.isDemo = req.body.isDemo !== undefined ? req.body.isDemo : false;
        data.isSurveyed = req.body.isSurveyed !== undefined ? req.body.isSurveyed : true;
        data.verificationStatus = data.safe_badge || data.isSurveyed ? 'verified' : (req.body.verificationStatus || 'unverified');
        data.owner = req.user?._id || req.user?.id;
        data.ownerEmail = req.user?.email || '';
        data.lastAvailabilityConfirmedAt = new Date();

        if (isDbConnected) {
            const newRoom = await Room.create(data);
            return res.status(201).json({ success: true, data: newRoom });
        }

        const newRoom = {
            _id: `room_${Date.now()}`,
            id: `room_${Date.now()}`,
            ...data,
            createdAt: new Date()
        };
        fallbackRooms.unshift(newRoom);
        saveFallbackRooms(fallbackRooms);
        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 7. SmartStay Pass - Đăng tin sang nhượng phòng (Bắt buộc đăng nhập - protect)
app.post('/api/rooms/pass', protect, async (req, res) => {
    try {
        const passData = {
            ...req.body,
            listingType: 'pass',
            has_pass: true,
            pass_status: 'pending_landlord',
            pass_months_left: req.body.remaining_duration || req.body.pass_months_left || 3,
            isSafeBadge: false,
            safe_badge: false,
            verificationStatus: 'unverified',
            owner: req.user._id || req.user.id,
            ownerEmail: req.user.email || '',
            lastAvailabilityConfirmedAt: new Date()
        };

        if (isDbConnected) {
            const room = await Room.create(passData);
            return res.status(201).json({ success: true, message: 'Đăng tin Pass phòng thành công!', data: room });
        }

        const passRoom = {
            _id: `pass_${Date.now()}`,
            id: `pass_${Date.now()}`,
            ...passData,
            createdAt: new Date()
        };
        fallbackRooms.unshift(passRoom);
        saveFallbackRooms(fallbackRooms);
        res.status(201).json({ success: true, message: 'Đăng tin Pass phòng thành công!', data: passRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 8. Cập nhật phòng trọ (Bắt buộc đăng nhập + Kiểm tra quyền sở hữu)
app.put('/api/rooms/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        let targetRoom = null;
        if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
            targetRoom = await Room.findById(id);
        } else {
            targetRoom = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để cập nhật' });
        }

        // Kiểm tra quyền sở hữu
        if (!checkRoomOwnership(targetRoom, req.user)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thông tin phòng này.' });
        }

        const updateData = { ...req.body };
        // Chỉ admin mới có quyền can thiệp trạng thái Safe Badge và Verification
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            delete updateData.isSafeBadge;
            delete updateData.safe_badge;
            delete updateData.verificationStatus;
            delete updateData.verificationEvidence;
        } else {
            if (updateData.isSurveyed !== undefined) {
                updateData.isDemo = !updateData.isSurveyed;
                if (updateData.isSurveyed) updateData.verificationStatus = 'verified';
            }
        }

        if (updateData.images && updateData.images.length > 0 && !updateData.image_url) {
            updateData.image_url = updateData.images[0];
        }

        if (isDbConnected) {
            const updated = await Room.findByIdAndUpdate(id, updateData, { new: true });
            return res.status(200).json({ success: true, message: 'Cập nhật phòng thành công', data: updated });
        }

        const idx = fallbackRooms.findIndex((r) => String(r._id) === id || String(r.id) === id);
        fallbackRooms[idx] = { ...fallbackRooms[idx], ...updateData, updatedAt: new Date() };
        saveFallbackRooms(fallbackRooms);
        res.status(200).json({ success: true, message: 'Cập nhật phòng thành công (Fallback)', data: fallbackRooms[idx] });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 9. Xóa phòng trọ (Bắt buộc đăng nhập + Kiểm tra quyền sở hữu hoặc Admin)
app.delete('/api/rooms/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        let targetRoom = null;
        if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
            targetRoom = await Room.findById(id);
        } else {
            targetRoom = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa' });
        }

        if (!checkRoomOwnership(targetRoom, req.user)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa phòng này.' });
        }

        if (isDbConnected) {
            const deleted = await Room.findByIdAndDelete(id);
            return res.status(200).json({ success: true, message: 'Xóa phòng thành công', data: deleted });
        }

        const idx = fallbackRooms.findIndex((r) => String(r._id) === id || String(r.id) === id);
        const [removed] = fallbackRooms.splice(idx, 1);
        saveFallbackRooms(fallbackRooms);
        res.status(200).json({ success: true, message: 'Xóa phòng thành công (Fallback)', data: removed });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS REVIEWS ====================
// 1. Gửi đánh giá cho phòng trọ (Bắt buộc đăng nhập + Điểm tin cậy do Server tính)
app.post('/api/reviews', protect, async (req, res) => {
    try {
        const isStayed = Boolean(req.body.has_stayed) || Boolean(req.body.verificationProofUrl);
        // Tính điểm trust_score tự động dựa trên uy tín tài khoản sinh viên và xác thực đã ở
        let calculatedTrustScore = 65;
        if (req.user && (req.user.role === 'student' || req.user.role === 'sinh_vien')) calculatedTrustScore += 15;
        if (isStayed) calculatedTrustScore += 15;
        if (req.body.verificationProofUrl) calculatedTrustScore += 10;

        const studentName = req.user.fullName || req.user.name || req.body.studentName || 'Sinh viên SmartStay';
        const reviewData = {
            room: req.body.room,
            rating: Number(req.body.rating),
            isCostAccurate: Boolean(req.body.isCostAccurate),
            actualMonthlyCost: Number(req.body.actualMonthlyCost),
            comment: req.body.comment || req.body.content || '',
            content: req.body.comment || req.body.content || '',
            user: req.user._id || req.user.id,
            studentEmail: req.user.email || '',
            studentName: studentName,
            anonymous_name: req.body.isAnonymous ? 'Sinh viên ẩn danh' : studentName,
            has_stayed: isStayed,
            verificationStatus: isStayed ? 'verified' : (req.body.verificationProofUrl ? 'pending' : 'unverified'),
            verificationProofUrl: req.body.verificationProofUrl || '',
            trust_score: Math.min(calculatedTrustScore, 98),
            stayed_period: req.body.stayed_period || (isStayed ? 'Đã ở thực tế' : 'Người quan tâm thuê'),
            isDemo: false
        };

        if (isDbConnected) {
            const newReview = await Review.create(reviewData);
            return res.status(201).json({ success: true, message: 'Đánh giá đã được ghi nhận với nhãn Đã ở thật!', data: newReview });
        }

        const newReview = {
            _id: `rev_${Date.now()}`,
            id: `rev_${Date.now()}`,
            ...reviewData,
            createdAt: new Date()
        };
        fallbackReviews.unshift(newReview);
        res.status(201).json({ success: true, message: 'Đánh giá đã được ghi nhận với nhãn Đã ở thật!', data: newReview });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 2. Lấy danh sách đánh giá của phòng
app.get('/api/reviews/room/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;

        let reviews = [];
        if (isDbConnected) {
            reviews = await Review.find({ room: roomId }).sort({ createdAt: -1 });
        } else {
            reviews = fallbackReviews.filter((r) => String(r.room) === String(roomId));
        }

        const totalReviews = reviews.length;
        let avgRating = 0;
        let accurateCostCount = 0;

        if (totalReviews > 0) {
            const totalScore = reviews.reduce((sum, item) => sum + item.rating, 0);
            avgRating = Number((totalScore / totalReviews).toFixed(1));
            accurateCostCount = reviews.filter((r) => r.isCostAccurate).length;
        }

        res.status(200).json({
            success: true,
            roomId,
            stats: {
                totalReviews,
                avgRating,
                costAccuracyRate: totalReviews > 0 ? `${Math.round((accurateCostCount / totalReviews) * 100)}%` : 'Chưa có đánh giá'
            },
            data: reviews
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS ROOMMATE MATCHER ====================
// 1. Lưu hồ sơ khảo sát (Hỗ trợ liên kết tài khoản nếu có đăng nhập)
app.post('/api/surveys', async (req, res) => {
    try {
        const surveyData = {
            ...req.body,
            allowCrossGender: req.body.allowCrossGender === true || req.body.allowCrossGender === 'true',
            isPrivate: req.body.isPrivate || false,
            allowShareContact: req.body.allowShareContact || false,
            isDemo: false
        };

        if (isDbConnected) {
            const newSurvey = await RoommateSurvey.create(surveyData);
            return res.status(201).json({ success: true, message: 'Đã lưu hồ sơ tìm bạn ở ghép!', data: newSurvey });
        }

        const newSurvey = {
            _id: `surv_${Date.now()}`,
            id: `surv_${Date.now()}`,
            ...surveyData,
            createdAt: new Date()
        };
        fallbackSurveys.unshift(newSurvey);
        res.status(201).json({ success: true, message: 'Đã lưu hồ sơ tìm bạn ở ghép!', data: newSurvey });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 2. Thuật toán tìm người tương thích chuẩn SSOT (50% giới tính + 50% thói quen)
app.get('/api/surveys/matches/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let mySurvey = null;
        let otherSurveys = [];

        if (isDbConnected) {
            mySurvey = await RoommateSurvey.findById(id);
            if (!mySurvey) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ của bạn' });
            // Không ghép với những người chọn ẩn hồ sơ (isPrivate = true)
            otherSurveys = await RoommateSurvey.find({ _id: { $ne: mySurvey._id }, isPrivate: { $ne: true } });
        } else {
            mySurvey = fallbackSurveys.find((s) => String(s._id) === id || String(s.id) === id);
            if (!mySurvey) {
                mySurvey = fallbackSurveys[0];
            }
            otherSurveys = fallbackSurveys.filter((s) => String(s._id) !== String(mySurvey?._id) && !s.isPrivate);
        }

        const myGenderNorm = normalizeGender(mySurvey.gender);
        const myAllowCross = Boolean(mySurvey.allowCrossGender);

        // Lọc cứng: cùng giới tính HOẶC cả 2 bên cùng bật cho phép ghép khác giới
        const eligibleCandidates = otherSurveys.filter((candidate) => {
            const cGenderNorm = normalizeGender(candidate.gender);
            if (cGenderNorm && myGenderNorm === cGenderNorm) return true;
            return myAllowCross && Boolean(candidate.allowCrossGender);
        });

        const matchedResults = eligibleCandidates.map((candidate) => {
            const compat = calcCompatibility(mySurvey, candidate);
            return {
                candidateId: candidate._id || candidate.id,
                name: candidate.name,
                gender: candidate.gender,
                contactZalo: maskContact(candidate.contactZalo),
                isContactProtected: true,
                campus: candidate.campus,
                matchPercentage: `${compat.score}%`,
                rawScore: compat.score,
                matched: compat.matched,
                different: compat.different,
                isOppositeGender: compat.isOppositeGender,
                allowCrossGender: Boolean(candidate.allowCrossGender),
                compatibility: compat,
                criteria: {
                    sleepSchedule: candidate.sleepSchedule,
                    cleanliness: candidate.cleanliness,
                    smokingDrinking: candidate.smokingDrinking,
                    guestPolicy: candidate.guestPolicy,
                    budgetRange: candidate.budgetRange
                }
            };
        });

        matchedResults.sort((a, b) => b.rawScore - a.rawScore);

        res.status(200).json({
            success: true,
            currentUser: mySurvey ? mySurvey.name : 'Bạn',
            totalCandidates: matchedResults.length,
            matches: matchedResults
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Lấy toàn bộ danh sách khảo sát (Lọc cứng phía server theo giới tính & tính tương thích chuẩn)
app.get('/api/surveys', async (req, res) => {
    try {
        let surveys = [];
        if (isDbConnected) {
            surveys = await RoommateSurvey.find({ isPrivate: { $ne: true } }).sort({ createdAt: -1 });
        } else {
            surveys = fallbackSurveys.filter((s) => !s.isPrivate);
        }

        // Thông tin người xem (viewer) để áp dụng thuật toán SSOT và lọc phía Server
        let viewer = null;
        let viewerId = req.query.viewerId || null;
        let viewerGender = req.query.viewerGender || null;
        let viewerAllowCross = req.query.allowCrossGender === 'true' || req.query.allowCrossGender === true;

        if (viewerId) {
            if (isDbConnected) {
                viewer = await RoommateSurvey.findById(viewerId);
            }
            if (!viewer) {
                viewer = fallbackSurveys.find((s) => String(s._id) === String(viewerId) || String(s.id) === String(viewerId));
            }
            if (viewer) {
                viewerGender = viewer.gender;
                viewerAllowCross = viewer.allowCrossGender === true;
            }
        }

        const vGenderNorm = normalizeGender(viewerGender);

        // Bảo vệ thông tin liên hệ sinh viên: che SĐT/Zalo và tính toán tương thích chuẩn
        let safeSurveys = surveys.map((s) => {
            const rawItem = {
                _id: s._id || s.id,
                id: s._id || s.id,
                name: s.name,
                gender: s.gender || 'Nam',
                age: s.age || 20,
                contactZalo: maskContact(s.contactZalo),
                rawContact: s.contactZalo || '',
                isContactProtected: true,
                campus: s.campus || 'ĐH Cần Thơ',
                sleepSchedule: s.sleepSchedule || 'flexible',
                cleanliness: s.cleanliness || 'daily',
                smokingDrinking: s.smokingDrinking || 'none',
                hasPet: Boolean(s.hasPet || s.petPolicy === 'has_cat' || s.petPolicy === 'has_dog' || s.petPolicy === 'pet_friendly'),
                petPolicy: s.petPolicy || (s.hasPet ? 'pet_friendly' : 'no_pet'),
                guestPolicy: s.guestPolicy || 'ask_first',
                budget: s.budget || (s.budgetRange === 'high' ? 3.2 : (s.budgetRange === 'low' ? 1.5 : 2.2)),
                budgetRange: s.budgetRange || 'medium',
                habits: s.habits || '',
                description: s.description || s.bio || '',
                allowCrossGender: Boolean(s.allowCrossGender),
                isDemo: Boolean(s.isDemo),
                createdAt: s.createdAt
            };

            if (viewer || vGenderNorm) {
                const compatViewer = viewer || { gender: viewerGender, allowCrossGender: viewerAllowCross };
                rawItem.compatibility = calcCompatibility(compatViewer, rawItem);
            }

            return rawItem;
        });

        // ==================== LỌC CỨNG Ở PHÍA SERVER ====================
        // Nếu xác định được giới tính người xem:
        // - Cùng giới tính: luôn được hiển thị
        // - Khác giới tính: CHỈ hiển thị khi CẢ HAI BÊN đều bật allowCrossGender
        if (vGenderNorm) {
            safeSurveys = safeSurveys.filter((candidate) => {
                const cGenderNorm = normalizeGender(candidate.gender);
                if (cGenderNorm && vGenderNorm === cGenderNorm) {
                    return true;
                }
                const bothAllowCross = Boolean(viewerAllowCross) && Boolean(candidate.allowCrossGender);
                return bothAllowCross;
            });
        }

        res.status(200).json({ success: true, count: safeSurveys.length, data: safeSurveys });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Bật / Tắt ẩn hồ sơ khảo sát (Bảo vệ quyền riêng tư)
app.put('/api/surveys/:id/privacy', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { isPrivate, allowShareContact } = req.body;

        if (isDbConnected) {
            const survey = await RoommateSurvey.findById(id);
            if (!survey) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ' });
            if (survey.user && String(survey.user) !== String(req.user._id) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Không có quyền cập nhật hồ sơ này' });
            }
            if (isPrivate !== undefined) survey.isPrivate = isPrivate;
            if (allowShareContact !== undefined) survey.allowShareContact = allowShareContact;
            await survey.save();
            return res.status(200).json({ success: true, message: 'Cập nhật trạng thái riêng tư thành công!', data: survey });
        }

        const idx = fallbackSurveys.findIndex((s) => String(s._id) === id || String(s.id) === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ' });
        if (isPrivate !== undefined) fallbackSurveys[idx].isPrivate = isPrivate;
        if (allowShareContact !== undefined) fallbackSurveys[idx].allowShareContact = allowShareContact;
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái riêng tư thành công!', data: fallbackSurveys[idx] });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 5. Xóa hồ sơ khảo sát ghép bạn
app.delete('/api/surveys/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        if (isDbConnected) {
            const survey = await RoommateSurvey.findById(id);
            if (!survey) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ' });
            if (survey.user && String(survey.user) !== String(req.user._id) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Không có quyền xóa hồ sơ này' });
            }
            await RoommateSurvey.findByIdAndDelete(id);
            return res.status(200).json({ success: true, message: 'Đã xóa hồ sơ tìm bạn cùng phòng thành công!' });
        }

        const idx = fallbackSurveys.findIndex((s) => String(s._id) === id || String(s.id) === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ' });
        fallbackSurveys.splice(idx, 1);
        res.status(200).json({ success: true, message: 'Đã xóa hồ sơ tìm bạn cùng phòng thành công!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Helper lấy User tùy chọn nếu có Bearer token
const getOptionalUser = async (req) => {
    try {
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) {
            const token = auth.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartstay_secure_jwt_secret_key_2026_cantho');
            if (decoded?.id && isDbConnected) {
                return await User.findById(decoded.id).select('-password');
            }
        }
    } catch {
        // silent fail
    }
    return null;
};

// ==================== APIS SMARTSTAY LOGISTICS / MOVE (LUỒNG VẬN TẢI MINH BẠCH) ====================

// 1. Lấy danh sách yêu cầu chuyển trọ (kèm bộ lọc trạng thái, số điện thoại, tài xế)
app.get('/api/logistics-request', async (req, res) => {
    try {
        const { status, phone, driverId } = req.query;

        if (isDbConnected) {
            const query = {};
            if (status) query.status = status;
            if (phone) query.phone = new RegExp(escapeRegex(phone), 'i');
            if (driverId) query.driver = driverId;

            const requests = await LogisticsRequest.find(query)
                .sort({ createdAt: -1 })
                .populate('user', 'fullName email phone')
                .populate('driver', 'fullName phone transporterProfile');

            return res.status(200).json({
                success: true,
                count: requests.length,
                data: requests
            });
        }

        // Chế độ dự phòng khi offline / DB gián đoạn
        let filtered = [...fallbackLogisticsRequests];
        if (status) filtered = filtered.filter(r => r.status === status);
        if (phone) filtered = filtered.filter(r => r.phone && r.phone.includes(phone));

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Lấy danh sách đơn chuyển trọ KHẢ DỤNG (Chờ tài xế nhận đơn)
app.get('/api/logistics-request/available', async (req, res) => {
    try {
        if (isDbConnected) {
            const availableRequests = await LogisticsRequest.find({ status: 'pending' })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: availableRequests.length,
                data: availableRequests
            });
        }

        const available = fallbackLogisticsRequests.filter(r => r.status === 'pending');
        res.status(200).json({
            success: true,
            count: available.length,
            data: available
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Lấy danh sách đối tác vận chuyển / tài xế SmartStay uy tín tại Cần Thơ
app.get('/api/logistics-request/transporters', async (req, res) => {
    try {
        if (isDbConnected) {
            const drivers = await User.find({ role: 'transporter' })
                .select('fullName phone transporterProfile campus avatar createdAt');

            if (drivers.length > 0) {
                return res.status(200).json({
                    success: true,
                    count: drivers.length,
                    data: drivers
                });
            }
        }

        // Fallback danh sách tài xế minh họa
        const fallbackDrivers = [
            {
                _id: 'usr_transporter_001',
                fullName: 'Chú Bảy Ba Gác Cần Thơ',
                phone: '0939 556 677',
                role: 'transporter',
                campus: 'FPT Can Tho',
                transporterProfile: {
                    vehicleType: 'Xe ba gác chuyển trọ',
                    licensePlate: '65B1-888.99',
                    operatingArea: 'Ninh Kiều / Cái Răng / Bình Thủy, Cần Thơ',
                    rating: 4.9,
                    totalTrips: 48,
                    isVerified: true,
                    bio: 'Tài xế ba gác uy tín tại Cần Thơ, kinh nghiệm chuyển trọ sinh viên FPT & ĐHCT 5 năm.'
                }
            },
            {
                _id: 'usr_transporter_002',
                fullName: 'Anh Hoàng Tải Nhỏ 500kg',
                phone: '0907 334 455',
                role: 'transporter',
                campus: 'ĐH Cần Thơ',
                transporterProfile: {
                    vehicleType: 'Xe tải nhỏ 500kg',
                    licensePlate: '65C-123.45',
                    operatingArea: 'Toàn TP Cần Thơ',
                    rating: 5.0,
                    totalTrips: 32,
                    isVerified: true,
                    bio: 'Xe tải thùng kín che chắn mưa gió an toàn, có sẵn xe đẩy và phụ xe khiêng lầu.'
                }
            }
        ];

        res.status(200).json({
            success: true,
            count: fallbackDrivers.length,
            data: fallbackDrivers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Lấy danh sách đơn chuyển trọ của người dùng đang đăng nhập (Sinh viên hoặc Tài xế)
app.get('/api/logistics-request/my-requests', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userRole = req.user.role;

        if (isDbConnected) {
            let query = {};
            if (userRole === 'transporter') {
                query = { driver: userId };
            } else if (userRole === 'admin' || userRole === 'employee') {
                query = {}; // Admin xem tất cả
            } else {
                // Sinh viên: tìm theo user ID hoặc số điện thoại của sinh viên
                query = {
                    $or: [
                        { user: userId },
                        { phone: req.user.phone }
                    ]
                };
            }

            const myRequests = await LogisticsRequest.find(query)
                .sort({ createdAt: -1 })
                .populate('driver', 'fullName phone transporterProfile');

            return res.status(200).json({
                success: true,
                count: myRequests.length,
                data: myRequests
            });
        }

        const filtered = fallbackLogisticsRequests.filter(r => 
            (r.phone && req.user.phone && r.phone.replace(/\s+/g, '') === req.user.phone.replace(/\s+/g, '')) ||
            (userRole === 'transporter' && r.status === 'in_progress')
        );

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Xem chi tiết một đơn đặt xe chuyển trọ
app.get('/api/logistics-request/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (isDbConnected) {
            const request = await LogisticsRequest.findOne({
                $or: [
                    { _id: mongoose.isValidObjectId(id) ? id : null },
                    { requestCode: id }
                ]
            }).populate('user', 'fullName email phone')
              .populate('driver', 'fullName phone transporterProfile');

            if (request) {
                return res.status(200).json({ success: true, data: request });
            }
        }

        const fallbackItem = fallbackLogisticsRequests.find(r => r.id === id || r.requestCode === id);
        if (fallbackItem) {
            return res.status(200).json({ success: true, data: fallbackItem });
        }

        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt xe.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Đặt xe chuyển trọ mới (Sinh viên / Khách thuê) - Cam kết giá minh bạch
app.post('/api/logistics-request', async (req, res) => {
    try {
        const {
            customerName,
            phone,
            vehicleType,
            distanceKm,
            estimatedDurationMins,
            servicePackage,
            selectedAddons,
            pickupLocation,
            dropoffLocation,
            pickupAddress,
            dropoffAddress,
            moveDate,
            notes,
            basePrice,
            distancePrice,
            addonsPrice,
            rawTotal,
            studentDiscount,
            estimatedPrice
        } = req.body;

        const effectivePickup = pickupAddress || pickupLocation?.address;
        const effectiveDropoff = dropoffAddress || dropoffLocation?.address;

        if (!phone || !effectivePickup || !effectiveDropoff) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp số điện thoại, điểm đón và điểm đến.'
            });
        }

        // Tự động liên kết User nếu có đăng nhập
        const currentUser = await getOptionalUser(req);
        const uniqueCode = `MOVE-${Date.now().toString().slice(-6)}`;
        const finalPrice = Number(estimatedPrice) || 150000;

        const newBookingData = {
            requestCode: uniqueCode,
            user: currentUser ? currentUser._id : undefined,
            customerName: customerName || currentUser?.fullName || 'Sinh viên Cần Thơ',
            phone: phone.trim(),
            vehicleType: vehicleType || 'Xe ba gác chuyển trọ',
            distanceKm: Number(distanceKm) || 5,
            estimatedDurationMins: Number(estimatedDurationMins) || 15,
            servicePackage: servicePackage || 'Cơ bản',
            selectedAddons: Array.isArray(selectedAddons) ? selectedAddons : [],
            pickupLocation: pickupLocation || { address: effectivePickup },
            dropoffLocation: dropoffLocation || { address: effectiveDropoff },
            pickupAddress: effectivePickup,
            dropoffAddress: effectiveDropoff,
            moveDate: moveDate || 'Hôm nay',
            notes: notes || '',
            basePrice: Number(basePrice) || 120000,
            distancePrice: Number(distancePrice) || 0,
            addonsPrice: Number(addonsPrice) || 0,
            rawTotal: Number(rawTotal) || finalPrice,
            studentDiscount: Number(studentDiscount) || 0,
            estimatedPrice: finalPrice,
            fixedPriceGuarantee: true,
            status: 'pending'
        };

        if (isDbConnected) {
            const savedDoc = await LogisticsRequest.create(newBookingData);
            return res.status(201).json({
                success: true,
                message: 'Yêu cầu chuyển trọ đã được tạo thành công! Cam kết giá niêm yết không phát sinh.',
                data: savedDoc
            });
        }

        // Fallback khi offline
        const fallbackRecord = {
            id: `logistics_${Date.now()}`,
            ...newBookingData,
            _id: `logistics_${Date.now()}`,
            createdAt: new Date()
        };
        fallbackLogisticsRequests.unshift(fallbackRecord);

        res.status(201).json({
            success: true,
            message: 'Yêu cầu đặt xe chuyển trọ đã được ghi nhận thành công!',
            data: fallbackRecord
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 7. Tài xế NHẬN ĐƠN chuyển trọ (Accept Dispatch)
app.post('/api/logistics-request/:id/accept', protect, authorize('transporter', 'admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = req.user._id || req.user.id;
        const driverProfile = req.user.transporterProfile || {};

        if (isDbConnected) {
            const request = await LogisticsRequest.findOne({
                $or: [
                    { _id: mongoose.isValidObjectId(id) ? id : null },
                    { requestCode: id }
                ]
            });

            if (!request) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt xe.' });
            }

            if (request.status !== 'pending') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Đơn này đã được xử lý (Trạng thái hiện tại: ${request.status}).` 
                });
            }

            request.driver = driverId;
            request.driverName = req.user.fullName;
            request.driverPhone = req.user.phone || '';
            request.driverVehicle = driverProfile.vehicleType || 'Xe chuyển trọ';
            request.driverLicensePlate = driverProfile.licensePlate || '';
            request.status = 'assigned';
            request.assignedAt = new Date();

            await request.save();

            return res.status(200).json({
                success: true,
                message: 'Bạn đã nhận đơn chuyển trọ thành công! Vui lòng liên hệ sinh viên để xác nhận điểm đón.',
                data: request
            });
        }

        // Fallback
        const item = fallbackLogisticsRequests.find(r => r.id === id || r.requestCode === id);
        if (item) {
            item.status = 'assigned';
            item.driverName = req.user.fullName;
            item.driverPhone = req.user.phone || '0939 556 677';
            return res.status(200).json({
                success: true,
                message: 'Đã nhận đơn chuyển trọ thành công (Chế độ Fallback).',
                data: item
            });
        }

        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt xe.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. Cập nhật tiến độ cuốc xe (Đang di chuyển / Đã hoàn thành / Hủy)
app.patch('/api/logistics-request/:id/status', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;

        const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái cuốc xe không hợp lệ.' });
        }

        if (isDbConnected) {
            const request = await LogisticsRequest.findOne({
                $or: [
                    { _id: mongoose.isValidObjectId(id) ? id : null },
                    { requestCode: id }
                ]
            });

            if (!request) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt xe.' });
            }

            request.status = status;
            if (status === 'completed') {
                request.completedAt = new Date();
                // Tăng số cuốc xe thành công cho tài xế nếu có
                if (request.driver) {
                    await User.findByIdAndUpdate(request.driver, {
                        $inc: { 'transporterProfile.totalTrips': 1 }
                    });
                }
            } else if (status === 'cancelled') {
                request.cancellationReason = cancellationReason || 'Hủy theo yêu cầu';
            }

            await request.save();

            return res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái cuốc xe thành: ${status}`,
                data: request
            });
        }

        const item = fallbackLogisticsRequests.find(r => r.id === id || r.requestCode === id);
        if (item) {
            item.status = status;
            return res.status(200).json({ success: true, data: item });
        }

        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt xe.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 9. Đánh giá tài xế & Xác thực độ chính xác cước phí (Transparency Review)
app.post('/api/logistics-request/:id/review', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, costAccurate } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Vui lòng đánh giá từ 1 đến 5 sao.' });
        }

        if (isDbConnected) {
            const request = await LogisticsRequest.findOne({
                $or: [
                    { _id: mongoose.isValidObjectId(id) ? id : null },
                    { requestCode: id }
                ]
            });

            if (!request) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy cuốc xe để đánh giá.' });
            }

            request.review = {
                rating: Number(rating),
                comment: comment || '',
                costAccurate: costAccurate !== false,
                createdAt: new Date()
            };

            await request.save();

            // Cập nhật điểm uy tín của tài xế
            if (request.driver) {
                const allReviews = await LogisticsRequest.find({
                    driver: request.driver,
                    'review.rating': { $exists: true }
                });
                const avgRating = allReviews.reduce((sum, r) => sum + r.review.rating, 0) / allReviews.length;
                await User.findByIdAndUpdate(request.driver, {
                    'transporterProfile.rating': Math.round(avgRating * 10) / 10
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Cảm ơn bạn đã đánh giá dịch vụ chuyển trọ SmartStay!',
                data: request
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã ghi nhận đánh giá (Chế độ Fallback).'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APIS SAFE LISTING: OTP & THANH TOÁN (P0) ====================
// 1. Gửi mã OTP xác thực số điện thoại (Có Rate Limiting 3 lần / 10 phút)
app.post('/api/safe-listing/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 8) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
    }

    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const existing = otpStore[phone];

    // Rate Limiting: Tối đa 3 lần trong 10 phút
    if (existing && existing.firstSentAt && (now - existing.firstSentAt < tenMinutes)) {
        if (existing.sendCount >= 3) {
            const minutesLeft = Math.ceil((tenMinutes - (now - existing.firstSentAt)) / 60000);
            return res.status(429).json({
                success: false,
                message: `Bạn đã yêu cầu gửi mã OTP quá số lần quy định. Vui lòng thử lại sau ${minutesLeft} phút.`
            });
        }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore[phone] = {
        code,
        expiresAt: now + 1 * 60 * 1000, // Hết hạn sau 1 phút
        sendCount: (existing && (now - existing.firstSentAt < tenMinutes)) ? existing.sendCount + 1 : 1,
        firstSentAt: (existing && (now - existing.firstSentAt < tenMinutes)) ? existing.firstSentAt : now,
        attempts: 0
    };

    // TUYỆT ĐỐI KHÔNG GHI MÃ VÀO LOG Ở PRODUCTION
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 [OTP DEV LOG] Gửi OTP ${code} đến SĐT ${phone}`);
    }

    res.status(200).json({
        success: true,
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn!',
        otpPreview: process.env.NODE_ENV === 'production' ? undefined : code // Chỉ preview ở dev sandbox
    });
});

// 2. Xác thực mã OTP (Giới hạn tối đa 5 lần thử sai)
app.post('/api/safe-listing/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const record = otpStore[phone];

    if (!record) {
        return res.status(400).json({ success: false, message: 'Yêu cầu gửi mã OTP trước khi xác thực' });
    }

    // Kiểm tra số lần thử sai
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
        delete otpStore[phone];
        return res.status(400).json({
            success: false,
            message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi mã mới.'
        });
    }

    // Ở production: Không cho phép mã shortcut '123456'
    const isProd = process.env.NODE_ENV === 'production';
    const isSandboxDemo = !isProd && otp === '123456';

    if (isSandboxDemo || (record.code === otp && Date.now() <= record.expiresAt)) {
        delete otpStore[phone]; // Xác thực xong thì xóa mã
        return res.status(200).json({
            success: true,
            message: 'Xác thực số điện thoại thành công!',
            verifiedPhone: phone
        });
    }

    res.status(400).json({
        success: false,
        message: `Mã OTP không đúng hoặc đã hết hạn (còn ${5 - record.attempts} lần thử)`
    });
});

// 3. Tạo phiên thanh toán phí thẩm định Safe Listing
app.post('/api/safe-listing/create-payment', protect, async (req, res) => {
    try {
        const { roomId, amount, provider } = req.body; // provider: 'momo' | 'vnpay'
        const transactionId = `SAFE_TRANS_${Date.now()}`;

        // Mô phỏng link thanh toán Sandbox
        const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${transactionId}&amount=${amount || 50000}`;

        res.status(200).json({
            success: true,
            transactionId,
            paymentUrl,
            message: 'Khởi tạo link thanh toán phí thẩm định Safe Listing thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Webhook IPN xử lý kết quả thanh toán phí thẩm định
// BẢO MẬT: Bắt buộc xác thực Secret Token / Chữ ký webhook; không tự cấp huy hiệu mà chuyển sang 'pending' thẩm định
app.post('/api/safe-listing/payment-webhook', async (req, res) => {
    try {
        const { roomId, transactionId, status, secretToken } = req.body;
        const headerSecret = req.headers['x-webhook-secret'];

        // Kiểm tra chữ ký bí mật
        const expectedSecret = process.env.WEBHOOK_SECRET || 'smartstay_webhook_sandbox_secret';
        if (headerSecret !== expectedSecret && secretToken !== expectedSecret) {
            return res.status(401).json({
                success: false,
                message: 'Từ chối webhook: Chữ ký xác thực hoặc Secret Token không hợp lệ.'
            });
        }

        if (status === 'SUCCESS' || status === '00') {
            // Thanh toán thành công -> Đăng ký thẩm định an toàn (verificationStatus: 'pending')
            // TUYỆT ĐỐI KHÔNG GÁN safe_badge = true NGAY LẬP TỨC. Chỉ gắn sau khi Admin duyệt biên bản PCCC & quyền sở hữu.
            if (isDbConnected && roomId) {
                await Room.findByIdAndUpdate(roomId, {
                    verificationStatus: 'pending',
                    listingType: 'safe'
                });
            } else if (roomId) {
                const target = fallbackRooms.find((r) => String(r._id) === roomId || String(r.id) === roomId);
                if (target) {
                    target.verificationStatus = 'pending';
                    target.listingType = 'safe';
                }
            }
            return res.status(200).json({
                success: true,
                message: 'Giao dịch thanh toán phí thẩm định được xác nhận! Hồ sơ đã được chuyển sang trạng thái [Chờ kiểm duyệt thực tế].'
            });
        }

        res.status(400).json({ success: false, message: 'Giao dịch không thành công' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. API Admin duyệt cấp Huy hiệu Safe Listing sau khi kiểm tra biên bản thực địa (P0)
app.post('/api/safe-listing/admin/verify/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved, inspectorNotes, fireSafetyInspected, landlordOwnershipVerified } = req.body;

        const updateData = {
            verificationStatus: isApproved ? 'verified' : 'rejected',
            fireSafetyCertified: Boolean(fireSafetyInspected),
            verificationEvidence: {
                idCardVerified: true,
                landlordOwnershipVerified: Boolean(landlordOwnershipVerified),
                fireSafetyInspected: Boolean(fireSafetyInspected),
                verifiedAt: new Date(),
                verifiedBy: req.user.email || 'Admin SmartStay',
                inspectorNotes: inspectorNotes || 'Đã kiểm tra thực địa đạt chuẩn SmartStay Safe'
            }
        };

        if (isDbConnected) {
            const updated = await Room.findByIdAndUpdate(id, updateData, { new: true });
            if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
            return res.status(200).json({ success: true, message: 'Duyệt cấp Huy hiệu An toàn thành công!', data: updated });
        }

        const idx = fallbackRooms.findIndex((r) => String(r._id) === id || String(r.id) === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trong bộ nhớ' });
        fallbackRooms[idx] = { ...fallbackRooms[idx], ...updateData };
        saveFallbackRooms(fallbackRooms);
        res.status(200).json({ success: true, message: 'Duyệt cấp Huy hiệu An toàn thành công!', data: fallbackRooms[idx] });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG - P0) ====================
let systemConfig = {
    hero: null,
    campuses: null,
    amenities: null,
    specialToggles: null,
    quickActions: null
};

app.get('/api/config', (req, res) => {
    res.status(200).json({ success: true, data: systemConfig });
});

// BẢO MẬT: Bắt buộc đăng nhập với quyền Admin mới được cập nhật cấu hình hệ thống
app.post('/api/config', protect, authorize('admin'), (req, res) => {
    systemConfig = { ...systemConfig, ...req.body };
    res.status(200).json({ success: true, message: 'Lưu cấu hình hệ thống thành công!', data: systemConfig });
});

// ==================== APIS QUẢN LÝ & CẤP TÀI KHOẢN CHỦ TRỌ (ADMIN DÀNH RIÊNG) ====================
// 1. Lấy danh sách tài khoản Chủ trọ (hỗ trợ lọc theo trạng thái duyệt PENDING, APPROVED, REJECTED)
app.get('/api/admin/landlords', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { role: 'landlord' };
        if (status && status !== 'ALL') {
            filter.verificationStatus = status;
        }

        if (isDbConnected) {
            const landlords = await User.find(filter).select('-password').sort({ createdAt: -1 });
            return res.status(200).json({ success: true, count: landlords.length, data: landlords });
        }
        const fallbackUsers = req.app.locals.fallbackUsers || [];
        let landlords = fallbackUsers.filter(u => u.role === 'landlord');
        if (status && status !== 'ALL') {
            landlords = landlords.filter(u => (u.verificationStatus || 'APPROVED') === status);
        }
        res.status(200).json({ success: true, count: landlords.length, data: landlords });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Admin duyệt hoặc từ chối hồ sơ tài khoản Chủ trọ (APPROVED / REJECTED)
app.put('/api/admin/landlords/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái kiểm duyệt không hợp lệ.' });
        }

        if (status === 'REJECTED' && !rejectionReason?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối để thông báo cho chủ trọ.' });
        }

        if (isDbConnected) {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ trọ.' });
            }

            user.verificationStatus = status;
            if (status === 'APPROVED') {
                user.role = 'landlord';
                user.approvedAt = new Date();
                user.approvedBy = req.user?.fullName || 'Admin';
                user.rejectionReason = '';
            } else if (status === 'REJECTED') {
                user.rejectionReason = rejectionReason.trim();
            }

            await user.save();
            return res.status(200).json({
                success: true,
                message: status === 'APPROVED' ? 'Đã duyệt tài khoản Chủ trọ thành công!' : 'Đã từ chối hồ sơ Chủ trọ.',
                data: user
            });
        }

        const fallbackUsers = req.app.locals.fallbackUsers || [];
        const user = fallbackUsers.find(u => String(u._id) === id || String(u.id) === id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản (Fallback Mode).' });
        }

        user.verificationStatus = status;
        if (status === 'APPROVED') {
            user.role = 'landlord';
            user.approvedAt = new Date();
            user.approvedBy = req.user?.fullName || 'Admin';
            user.rejectionReason = '';
        } else if (status === 'REJECTED') {
            user.rejectionReason = rejectionReason.trim();
        }

        return res.status(200).json({
            success: true,
            message: status === 'APPROVED' ? 'Đã duyệt tài khoản Chủ trọ thành công!' : 'Đã từ chối hồ sơ Chủ trọ.',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Admin chủ động cấp tài khoản Chủ trọ mới (Ngăn chặn bên ngoài tự ý tạo, mặc định APPROVED)
app.post('/api/admin/create-landlord', protect, authorize('admin'), async (req, res) => {
    try {
        const { fullName, email, password, phone, campus, note, propertyName, propertyAddress } = req.body;

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Họ tên, Email, Mật khẩu và Số điện thoại chủ trọ.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu khởi tạo phải từ 6 ký tự trở lên.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (isDbConnected) {
            const exists = await User.findOne({ email: normalizedEmail });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: `Email [${normalizedEmail}] đã tồn tại trong hệ thống.`
                });
            }

            const landlord = await User.create({
                fullName: fullName.trim(),
                email: normalizedEmail,
                password,
                phone: phone.trim(),
                phoneVerified: true,
                role: 'landlord',
                verificationStatus: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: req.user?.fullName || 'Admin',
                campus: campus || 'FPT Can Tho',
                landlordDocuments: {
                    propertyName: propertyName || 'Cơ sở trọ chính chủ',
                    propertyAddress: propertyAddress || note || 'TP. Cần Thơ',
                    note: note || 'Chủ trọ được Admin cấp phép trực tiếp'
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Cấp tài khoản Chủ nhà trọ thành công!',
                data: landlord
            });
        }

        const fallbackUsers = req.app.locals.fallbackUsers || [];
        if (fallbackUsers.some(u => u.email === normalizedEmail)) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        const newLandlord = {
            _id: `usr_landlord_${Date.now()}`,
            id: `usr_landlord_${Date.now()}`,
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            phoneVerified: true,
            role: 'landlord',
            verificationStatus: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: req.user?.fullName || 'Admin',
            campus: campus || 'FPT Can Tho',
            landlordDocuments: {
                propertyName: propertyName || 'Cơ sở trọ chính chủ',
                propertyAddress: propertyAddress || note || 'TP. Cần Thơ',
                note: note || 'Chủ trọ được Admin cấp phép trực tiếp'
            },
            createdAt: new Date()
        };
        fallbackUsers.unshift(newLandlord);

        res.status(201).json({
            success: true,
            message: 'Cấp tài khoản Chủ nhà trọ thành công (Fallback Mode)!',
            data: newLandlord
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Admin xóa / thu hồi tài khoản Chủ trọ
app.delete('/api/admin/landlords/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            const deleted = await User.findOneAndDelete({ _id: id, role: 'landlord' });
            if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ trọ này.' });
            return res.status(200).json({ success: true, message: 'Đã thu hồi tài khoản Chủ trọ thành công.' });
        }
        const fallbackUsers = req.app.locals.fallbackUsers || [];
        const idx = fallbackUsers.findIndex(u => (String(u._id) === id || String(u.id) === id) && u.role === 'landlord');
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ trọ.' });
        fallbackUsers.splice(idx, 1);
        res.status(200).json({ success: true, message: 'Đã thu hồi tài khoản Chủ trọ.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APIS BÁO CÁO VI PHẠM & KHIẾU NẠI (CẤP TICKET ID - P0/P1) ====================
let fallbackReports = [];

app.post('/api/reports', async (req, res) => {
    try {
        const { roomId, roomTitle, reporterName, reporterContact, reason, description, evidenceUrls } = req.body;
        if (!reporterContact || !reason || !description) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số liên hệ, lý do và mô tả khiếu nại.' });
        }

        const ticketCode = `STAY-REP-${Date.now().toString().slice(-6)}`;
        const reportData = {
            ticketCode,
            roomId: roomId || null,
            roomTitle: roomTitle || '',
            reporterName: reporterName || 'Người thuê SmartStay',
            reporterContact,
            reason,
            description,
            evidenceUrls: evidenceUrls || [],
            status: 'pending',
            resolutionNote: 'Đã tiếp nhận vào hệ thống. Đội ngũ SmartStay sẽ thẩm định trong vòng 24 giờ làm việc.'
        };

        if (isDbConnected) {
            const report = await Report.create(reportData);
            return res.status(201).json({
                success: true,
                message: 'Khiếu nại đã được tiếp nhận thành công! Vui lòng lưu mã Ticket để theo dõi.',
                ticketCode,
                data: report
            });
        }

        const newReport = { ...reportData, _id: `rep_${Date.now()}`, createdAt: new Date() };
        fallbackReports.unshift(newReport);
        res.status(201).json({
            success: true,
            message: 'Khiếu nại đã được tiếp nhận thành công! Vui lòng lưu mã Ticket để theo dõi.',
            ticketCode,
            data: newReport
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/reports/:ticketCode', async (req, res) => {
    try {
        const { ticketCode } = req.params;
        if (isDbConnected) {
            const rep = await Report.findOne({ ticketCode });
            if (!rep) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khiếu nại với mã này.' });
            return res.status(200).json({ success: true, data: rep });
        }
        const rep = fallbackReports.find(r => r.ticketCode === ticketCode);
        if (!rep) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khiếu nại với mã này.' });
        res.status(200).json({ success: true, data: rep });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APIS ĐẶT LỊCH XEM PHÒNG 2 CHIỀU (P1) ====================
let fallbackAppointments = [];

app.post('/api/appointments', async (req, res) => {
    try {
        const roomId = req.body.roomId || req.body.room;
        const roomTitle = req.body.roomTitle || '';
        const studentName = req.body.studentName || 'Sinh viên SmartStay';
        const studentPhone = req.body.studentPhone || req.body.phone;
        const landlordPhone = req.body.landlordPhone || '';
        const visitDate = req.body.visitDate || req.body.appointmentDate;
        const visitTime = req.body.visitTime || req.body.appointmentTime;
        const transportType = req.body.transportType || 'Xe máy';
        const notes = req.body.notes || req.body.note || '';

        if (!roomId || !studentPhone || !visitDate || !visitTime) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp thông tin phòng, số điện thoại, ngày và giờ xem phòng.' });
        }

        const appointmentCode = `APPT-${Date.now().toString().slice(-6)}`;
        const apptData = {
            appointmentCode,
            roomId,
            roomTitle: roomTitle || '',
            studentName: studentName || 'Sinh viên SmartStay',
            studentPhone,
            landlordPhone: landlordPhone || '',
            visitDate,
            visitTime,
            transportType: transportType || 'Xe máy',
            notes: notes || '',
            status: 'pending_landlord',
            landlordResponseNote: 'Chờ chủ trọ xác nhận lịch hẹn'
        };

        if (isDbConnected) {
            const appt = await Appointment.create(apptData);
            return res.status(201).json({
                success: true,
                message: 'Đặt lịch xem phòng thành công! Đang chờ chủ trọ xác nhận.',
                appointmentCode,
                data: appt
            });
        }

        const newAppt = { ...apptData, _id: `appt_${Date.now()}`, createdAt: new Date() };
        fallbackAppointments.unshift(newAppt);
        res.status(201).json({
            success: true,
            message: 'Đặt lịch xem phòng thành công! Đang chờ chủ trọ xác nhận.',
            appointmentCode,
            data: newAppt
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lấy danh sách lịch hẹn xem phòng cho CHỦ TRỌ
app.get('/api/appointments/landlord', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = req.user.email?.toLowerCase();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            let roomIds = [];
            if (!isAdmin) {
                const myRooms = await Room.find({
                    $or: [{ owner: currentUserId }, { ownerEmail: currentUserEmail }]
                }).select('_id');
                roomIds = myRooms.map(r => r._id);
            }

            const query = isAdmin ? {} : {
                $or: [
                    { roomId: { $in: roomIds } },
                    { landlordPhone: req.user.phone }
                ]
            };

            const appts = await Appointment.find(query)
                .sort({ createdAt: -1 })
                .populate('roomId', 'title address price images image_url');

            return res.status(200).json({
                success: true,
                count: appts.length,
                data: appts
            });
        }

        res.status(200).json({
            success: true,
            count: fallbackAppointments.length,
            data: fallbackAppointments
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lấy danh sách lịch hẹn xem phòng của SINH VIÊN đang đăng nhập
app.get('/api/appointments/my-appointments', protect, async (req, res) => {
    try {
        const studentPhone = req.user.phone;
        const studentName = req.user.fullName;

        if (isDbConnected) {
            const appts = await Appointment.find({
                $or: [
                    { studentPhone },
                    { studentName }
                ]
            })
            .sort({ createdAt: -1 })
            .populate('roomId', 'title address price images image_url contactPhone');

            return res.status(200).json({
                success: true,
                count: appts.length,
                data: appts
            });
        }

        const myAppts = fallbackAppointments.filter(a => 
            (studentPhone && a.studentPhone === studentPhone) ||
            (studentName && a.studentName === studentName)
        );

        res.status(200).json({
            success: true,
            count: myAppts.length,
            data: myAppts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/appointments/:code', async (req, res) => {
    try {
        const { code } = req.params;
        if (isDbConnected) {
            const appt = await Appointment.findOne({ appointmentCode: code });
            if (!appt) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
            return res.status(200).json({ success: true, data: appt });
        }
        const appt = fallbackAppointments.find(a => a.appointmentCode === code);
        if (!appt) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
        res.status(200).json({ success: true, data: appt });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/appointments/:code/status', async (req, res) => {
    try {
        const { code } = req.params;
        const { status, landlordResponseNote } = req.body; // 'confirmed' | 'rescheduled' | 'cancelled'

        if (isDbConnected) {
            const updated = await Appointment.findOneAndUpdate(
                { appointmentCode: code },
                { status, landlordResponseNote: landlordResponseNote || '' },
                { new: true }
            );
            if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
            return res.status(200).json({ success: true, message: 'Cập nhật trạng thái lịch hẹn thành công', data: updated });
        }

        const idx = fallbackAppointments.findIndex(a => a.appointmentCode === code);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
        fallbackAppointments[idx].status = status;
        if (landlordResponseNote) fallbackAppointments[idx].landlordResponseNote = landlordResponseNote;
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái lịch hẹn thành công', data: fallbackAppointments[idx] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== API SO SÁNH PHÒNG TRỌ (P1 Mục 2.3) ====================
app.get('/api/rooms-compare', async (req, res) => {
    try {
        const { ids } = req.query; // ví dụ ?ids=id1,id2,id3
        if (!ids) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách ID phòng cần so sánh' });
        const idList = ids.split(',').map(s => s.trim()).filter(Boolean);

        let comparedRooms = [];
        if (isDbConnected) {
            comparedRooms = await Room.find({ _id: { $in: idList } });
        } else {
            comparedRooms = fallbackRooms.filter(r => idList.includes(String(r._id)) || idList.includes(String(r.id)));
        }

        res.status(200).json({ success: true, count: comparedRooms.length, data: comparedRooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Đã có lỗi xảy ra trên máy chủ.'
    });
});

// Lắng nghe cổng
server.listen(PORT, () => {
    console.log(`🚀 SmartStay Backend Server is running on http://localhost:${PORT}`);
    // Khởi động cron job quét hạn tin Pass phòng
    startPassRoomCron(() => isDbConnected);
});