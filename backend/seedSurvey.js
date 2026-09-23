const mongoose = require('mongoose');
require('dotenv').config();
const RoommateSurvey = require('./models/RoommateSurvey');

const sampleSurveys = [
    {
        name: 'Nguyễn Văn An',
        contactZalo: '0901111222',
        campus: 'FPT Can Tho',
        gender: 'Nam',
        sleepSchedule: 'night_owl',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        guestPolicy: 'ask_first',
        budgetRange: 'medium'
    },
    {
        name: 'Trần Minh Hoàng',
        contactZalo: '0903333444',
        campus: 'FPT Can Tho',
        gender: 'Nam',
        sleepSchedule: 'night_owl',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        guestPolicy: 'ask_first',
        budgetRange: 'medium' // Trùng 100% với An
    },
    {
        name: 'Lê Quốc Bảo',
        contactZalo: '0905555666',
        campus: 'FPT Can Tho',
        gender: 'Nam',
        sleepSchedule: 'early',
        cleanliness: 'weekly',
        smokingDrinking: 'sometimes',
        guestPolicy: 'open',
        budgetRange: 'low' // Khác hầu hết tiêu chí
    },
    {
        name: 'Phạm Hồng Ánh',
        contactZalo: '0907777888',
        campus: 'FPT Can Tho',
        gender: 'Nu',
        sleepSchedule: 'early',
        cleanliness: 'daily',
        smokingDrinking: 'none',
        guestPolicy: 'ask_first',
        budgetRange: 'medium'
    }
];

const seedSurvey = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecting to MongoDB Atlas...');
        await RoommateSurvey.deleteMany();
        const inserted = await RoommateSurvey.insertMany(sampleSurveys);
        console.log('Seeded sample surveys successfully!');
        console.log(`Copy ID test cua An: ${inserted[0]._id}`);
        process.exit();
    } catch (error) {
        console.error('Error seeding surveys:', error);
        process.exit(1);
    }
};

seedSurvey();