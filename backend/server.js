const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('./models/Room');
const Review = require('./models/Review');
const RoommateSurvey = require('./models/RoommateSurvey');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Trạng thái kết nối DB
let isDbConnected = false;

// Kết nối MongoDB Atlas
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    })
        .then(() => {
            isDbConnected = true;
            console.log('✅ Connected to MongoDB Atlas successfully!');
        })
        .catch((err) => {
            isDbConnected = false;
            console.warn('⚠️ MongoDB connection warning (chưa whitelist IP hoặc đang offline):', err.message);
            console.log('ℹ️ Server sẽ hoạt động ở chế độ Fallback Mock Data để đảm bảo trải nghiệm không bị gián đoạn.');
        });
}

// Bộ dữ liệu dự phòng (Fallback Data) chuẩn theo dự án SmartStay
let fallbackRooms = [
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
        isSafeBadge: true,
        safe_badge: true,
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
        isSafeBadge: true,
        safe_badge: true,
        has_pass: true,
        remaining_duration: 5,
        pass_months_left: 5,
        remaining_deposit: 5600000,
        pass_reason: 'Chuyển chỗ thực tập lên TP.HCM',
        is_boosted: true,
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
        listingType: 'safe',
        isSafeBadge: true,
        safe_badge: true,
        seeking_roommate: true,
        createdAt: new Date()
    }
];

let fallbackReviews = [
    {
        _id: 'rev001',
        id: 'rev001',
        room: '6aad186f1f34d48876cf6301',
        studentName: 'Đặng Tuấn Kiệt (K18 ĐH FPT)',
        anonymous_name: 'Đặng Tuấn Kiệt (K18 ĐH FPT)',
        rating: 5,
        isCostAccurate: true,
        actualMonthlyCost: 2850000,
        comment: 'Phòng đúng giá như niêm yết, đồng hồ điện nước riêng rõ ràng, chủ trọ thân thiện.',
        content: 'Phòng đúng giá như niêm yết, đồng hồ điện nước riêng rõ ràng, chủ trọ thân thiện.',
        has_stayed: true,
        trust_score: 98,
        stayed_period: 'Đã ở 6 tháng (Kỳ Fall 2023)'
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
        has_stayed: true,
        trust_score: 92,
        stayed_period: 'Đã ở 1 năm (Kỳ Spring 2024)'
    }
];

let fallbackSurveys = [
    {
        _id: 'surv001',
        id: 'surv001',
        name: 'Trần Minh Quân',
        gender: 'Nam',
        contactZalo: '0912345678',
        campus: 'FPT Can Tho',
        sleepSchedule: 'night_owl',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        guestPolicy: 'ask_first',
        budgetRange: 'medium',
        createdAt: new Date()
    },
    {
        _id: 'surv002',
        id: 'surv002',
        name: 'Nguyễn Hải Đăng',
        gender: 'Nam',
        contactZalo: '0988776655',
        campus: 'FPT Can Tho',
        sleepSchedule: 'early_bird',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        guestPolicy: 'ask_first',
        budgetRange: 'medium',
        createdAt: new Date()
    }
];

