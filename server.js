const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('./models/Room');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Route kiểm tra trạng thái server
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'SmartStay Backend is running!' });
});

// API: Lấy danh sách phòng trọ (hỗ trợ lọc theo campus)
app.get('/api/rooms', async (req, res) => {
    try {
        const { campus } = req.query;
        const filter = campus ? { campus: new RegExp(campus, 'i') } : {};
        const rooms = await Room.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Thêm phòng trọ mới
app.post('/api/rooms', async (req, res) => {
    try {
        const newRoom = await Room.create(req.body);
        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});