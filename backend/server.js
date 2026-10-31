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
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const { protect, authorize, checkRoomOwnership } = require('./middleware/auth');
const { verifyAdminPinMiddleware, adminIpWhitelistMiddleware } = require('./utils/adminSecurity');
const { validateAppointmentMiddleware, appointmentRateLimiter } = require('./middleware/appointmentValidator');

const app = express();
const PORT = process.env.PORT || 5000;

// Tắt thông tin header X-Powered-By để tránh rò rỉ công nghệ server
app.disable('x-powered-by');

// Tin tưởng reverse proxy (Render / Cloudflare) để nhận diện chính xác giao thức HTTPS và Client IP
app.set('trust proxy', 1);

// Security Middlewares - Helmet bảo mật HTTP Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://api.dicebear.com"],
            connectSrc: ["'self'", "http://localhost:5173", "http://localhost:5000", "ws://localhost:5173", "ws://localhost:5000", "wss://localhost:5000", "https://accounts.google.com", "https://smart-stay-swart.vercel.app", "https://*.onrender.com", "wss://*.onrender.com", "https://*.vercel.app"],
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
    // Đảm bảo mọi kết nối (kể cả WebSocket qua Render proxy) luôn nhận header HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
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
        if (
            allowedCorsOrigins.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            origin.endsWith('.onrender.com') ||
            origin.startsWith('http://localhost:')
        ) {
            return callback(null, true);
        }
        return callback(new Error('CORS Policy: Nguồn truy cập này không được phép liên kết dữ liệu với SmartStay API.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'x-admin-pin', 
        'Origin', 
        'Cache-Control', 
        'Pragma'
    ],
    exposedHeaders: ['Authorization', 'x-admin-pin']
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
        safe_badge: false,
        isSafeBadge: false,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '10.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: true,
        ownerEmail: 'chutro@smartstay.vn',
        verificationStatus: 'unverified',
        approvalStatus: 'approved',
        listingType: 'standard',
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
        ownerEmail: 'chutro@smartstay.vn',
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
        safe_badge: false,
        isSafeBadge: false,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '15.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: true,
        ownerEmail: 'chutro@smartstay.vn',
        verificationStatus: 'unverified',
        approvalStatus: 'approved',
        listingType: 'standard',
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
        ownerEmail: 'chutro@smartstay.vn',
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
        safe_badge: false,
        isSafeBadge: false,
        is_boosted: true,
        has_pass: false,
        pass_months_left: 3,
        seeking_roommate: false,
        electricityCostType: 'kinh_doanh',
        waterCost: '10.000 khối',
        hasSeparateMeter: true,
        depositMonths: 1,
        extraFees: { wifi: 0, trash: 0, parking: 0 },
        isDemo: true,
        ownerEmail: 'chutro@smartstay.vn',
        verificationStatus: 'unverified',
        approvalStatus: 'approved',
        listingType: 'standard',
        fireSafetyCertified: true
    }
];

