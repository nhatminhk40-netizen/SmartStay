const Review = require('./models/Review'); // Thêm ở đầu file cùng các require khác
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('./models/Room');
const RoommateSurvey = require('./models/RoommateSurvey'); // Nạp model khảo sát tìm bạn cùng phòng

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Route kiểm tra server
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'SmartStay Backend is running!' });
});

// ==================== APIS QUẢN LÝ PHÒNG TRỌ ====================
app.get('/api/rooms', async (req, res) => {
    try {
        const { campus, maxPrice, electricityCostType, isSafeBadge } = req.query;
        let query = {};
        if (campus) query.campus = new RegExp(campus, 'i');
        if (maxPrice) query.price = { $lte: Number(maxPrice) };
        if (electricityCostType) query.electricityCostType = electricityCostType;
        if (isSafeBadge !== undefined) query.isSafeBadge = isSafeBadge === 'true';

        const rooms = await Room.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        res.status(400).json({ success: false, error: 'ID phòng không hợp lệ' });
    }
});

app.post('/api/rooms', async (req, res) => {
    try {
        const newRoom = await Room.create(req.body);
        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==================== APIS ROOMMATE MATCHER ====================
// 1. Lưu hồ sơ khảo sát của sinh viên
app.post('/api/surveys', async (req, res) => {
    try {
        const newSurvey = await RoommateSurvey.create(req.body);
        res.status(201).json({ success: true, data: newSurvey });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 2. Thuật toán tìm người phù hợp nhất dựa trên ID khảo sát
app.get('/api/surveys/matches/:id', async (req, res) => {
    try {
        const mySurvey = await RoommateSurvey.findById(req.params.id);
        if (!mySurvey) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ của bạn' });
        }

        // Lấy danh sách hồ sơ khác (loại trừ chính mình)
        const otherSurveys = await RoommateSurvey.find({ _id: { $ne: mySurvey._id } });

        // 5 tiêu chí so khớp: Mỗi tiêu chí trùng khớp cộng 20%
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
                candidateId: candidate._id,
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

        // Sắp xếp người tương thích cao nhất lên đầu
        matchedResults.sort((a, b) => b.rawScore - a.rawScore);

        res.status(200).json({
            success: true,
            currentUser: mySurvey.name,
            totalCandidates: matchedResults.length,
            matches: matchedResults
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Lấy toàn bộ danh sách khảo sát để tiện xem ID kiểm tra
app.get('/api/surveys', async (req, res) => {
    try {
        const surveys = await RoommateSurvey.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: surveys.length, data: surveys });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// ==================== REVIEW APIS ====================

// 1. Gửi đánh giá cho phòng trọ
app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = await Review.create(req.body);
        res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 2. Lấy danh sách đánh giá của một phòng kèm thống kê độ uy tín
app.get('/api/reviews/room/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const reviews = await Review.find({ room: roomId }).sort({ createdAt: -1 });

        // Tính điểm trung bình và tỷ lệ minh bạch chi phí
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