let fallbackLogisticsRequests = [];
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
// 1. Lấy danh sách phòng trọ
app.get('/api/rooms', async (req, res) => {
    try {
        const { campus, maxPrice, electricityCostType, isSafeBadge, seekingRoommate, amenities, type } = req.query;

        if (isDbConnected) {
            let query = {};
            if (campus && campus !== 'Tất cả khu vực') query.campus = new RegExp(campus, 'i');
            if (maxPrice) query.price = { $lte: Number(maxPrice) };
            if (electricityCostType) query.electricityCostType = electricityCostType;
            if (isSafeBadge !== undefined) query.isSafeBadge = isSafeBadge === 'true';
            if (seekingRoommate !== undefined) query.seeking_roommate = seekingRoommate === 'true';
            if (type) query.listingType = type;

            const rooms = await Room.find(query).sort({ is_boosted: -1, safe_badge: -1, createdAt: -1 });
            return res.status(200).json({ success: true, count: rooms.length, data: rooms });
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

        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Lấy chi tiết phòng trọ
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

// 3. Đăng tin phòng trọ mới
app.post('/api/rooms', async (req, res) => {
    try {
        const data = { ...req.body };
        if (!data.image_url && data.images && data.images.length > 0) {
            data.image_url = data.images[0];
        }
        if (data.isSafeBadge) {
            data.safe_badge = true;
        }

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
        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 4. SmartStay Pass - Đăng tin sang nhượng phòng (Tuần G)
app.post('/api/rooms/pass', async (req, res) => {
    try {
        const passData = {
            ...req.body,
            listingType: 'pass',
            has_pass: true,
            pass_months_left: req.body.remaining_duration || req.body.pass_months_left || 3
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
        res.status(201).json({ success: true, message: 'Đăng tin Pass phòng thành công!', data: passRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS REVIEWS ====================
// 1. Gửi đánh giá cho phòng trọ
app.post('/api/reviews', async (req, res) => {
    try {
        const reviewData = {
            ...req.body,
            anonymous_name: req.body.studentName || req.body.anonymous_name || 'Sinh viên ẩn danh',
            content: req.body.comment || req.body.content || '',
            has_stayed: req.body.has_stayed !== undefined ? req.body.has_stayed : true,
            trust_score: req.body.trust_score || (req.body.isCostAccurate ? 95 : 60),
            stayed_period: req.body.stayed_period || 'Đã từng ở tại đây'
        };

        if (isDbConnected) {
            const newReview = await Review.create(reviewData);
            return res.status(201).json({ success: true, data: newReview });
        }

        const newReview = {
            _id: `rev_${Date.now()}`,
            id: `rev_${Date.now()}`,
            ...reviewData,
            createdAt: new Date()
        };
        fallbackReviews.unshift(newReview);
        res.status(201).json({ success: true, data: newReview });
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
// 1. Lưu hồ sơ khảo sát
app.post('/api/surveys', async (req, res) => {
    try {
        if (isDbConnected) {
            const newSurvey = await RoommateSurvey.create(req.body);
            return res.status(201).json({ success: true, data: newSurvey });
        }

        const newSurvey = {
            _id: `surv_${Date.now()}`,
            id: `surv_${Date.now()}`,
            ...req.body,
            createdAt: new Date()
        };
        fallbackSurveys.unshift(newSurvey);
        res.status(201).json({ success: true, data: newSurvey });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 2. Thuật toán tìm người tương thích (5 tiêu chí x 20%)
app.get('/api/surveys/matches/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let mySurvey = null;
        let otherSurveys = [];

        if (isDbConnected) {
            mySurvey = await RoommateSurvey.findById(id);
            if (!mySurvey) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ của bạn' });
            otherSurveys = await RoommateSurvey.find({ _id: { $ne: mySurvey._id } });
        } else {
            mySurvey = fallbackSurveys.find((s) => String(s._id) === id || String(s.id) === id);
            if (!mySurvey) {
                // Nếu chưa có, dùng hồ sơ đầu tiên
                mySurvey = fallbackSurveys[0];
            }
            otherSurveys = fallbackSurveys.filter((s) => String(s._id) !== String(mySurvey?._id));
        }

        const criteria = ['sleepSchedule', 'cleanliness', 'smokingDrinking', 'guestPolicy', 'budgetRange'];

        const matchedResults = otherSurveys.map((candidate) => {
            let matchScore = 0;
            let matchedDetails = [];

            criteria.forEach((item) => {
                if (candidate[item] === mySurvey[item]) {
                    matchScore += 20;
                    matchedDetails.push(item);
                }
            });

            return {
                candidateId: candidate._id || candidate.id,
                name: candidate.name,
                gender: candidate.gender,
                contactZalo: candidate.contactZalo,
                campus: candidate.campus,
                matchPercentage: `${matchScore}%`,
                rawScore: matchScore,
                matchedCriteriaCount: matchedDetails.length,
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

// 3. Lấy toàn bộ danh sách khảo sát
app.get('/api/surveys', async (req, res) => {
    try {
        if (isDbConnected) {
            const surveys = await RoommateSurvey.find().sort({ createdAt: -1 });
            return res.status(200).json({ success: true, count: surveys.length, data: surveys });
        }
        res.status(200).json({ success: true, count: fallbackSurveys.length, data: fallbackSurveys });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APIS SMARTSTAY LOGISTICS / MOVE ====================
// Đặt xe chuyển trọ (Tuần E)
app.post('/api/logistics-request', (req, res) => {
    try {
        const { vehicleType, distanceKm, servicePackage, pickupAddress, dropoffAddress, phone, estimatedPrice } = req.body;
        const request = {
            id: `logistics_${Date.now()}`,
            vehicleType,
            distanceKm,
            servicePackage,
            pickupAddress,
            dropoffAddress,
            phone,
            estimatedPrice,
            status: 'pending',
            createdAt: new Date()
        };
        fallbackLogisticsRequests.push(request);
        res.status(201).json({
            success: true,
            message: 'Yêu cầu đặt xe chuyển trọ đã được ghi nhận thành công!',
            data: request
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS SAFE LISTING: OTP & THANH TOÁN (Tuần E-F) ====================
// 1. Gửi mã OTP xác thực số điện thoại
app.post('/api/safe-listing/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 8) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore[phone] = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000 // Hết hạn sau 5 phút
    };

    console.log(`📱 [OTP SERVICE] Gửi OTP ${code} đến SĐT ${phone}`);
    res.status(200).json({
        success: true,
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn!',
        otpPreview: code // Hiển thị để tiện test sandbox
    });
});

// 2. Xác thực mã OTP
app.post('/api/safe-listing/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const record = otpStore[phone];

    // Cho phép mã demo '123456' hoặc mã đã gửi
    if (otp === '123456' || (record && record.code === otp && Date.now() <= record.expiresAt)) {
        return res.status(200).json({
            success: true,
            message: 'Xác thực số điện thoại thành công!',
            verifiedPhone: phone
        });
    }

    res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
});

// 3. Tạo phiên thanh toán Sandbox & Tự động duyệt gắn nhãn Safe (IPN Webhook)
app.post('/api/safe-listing/create-payment', async (req, res) => {
    try {
        const { roomId, amount, provider } = req.body; // provider: 'momo' | 'vnpay'
        const transactionId = `TRANS_${Date.now()}`;

        // Mô phỏng link thanh toán Sandbox
        const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${transactionId}&amount=${amount || 50000}`;

        res.status(200).json({
            success: true,
            transactionId,
            paymentUrl,
            message: 'Khởi tạo link thanh toán sandbox thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Webhook IPN xử lý thanh toán tự động -> Kích hoạt safe_badge
app.post('/api/safe-listing/payment-webhook', async (req, res) => {
    try {
        const { roomId, transactionId, status } = req.body;

        if (status === 'SUCCESS' || status === '00') {
            if (isDbConnected && roomId) {
                await Room.findByIdAndUpdate(roomId, { safe_badge: true, isSafeBadge: true });
            } else if (roomId) {
                const target = fallbackRooms.find((r) => String(r._id) === roomId || String(r.id) === roomId);
                if (target) {
                    target.safe_badge = true;
                    target.isSafeBadge = true;
                }
            }
            return res.status(200).json({ success: true, message: 'Đã tự động xác nhận và gắn nhãn Safe Listing cho phòng!' });
        }

        res.status(400).json({ success: false, message: 'Giao dịch không thành công' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Lắng nghe cổng
app.listen(PORT, () => {
    console.log(`🚀 SmartStay Backend Server is running on http://localhost:${PORT}`);
});