const syncSurveyedRoomsToDatabase = async () => {
    if (!isDbConnected) return;
    try {
        const chutroUser = await User.findOne({ email: 'chutro@smartstay.vn' });
        const chutroId = chutroUser ? chutroUser._id : null;

        for (const r of surveyedRoomsData) {
            const exists = await Room.findOne({ title: r.title, price: r.price });
            if (!exists) {
                await Room.create({ 
                    ...r, 
                    owner: chutroId,
                    ownerEmail: 'chutro@smartstay.vn',
                    approvalStatus: 'approved', 
                    safe_badge: false, 
                    isSafeBadge: false, 
                    verificationStatus: 'unverified' 
                });
                console.log(`✅ Đã tự động đồng bộ phòng vào MongoDB Atlas: ${r.title} (${r.price})`);
            } else if (!exists.ownerEmail || exists.ownerEmail === '') {
                exists.ownerEmail = 'chutro@smartstay.vn';
                if (chutroId && !exists.owner) exists.owner = chutroId;
                await exists.save();
            }
        }
        // Gán tài khoản demo chutro@smartstay.vn và đánh dấu isDemo: true cho toàn bộ phòng mẫu
        const SAMPLE_ROOM_TITLES = [
            'Phòng trọ cao cấp gần ĐH FPT Cần Thơ (Gác lửng, full nội thất)', 
            'Phòng trọ sinh viên giá rẻ gần ĐH Cần Thơ - Khu 2', 
            'SmartStay Pass: Sang nhượng phòng ban công view thoáng (còn cọc 2 tháng)', 
            'Homestay sinh viên full tiện ích gần ĐH Y Dược Cần Thơ', 
            'Phòng Trọ Thanh Sơn', 
            'Phòng Trọ Lê khải',
            'Phòng Trọ Lê Khải'
        ];
        await Room.updateMany(
            { title: { $in: SAMPLE_ROOM_TITLES } },
            { $set: { isDemo: true, ownerEmail: 'chutro@smartstay.vn', ...(chutroId ? { owner: chutroId } : {}) } }
        );
        // Gỡ bỏ hoàn toàn huy hiệu xác minh thực địa của tất cả phòng cũ
        await Room.updateMany(
            { $or: [{ safe_badge: true }, { isSafeBadge: true }, { verificationStatus: 'verified' }] },
            { $set: { safe_badge: false, isSafeBadge: false, verificationStatus: 'unverified' } }
        );
        // Đảm bảo tất cả phòng có sẵn (không phải phòng mới tạo chờ duyệt) đều có approvalStatus: 'approved'
        await Room.updateMany(
            { approvalStatus: { $exists: false } },
            { $set: { approvalStatus: 'approved' } }
        );
    } catch (err) {
        console.warn('⚠️ Lỗi đồng bộ phòng:', err.message);
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
const stayRoutes = require('./routes/stayRoutes');
const landlordStayRoutes = require('./routes/landlordStayRoutes');
const stayConfirmTokenRoutes = require('./routes/stayConfirmTokenRoutes');
const { startStayCron } = require('./utils/stayCron');
const { canUserReview } = require('./services/stayReviewService');
const Stay = require('./models/Stay');

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

// Mount Stay & Checkin Verification Routes
app.use('/api/stays', stayRoutes);
app.use('/api/landlord/stays', landlordStayRoutes);
app.use('/api/stay-confirmation', stayConfirmTokenRoutes);



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
        const { campus, maxPrice, electricityCostType, seekingRoommate, amenities, type, all, includeDemo } = req.query;

        if (isDbConnected) {
            let query = {};
            // CHỈ hiển thị các phòng ĐÃ ĐƯỢC ADMIN DUYỆT (approved) cho khách thuê
            // Tuyệt đối không hiển thị tin đăng đang 'pending' (chờ duyệt) hoặc 'rejected' (từ chối)
            if (all !== 'true') {
                query.approvalStatus = { $nin: ['pending', 'rejected'] };
            }

            // Dữ liệu mẫu (demo) chỉ hiển thị trên các tài khoản demo đã được cấp, không hiển thị trên trang tìm kiếm công khai
            if (includeDemo !== 'true') {
                query.isDemo = { $ne: true };
            }

            if (campus && campus !== 'Tất cả khu vực') query.campus = new RegExp(escapeRegex(campus), 'i');
            if (maxPrice) query.price = { $lte: Number(maxPrice) };
            if (electricityCostType) query.electricityCostType = electricityCostType;
            if (seekingRoommate !== undefined) query.seeking_roommate = seekingRoommate === 'true';
            if (type) query.listingType = type;

            const rooms = await Room.find(query).sort({ is_boosted: -1, createdAt: -1 });
            return res.status(200).json({ success: true, count: rooms.length, isFallbackMode: false, data: rooms });
        }

        // Chế độ dự phòng khi DB chưa kết nối
        let list = [...fallbackRooms];
        if (all !== 'true') {
            list = list.filter((r) => r.approvalStatus !== 'pending' && r.approvalStatus !== 'rejected');
        }
        if (includeDemo !== 'true') {
            list = list.filter((r) => !r.isDemo && !['Phòng Trọ Thanh Sơn', 'Phòng Trọ Lê khải', 'Phòng Trọ Lê Khải', 'Homestay sinh viên full tiện ích gần ĐH Y Dược Cần Thơ', 'SmartStay Pass: Sang nhượng phòng ban công view thoáng (còn cọc 2 tháng)', 'Phòng trọ cao cấp gần ĐH FPT Cần Thơ (Gác lửng, full nội thất)', 'Phòng trọ sinh viên giá rẻ gần ĐH Cần Thơ - Khu 2'].includes(r.title));
        }
        if (campus && campus !== 'Tất cả khu vực') {
            list = list.filter((r) => r.campus.toLowerCase().includes(campus.toLowerCase()));
        }
        if (maxPrice) {
            list = list.filter((r) => r.price <= Number(maxPrice));
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
        const userPhone = req.user.phone ? String(req.user.phone).trim() : null;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            const orConditions = [];
            if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
                orConditions.push({ owner: currentUserId });
            }
            if (currentUserEmail) {
                orConditions.push({ ownerEmail: { $regex: new RegExp(`^${currentUserEmail}$`, 'i') } });
            }
            if (userPhone && currentUserEmail === 'chutro@smartstay.vn') {
                orConditions.push({ contactPhone: userPhone });
            }

            const query = isAdmin ? {} : (orConditions.length > 0 ? { $or: orConditions } : { ownerEmail: '__none__' });

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
            (r.ownerEmail && r.ownerEmail.toLowerCase() === currentUserEmail) ||
            (currentUserEmail === 'chutro@smartstay.vn' && userPhone && r.contactPhone && String(r.contactPhone).trim() === userPhone)
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

        const userPhone = (req.user.phone && String(req.user.phone).trim()) ? String(req.user.phone).trim() : null;

        if (isDbConnected) {
            const roomConditions = [];
            if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
                roomConditions.push({ owner: currentUserId });
            }
            if (currentUserEmail) {
                roomConditions.push({ ownerEmail: { $regex: new RegExp(`^${currentUserEmail}$`, 'i') } });
            }
            if (userPhone) {
                roomConditions.push({ contactPhone: userPhone });
            }
            const roomQuery = isAdmin ? {} : (roomConditions.length > 0 ? { $or: roomConditions } : { ownerEmail: '__none__' });
            myRooms = await Room.find(roomQuery);

            const contractQuery = isAdmin ? {} : {
                $or: [{ landlord: currentUserId }, ...(currentUserEmail ? [{ landlordEmail: currentUserEmail }] : [])]
            };
            const Contract = mongoose.model('Contract');
            myContracts = await Contract.find(contractQuery);

            const roomIds = myRooms.map(r => r._id);
            const apptConditions = [];
            if (roomIds.length > 0) {
                apptConditions.push({ roomId: { $in: roomIds }, status: 'pending_landlord' });
            }
            if (userPhone) {
                apptConditions.push({ landlordPhone: userPhone, status: 'pending_landlord' });
            }
            if (isAdmin) {
                pendingAppointmentsCount = await Appointment.countDocuments({ status: 'pending_landlord' });
            } else if (apptConditions.length > 0) {
                pendingAppointmentsCount = await Appointment.countDocuments({ $or: apptConditions });
            } else {
                pendingAppointmentsCount = 0;
            }
        } else {
            myRooms = isAdmin 
                ? fallbackRooms 
                : fallbackRooms.filter(r => 
                    isSameId(r.owner, currentUserId) || 
                    (r.ownerEmail && r.ownerEmail.toLowerCase() === currentUserEmail)
                );
            const myRoomIds = new Set(myRooms.map(r => String(r._id || r.id)));
            pendingAppointmentsCount = isAdmin 
                ? fallbackAppointments.filter(a => a.status === 'pending_landlord').length
                : fallbackAppointments.filter(a => {
                    if (a.status !== 'pending_landlord') return false;
                    const aRoomId = a.roomId?._id || a.roomId?.id || a.roomId;
                    const matchRoom = aRoomId && myRoomIds.has(String(aRoomId));
                    const matchPhone = userPhone && a.landlordPhone && String(a.landlordPhone).trim() === userPhone;
                    return matchRoom || matchPhone;
                }).length;
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
app.patch('/api/rooms/:id/availability', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'available' | 'rented' | 'repairing'

        if (!['available', 'rented', 'repairing'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái phòng không hợp lệ.' });
        }

        let targetRoom = null;
        if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
            targetRoom = await Room.findById(id);
        } else {
            targetRoom = fallbackRooms.find(r => isSameId(r._id, id) || isSameId(r.id, id));
        }

        if (!targetRoom) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });
        }

        if (!checkRoomOwnership(targetRoom, req.user)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật trạng thái phòng này.' });
        }

        if (isDbConnected) {
            const room = await Room.findByIdAndUpdate(
                id,
                { status, lastAvailabilityConfirmedAt: new Date() },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                message: `Đã cập nhật tình trạng phòng: ${status === 'available' ? 'Còn phòng' : (status === 'rented' ? 'Đã cho thuê' : 'Đang sửa chữa')}`,
                data: room
            });
        }

        targetRoom.status = status;
        targetRoom.lastAvailabilityConfirmedAt = new Date();
        saveFallbackRooms(fallbackRooms);

        res.status(200).json({ success: true, message: 'Đã cập nhật tình trạng phòng (Fallback).', data: targetRoom });
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

        if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
            const room = await Room.findById(id);
            if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });

            const roomObj = room.toObject ? room.toObject() : { ...room };

            // Tìm tất cả các phòng cùng thuộc cơ sở / khu trọ này để đồng bộ thông tin số lượng phòng trống
            let siblingRooms = [];
            const propName = (roomObj.property_name && roomObj.property_name.trim()) || '';
            const addr = (roomObj.address && roomObj.address.trim()) || '';

            if (propName) {
                const query = {
                    property_name: propName,
                    approvalStatus: { $nin: ['pending', 'rejected'] }
                };
                if (roomObj.ownerEmail) {
                    query.ownerEmail = roomObj.ownerEmail;
                } else if (roomObj.owner) {
                    query.owner = roomObj.owner;
                }
                siblingRooms = await Room.find(query);
            } else if (addr) {
                const query = {
                    address: addr,
                    approvalStatus: { $nin: ['pending', 'rejected'] }
                };
                if (roomObj.ownerEmail) {
                    query.ownerEmail = roomObj.ownerEmail;
                } else if (roomObj.owner) {
                    query.owner = roomObj.owner;
                }
                siblingRooms = await Room.find(query);
            }

            if (siblingRooms.length > 1) {
                // Sắp xếp tự nhiên theo số phòng (P.101, P.102, ... P.110)
                siblingRooms.sort((a, b) => {
                    const numA = (a.room_number || a.title || '').replace(/\D+/g, '');
                    const numB = (b.room_number || b.title || '').replace(/\D+/g, '');
                    if (numA && numB && Number(numA) !== Number(numB)) {
                        return Number(numA) - Number(numB);
                    }
                    return (a.room_number || a.title || '').localeCompare(b.room_number || b.title || '');
                });

                const availCount = siblingRooms.filter(r => r.status === 'available' || r.status === 'Trống' || !r.status).length;
                roomObj.available_rooms = availCount;
                roomObj.total_rooms = siblingRooms.length;

                // Đồng bộ danh sách phòng con chi tiết
                roomObj.rooms_list = siblingRooms.map(r => {
                    const rNum = (r.room_number && r.room_number.trim()) 
                        ? r.room_number.trim() 
                        : ((r.title && r.title.trim() !== propName) ? r.title.trim() : 'P.100');
                    return {
                        _id: r._id,
                        id: r._id,
                        room_number: rNum,
                        price: r.price,
                        area_sqm: r.area_sqm || r.area || 20,
                        floor: r.floor || 1,
                        status: (r.status === 'rented' || r.status === 'Đang thuê') ? 'rented' : ((r.status === 'repairing' || r.status === 'Đang sửa') ? 'repairing' : 'available'),
                        amenities: r.amenities || []
                    };
                });

                const prices = siblingRooms.map(r => r.price).filter(p => typeof p === 'number' && p > 0);
                if (prices.length > 0) {
                    roomObj.price_min = Math.min(...prices);
                    roomObj.price_max = Math.max(...prices);
                }
            } else if (roomObj.rooms_list && roomObj.rooms_list.length > 0) {
                roomObj.total_rooms = roomObj.rooms_list.length;
                roomObj.available_rooms = roomObj.rooms_list.filter(r => r.status === 'available' || r.status === 'Trống').length;
            } else {
                const isAvail = roomObj.status === 'available' || roomObj.status === 'Trống' || !roomObj.status;
                roomObj.available_rooms = isAvail ? (roomObj.available_rooms || 1) : 0;
                roomObj.total_rooms = roomObj.total_rooms || 1;
            }

            return res.status(200).json({ success: true, data: roomObj });
        }

        const room = fallbackRooms.find((r) => String(r._id) === id || String(r.id) === id);
        if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        
        const roomObj = { ...room };
        if (roomObj.rooms_list && roomObj.rooms_list.length > 0) {
            roomObj.total_rooms = roomObj.rooms_list.length;
            roomObj.available_rooms = roomObj.rooms_list.filter(r => r.status === 'available' || r.status === 'Trống').length;
        }
        res.status(200).json({ success: true, data: roomObj });
    } catch (error) {
        res.status(400).json({ success: false, error: 'ID phòng không hợp lệ' });
    }
});

// 6. Đăng tin phòng trọ mới (Bắt buộc đăng nhập - protect)
app.post('/api/rooms', protect, async (req, res) => {
    try {
        const data = { ...req.body };
        // QUAN TRỌNG: Loại bỏ _id và id giả lập của client để MongoDB tự sinh ObjectId hợp lệ
        delete data._id;
        delete data.id;

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

        // Trạng thái kiểm duyệt bài đăng (Admin approval)
        // - Chủ trọ đăng bài lần đầu hoặc thêm vị trí trọ mới: Cần Admin duyệt (approvalStatus = 'pending')
        // - Mở rộng phòng con trong khu trọ đã duyệt: Tự động approved, không cần admin duyệt lại
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'employee';
        let isApproved = isAdmin;

        const propName = (data.property_name || '').trim();
        const isSubRoomExpansion = Boolean(data.room_number || req.body.isSubRoom);

        if (!isApproved && isSubRoomExpansion && propName) {
            if (isDbConnected) {
                const existingApproved = await Room.findOne({
                    $or: [{ property_name: propName }, { title: propName }],
                    approvalStatus: 'approved'
                });
                if (existingApproved) isApproved = true;
            } else {
                const existingApproved = fallbackRooms.find(r =>
                    ((r.property_name && r.property_name.trim() === propName) || (r.title && r.title.trim() === propName)) &&
                    r.approvalStatus === 'approved'
                );
                if (existingApproved) isApproved = true;
            }
        }

        data.approvalStatus = isApproved ? 'approved' : (data.approvalStatus || 'pending');
        data.approvedAt = isApproved ? new Date() : null;
        data.approvedBy = isApproved ? (isAdmin ? (req.user?.fullName || 'Admin') : 'Hệ thống (Kế thừa vị trí đã duyệt)') : '';
        data.rejectionReason = '';

        // Bỏ hoàn toàn việc tự gán huy hiệu xác minh thực địa cho tin mới
        data.safe_badge = false;
        data.isSafeBadge = false;
        data.verificationStatus = 'unverified';
        data.isDemo = req.body.isDemo !== undefined ? req.body.isDemo : false;
        data.isSurveyed = false;

        const validUserId = req.user?._id || req.user?.id;
        if (validUserId && mongoose.Types.ObjectId.isValid(validUserId)) {
            data.owner = validUserId;
        } else {
            delete data.owner;
        }
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
        console.error('Lỗi POST /api/rooms:', error);
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
            ownerEmail: req.user?.email || '',
            lastAvailabilityConfirmedAt: new Date()
        };
        delete passData._id;
        delete passData.id;

        const validUserId = req.user?._id || req.user?.id;
        if (validUserId && mongoose.Types.ObjectId.isValid(validUserId)) {
            passData.owner = validUserId;
        } else {
            delete passData.owner;
        }

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

// ==================== APIS REVIEWS (XÁC MINH NGƯỜI THUÊ THẬT) ====================

// Handler dùng chung cho tạo đánh giá xác minh (Bắt buộc đã ở thật & qua kiểm tra canUserReview)
async function handleCreateVerifiedReview(req, res) {
    try {
        const roomId = req.params.id || req.body.room || req.body.roomId;
        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã phòng trọ.' });
        }

        const userId = req.user._id || req.user.id;

        // BẮT BUỘC KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ TỪ SERVER
        const eligibility = await canUserReview(userId, roomId);
        if (!eligibility.eligible) {
            return res.status(403).json({
                success: false,
                code: eligibility.code,
                message: eligibility.message,
                details: eligibility
            });
        }

        const rawComment = (req.body.comment || req.body.content || '').trim();
        if (!rawComment || rawComment.length < 5) {
            return res.status(400).json({ success: false, message: 'Nhận xét phải có ít nhất 5 ký tự.' });
        }
        const comment = rawComment.slice(0, 2000);

        const rating = Math.min(5, Math.max(1, Math.round(Number(req.body.rating) || 5)));

        // Lấy thông tin phòng để đối chiếu giá niêm yết
        const room = await Room.findById(roomId);
        const listedPrice = Number(room?.price) || 0;
        const actualCost = Number(req.body.actualMonthlyCost) || listedPrice;

        // Server tự động tính độ chuẩn xác chi phí so với niêm yết (không tin client)
        // Chi phí thực tế dao động từ 75% đến 125% giá phòng niêm yết được coi là chuẩn xác (đã gồm điện nước)
        const matchesListedPrice = listedPrice > 0
            ? (actualCost >= listedPrice * 0.75 && actualCost <= listedPrice * 1.25)
            : true;

        const studentName = req.user.fullName || req.user.name || 'Người thuê SmartStay';
        const stayDuration = eligibility.stayDurationMonths || 1;

        const reviewData = {
            room: roomId,
            user: userId,
            stayId: eligibility.stayId,
            rating,
            comment,
            content: comment,
            actualMonthlyCost: actualCost,
            isCostAccurate: matchesListedPrice,
            matchesListedPrice: matchesListedPrice,
            verified: true,
            has_stayed: true,
            verificationStatus: 'verified',
            stayDurationSnapshot: stayDuration,
            stayed_period: `Đã ở ${stayDuration} tháng`,
            trust_score: 98,
            studentEmail: req.user.email || '',
            studentName: studentName,
            anonymous_name: req.body.isAnonymous ? 'Người thuê ẩn danh' : studentName,
            isDemo: false
        };

        let newReview;
        if (isDbConnected) {
            newReview = await Review.create(reviewData);

            // Gửi thông báo cho chủ trọ
            if (room && room.owner) {
                await createNotification({
                    userId: room.owner,
                    title: '⭐ Đánh giá mới từ người thuê thật',
                    message: `${reviewData.anonymous_name} đã gửi đánh giá (${rating}⭐) cho phòng "${room.title}".`,
                    type: 'new_review',
                    referenceId: newReview._id,
                    link: `/phong/${roomId}`
                });
            }
        } else {
            newReview = {
                _id: `rev_${Date.now()}`,
                id: `rev_${Date.now()}`,
                ...reviewData,
                createdAt: new Date()
            };
            fallbackReviews.unshift(newReview);
        }

        return res.status(201).json({
            success: true,
            message: 'Đánh giá đã được ghi nhận với nhãn Xác minh Đã ở thật!',
            data: newReview
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                code: 'ALREADY_REVIEWED',
                message: 'Bạn đã gửi đánh giá cho đợt lưu trú này rồi.'
            });
        }
        res.status(400).json({ success: false, error: error.message });
    }
}

// 1. Kiểm tra điều kiện đánh giá của người dùng với phòng (GET /api/rooms/:id/review-eligibility)
app.get('/api/rooms/:id/review-eligibility', protect, async (req, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.user._id || req.user.id;
        const result = await canUserReview(userId, roomId);
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Gửi đánh giá cho phòng trọ (Hỗ trợ cả POST /api/rooms/:id/reviews và POST /api/reviews)
app.post('/api/rooms/:id/reviews', protect, handleCreateVerifiedReview);
app.post('/api/reviews', protect, handleCreateVerifiedReview);

// 3. Lấy danh sách đánh giá của phòng (Tính điểm trung bình & tỷ lệ chuẩn xác CHỈ TỪ review verified)
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
        const verifiedReviews = reviews.filter((r) => r.verified === true);
        const totalVerifiedReviews = verifiedReviews.length;

        let avgRating = 0;
        let accurateCostCount = 0;

        if (totalVerifiedReviews > 0) {
            const totalScore = verifiedReviews.reduce((sum, item) => sum + item.rating, 0);
            avgRating = Number((totalScore / totalVerifiedReviews).toFixed(1));
            accurateCostCount = verifiedReviews.filter((r) => r.isCostAccurate || r.matchesListedPrice).length;
        }

        res.status(200).json({
            success: true,
            roomId,
            stats: {
                totalReviews,
                totalVerifiedReviews,
                avgRating,
                costAccuracyRate: totalVerifiedReviews > 0
                    ? `${Math.round((accurateCostCount / totalVerifiedReviews) * 100)}%`
                    : 'Chưa có đánh giá xác thực'
            },
            data: reviews
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== ADMIN STAY & REVIEW MANAGEMENT ====================
// Xem danh sách Stay (có lọc theo status)
app.get('/api/admin/stays', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const stays = await Stay.find(filter)
            .populate('tenantId', 'fullName email phone avatar campus')
            .populate('roomId', 'title address price campus')
            .populate('landlordId', 'fullName email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: stays.length, data: stays });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cập nhật trạng thái Stay tranh chấp / giải quyết
app.put('/api/admin/stays/:id/resolve', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, disputeReason } = req.body;
        const stay = await Stay.findById(id);
        if (!stay) return res.status(404).json({ success: false, message: 'Không tìm thấy Stay' });

        if (status) stay.status = status;
        if (disputeReason !== undefined) stay.disputeReason = disputeReason;
        await stay.save();

        res.json({ success: true, message: 'Đã cập nhật trạng thái lưu trú', data: stay });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Thu hồi huy hiệu Đã ở thật của Review vi phạm
app.patch('/api/admin/reviews/:id/revoke-badge', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        review.verified = false;
        review.has_stayed = false;
        review.verificationStatus = 'unverified';
        review.trust_score = 40;
        await review.save();

        res.json({ success: true, message: 'Đã thu hồi huy hiệu Đã ở thật của đánh giá', data: review });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Gỡ bỏ review vi phạm
app.delete('/api/admin/reviews/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        res.json({ success: true, message: 'Đã xóa đánh giá thành công' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ==================== APIS ROOMMATE MATCHER ====================
// 1. Lưu hồ sơ khảo sát (Hỗ trợ liên kết tài khoản nếu có đăng nhập)
app.post('/api/surveys', async (req, res) => {
    try {
        const surveyData = {
            ...req.body,
            allowCrossGender: false,
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
            // Không ghép với những người chọn ẩn hồ sơ (isPrivate = true) hoặc hồ sơ mẫu (isDemo = true)
            otherSurveys = await RoommateSurvey.find({ _id: { $ne: mySurvey._id }, isPrivate: { $ne: true }, isDemo: { $ne: true } });
        } else {
            mySurvey = fallbackSurveys.find((s) => String(s._id) === id || String(s.id) === id);
            if (!mySurvey) {
                mySurvey = fallbackSurveys[0];
            }
            otherSurveys = fallbackSurveys.filter((s) => String(s._id) !== String(mySurvey?._id) && !s.isPrivate && !s.isDemo);
        }

        const myGenderNorm = normalizeGender(mySurvey.gender);
        const myAllowCross = Boolean(mySurvey.allowCrossGender);

        // Lọc cứng: CHỈ ghép người cùng giới tính (nam ghép nam, nữ ghép nữ)
        const eligibleCandidates = otherSurveys.filter((candidate) => {
            const cGenderNorm = normalizeGender(candidate.gender);
            return cGenderNorm && myGenderNorm === cGenderNorm;
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
            surveys = await RoommateSurvey.find({ isPrivate: { $ne: true }, isDemo: { $ne: true } }).sort({ createdAt: -1 });
        } else {
            surveys = fallbackSurveys.filter((s) => !s.isPrivate && !s.isDemo);
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
        // Nếu xác định được giới tính người xem: CHỈ hiển thị người cùng giới tính
        if (vGenderNorm) {
            safeSurveys = safeSurveys.filter((candidate) => {
                const cGenderNorm = normalizeGender(candidate.gender);
                return cGenderNorm && vGenderNorm === cGenderNorm;
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
app.post('/api/config', protect, authorize('admin'), adminIpWhitelistMiddleware, verifyAdminPinMiddleware, (req, res) => {
    systemConfig = { ...systemConfig, ...req.body };
    res.status(200).json({ success: true, message: 'Lưu cấu hình hệ thống thành công!', data: systemConfig });
});

// ==================== APIS QUẢN LÝ & CẤP TÀI KHOẢN CHỦ TRỌ (ADMIN DÀNH RIÊNG) ====================
// 1. Lấy danh sách tài khoản Chủ trọ (hỗ trợ lọc theo trạng thái duyệt PENDING, APPROVED, REJECTED)
app.get('/api/admin/landlords', protect, authorize('admin'), adminIpWhitelistMiddleware, async (req, res) => {
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
app.put('/api/admin/landlords/:id/status', protect, authorize('admin'), adminIpWhitelistMiddleware, verifyAdminPinMiddleware, async (req, res) => {
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
app.post('/api/admin/create-landlord', protect, authorize('admin'), adminIpWhitelistMiddleware, verifyAdminPinMiddleware, async (req, res) => {
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
app.delete('/api/admin/landlords/:id', protect, authorize('admin'), adminIpWhitelistMiddleware, verifyAdminPinMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            const deleted = await User.findOneAndDelete({ _id: id });
            if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ trọ này.' });
            return res.status(200).json({ success: true, message: 'Đã xóa / thu hồi tài khoản Chủ trọ thành công.' });
        }
        const fallbackUsers = req.app.locals.fallbackUsers || [];
        const idx = fallbackUsers.findIndex(u => String(u._id) === id || String(u.id) === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản chủ trọ.' });
        fallbackUsers.splice(idx, 1);
        res.status(200).json({ success: true, message: 'Đã thu hồi tài khoản Chủ trọ.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Admin lấy danh sách toàn bộ phòng trọ (hỗ trợ lọc theo trạng thái duyệt: pending, approved, rejected)
app.get('/api/admin/rooms', protect, authorize('admin', 'employee'), async (req, res) => {
    try {
        const { status, q } = req.query;
        let filter = {};
        if (status && status !== 'ALL') {
            filter.approvalStatus = status;
        }
        if (q && q.trim()) {
            const escaped = escapeRegex(q.trim());
            filter.$or = [
                { title: new RegExp(escaped, 'i') },
                { property_name: new RegExp(escaped, 'i') },
                { address: new RegExp(escaped, 'i') },
                { campus: new RegExp(escaped, 'i') }
            ];
        }

        if (isDbConnected) {
            const rooms = await Room.find(filter).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, count: rooms.length, data: rooms });
        }

        let list = [...fallbackRooms];
        if (status && status !== 'ALL') {
            list = list.filter(r => (r.approvalStatus || 'approved') === status);
        }
        if (q && q.trim()) {
            const lower = q.trim().toLowerCase();
            list = list.filter(r => 
                (r.title && r.title.toLowerCase().includes(lower)) ||
                (r.property_name && r.property_name.toLowerCase().includes(lower)) ||
                (r.address && r.address.toLowerCase().includes(lower))
            );
        }
        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Admin duyệt hoặc từ chối tin đăng phòng trọ của Chủ trọ (approved / rejected / pending)
app.put('/api/admin/rooms/:id/approval', protect, authorize('admin', 'employee'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason = '' } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái kiểm duyệt không hợp lệ (approved / rejected / pending).' });
        }

        if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
            const room = await Room.findById(id);
            if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });

            room.approvalStatus = status;
            if (status === 'approved') {
                room.approvedAt = new Date();
                room.approvedBy = req.user?.fullName || 'Admin';
                room.rejectionReason = '';
            } else if (status === 'rejected') {
                room.rejectionReason = rejectionReason.trim() || 'Tin đăng chưa đạt tiêu chuẩn quy định của hệ thống';
            } else {
                room.rejectionReason = '';
            }
            await room.save();

            // Đồng bộ trạng thái kiểm duyệt cho toàn bộ các phòng thuộc vị trí / cơ sở trọ này
            const propName = (room.property_name || room.title || '').trim();
            if (propName) {
                await Room.updateMany(
                    { $or: [{ property_name: propName }, { title: propName }] },
                    { $set: { 
                        approvalStatus: status, 
                        approvedAt: status === 'approved' ? new Date() : null,
                        approvedBy: status === 'approved' ? (req.user?.fullName || 'Admin') : '',
                        rejectionReason: status === 'rejected' ? (rejectionReason.trim() || 'Chưa đạt yêu cầu') : ''
                    } }
                );
            }

            return res.status(200).json({ 
                success: true, 
                message: `Đã ${status === 'approved' ? 'duyệt hiển thị' : (status === 'rejected' ? 'từ chối' : 'chuyển về chờ duyệt')} vị trí trọ và các phòng liên quan.`, 
                data: room 
            });
        }

        const idx = fallbackRooms.findIndex(r => String(r._id) === id || String(r.id) === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng trọ.' });

        fallbackRooms[idx].approvalStatus = status;
        if (status === 'approved') {
            fallbackRooms[idx].approvedAt = new Date();
            fallbackRooms[idx].approvedBy = req.user?.fullName || 'Admin';
            fallbackRooms[idx].rejectionReason = '';
        } else if (status === 'rejected') {
            fallbackRooms[idx].rejectionReason = rejectionReason.trim() || 'Chưa đạt yêu cầu';
        }
        const fallbackPropName = (fallbackRooms[idx].property_name || fallbackRooms[idx].title || '').trim();
        if (fallbackPropName) {
            fallbackRooms.forEach(r => {
                if ((r.property_name && r.property_name.trim() === fallbackPropName) || (r.title && r.title.trim() === fallbackPropName)) {
                    r.approvalStatus = status;
                    if (status === 'approved') {
                        r.approvedAt = new Date();
                        r.approvedBy = req.user?.fullName || 'Admin';
                        r.rejectionReason = '';
                    } else if (status === 'rejected') {
                        r.rejectionReason = rejectionReason.trim() || 'Chưa đạt yêu cầu';
                    }
                }
            });
        }
        saveFallbackRooms(fallbackRooms);
        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái duyệt vị trí thành công (Fallback)', data: fallbackRooms[idx] });
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

app.post('/api/appointments', appointmentRateLimiter, validateAppointmentMiddleware, async (req, res) => {
    try {
        const apptData = req.validatedAppointment;
        const { roomId, studentPhone, visitDate, visitTime } = apptData;

        // 1. Kiểm tra phòng có tồn tại không
        let targetRoom = null;
        if (isDbConnected && mongoose.Types.ObjectId.isValid(roomId)) {
            targetRoom = await Room.findById(roomId);
        } else {
            targetRoom = fallbackRooms.find(r => String(r._id) === roomId || String(r.id) === roomId);
        }

        if (!targetRoom && isDbConnected) {
            return res.status(404).json({
                success: false,
                message: 'Phòng trọ này không tồn tại hoặc đã ngừng nhận lịch hẹn.'
            });
        }

        if (targetRoom) {
            apptData.roomTitle = targetRoom.title || apptData.roomTitle;
            if (!apptData.landlordPhone && (targetRoom.contactPhone || targetRoom.ownerPhone)) {
                apptData.landlordPhone = targetRoom.contactPhone || targetRoom.ownerPhone;
            }
        }

        // 2. Chống spam / trùng lặp: Kiểm tra xem đã có lịch hẹn nào trùng giờ đang chờ xác nhận không
        if (isDbConnected) {
            const existingDuplicate = await Appointment.findOne({
                roomId,
                studentPhone,
                visitDate,
                visitTime,
                status: 'pending_landlord'
            });

            if (existingDuplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Bạn đã có một lịch hẹn đang chờ chủ trọ xác nhận cho phòng này vào khung giờ đã chọn. Vui lòng không gửi trùng lặp.'
                });
            }
        }

        const appointmentCode = `APPT-${Date.now().toString().slice(-6)}`;
        const record = {
            ...apptData,
            appointmentCode,
            status: 'pending_landlord',
            landlordResponseNote: 'Chờ chủ trọ xác nhận lịch hẹn'
        };

        let createdAppt;
        if (isDbConnected) {
            createdAppt = await Appointment.create(record);

            // Gửi thông báo cho chủ trọ nếu có
            const landlordId = targetRoom?.owner || null;
            if (landlordId) {
                try {
                    const { createNotification } = require('./utils/notify');
                    await createNotification({
                        userId: landlordId,
                        title: '📅 Có lịch hẹn xem phòng mới',
                        message: `Khách ${apptData.studentName} (${apptData.studentPhone}) vừa đặt lịch xem phòng "${apptData.roomTitle}" vào ngày ${apptData.visitDate} lúc ${apptData.visitTime}.`,
                        type: 'appointment_created',
                        referenceId: createdAppt._id,
                        link: '/chu-tro'
                    });
                } catch (notifErr) {
                    console.warn('Lỗi tạo notification:', notifErr.message);
                }
            }

            return res.status(201).json({
                success: true,
                message: 'Đặt lịch xem phòng thành công! Đang chờ chủ trọ xác nhận.',
                appointmentCode,
                data: createdAppt
            });
        }

        const newAppt = { ...record, _id: `appt_${Date.now()}`, createdAt: new Date() };
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

// Lấy danh sách lịch hẹn xem phòng cho ADMIN
app.get('/api/admin/appointments', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status && status !== 'all' ? { status } : {};

        if (isDbConnected) {
            const appts = await Appointment.find(filter)
                .sort({ createdAt: -1 })
                .populate('roomId', 'title address price images image_url');
            return res.status(200).json({
                success: true,
                count: appts.length,
                data: appts
            });
        }

        const filteredFallback = status && status !== 'all'
            ? fallbackAppointments.filter(a => a.status === status)
            : fallbackAppointments;

        res.status(200).json({
            success: true,
            count: filteredFallback.length,
            data: filteredFallback
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/appointments/landlord', protect, authorize('landlord', 'admin', 'employee'), async (req, res) => {
    try {
        const currentUserId = req.user._id || req.user.id;
        const currentUserEmail = req.user.email?.toLowerCase();
        const userPhone = (req.user.phone && String(req.user.phone).trim()) ? String(req.user.phone).trim() : null;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'employee';

        if (isDbConnected) {
            let roomIds = [];
            if (!isAdmin) {
                const myRooms = await Room.find({
                    $or: [
                        { owner: currentUserId },
                        ...(currentUserEmail ? [{ ownerEmail: currentUserEmail }] : [])
                    ]
                }).select('_id');
                roomIds = myRooms.map(r => r._id);
            }

            let query = {};
            if (!isAdmin) {
                const conditions = [];
                if (roomIds.length > 0) {
                    conditions.push({ roomId: { $in: roomIds } });
                }
                if (userPhone) {
                    conditions.push({ landlordPhone: userPhone });
                }
                // Nếu chủ trọ chưa có phòng nào và không có SĐT -> Trả về mảng rỗng [] ngay
                if (conditions.length === 0) {
                    return res.status(200).json({
                        success: true,
                        count: 0,
                        data: []
                    });
                }
                query = { $or: conditions };
            }

            const appts = await Appointment.find(query)
                .sort({ createdAt: -1 })
                .populate('roomId', 'title address price images image_url');

            return res.status(200).json({
                success: true,
                count: appts.length,
                data: appts
            });
        }

        // Chế độ Fallback Local: lọc chặt chẽ theo danh sách phòng sở hữu hoặc số điện thoại của chủ trọ
        const myRooms = fallbackRooms.filter(r => 
            isAdmin ||
            isSameId(r.owner, currentUserId) ||
            (r.ownerEmail && r.ownerEmail.toLowerCase() === currentUserEmail)
        );
        const myRoomIds = new Set(myRooms.map(r => String(r._id || r.id)));

        // Nếu chủ trọ không phải admin và không sở hữu phòng nào và không có phone:
        if (!isAdmin && myRoomIds.size === 0 && !userPhone) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        const filtered = isAdmin 
            ? fallbackAppointments 
            : fallbackAppointments.filter(a => {
                const aRoomId = a.roomId?._id || a.roomId?.id || a.roomId;
                const matchRoom = aRoomId && myRoomIds.has(String(aRoomId));
                const matchPhone = userPhone && a.landlordPhone && String(a.landlordPhone).trim() === userPhone;
                return matchRoom || matchPhone;
            });

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
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
    startStayCron(() => isDbConnected);
});