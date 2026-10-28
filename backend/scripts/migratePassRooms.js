const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PassRoom = require('../models/PassRoom');
const Room = require('../models/Room');
const { generateConfirmationToken } = require('../utils/passToken');

const FALLBACK_ROOMS_FILE = path.join(__dirname, '../fallback_rooms.json');
const FALLBACK_PASS_FILE = path.join(__dirname, '../fallback_pass_rooms.json');

const mapOldStatusToNew = (oldStatus) => {
    switch (oldStatus) {
        case 'landlord_confirmed':
            return 'verified';
        case 'landlord_rejected':
            return 'rejected';
        case 'pending_landlord':
        default:
            return 'pending_landlord';
    }
};

const runMigration = async () => {
    console.log('🔄 Bắt đầu chạy Migration PassRoom...');

    // 1. Migration cho Fallback JSON Files
    try {
        let fallbackRooms = [];
        if (fs.existsSync(FALLBACK_ROOMS_FILE)) {
            fallbackRooms = JSON.parse(fs.readFileSync(FALLBACK_ROOMS_FILE, 'utf8'));
        }

        let existingPassList = [];
        if (fs.existsSync(FALLBACK_PASS_FILE)) {
            existingPassList = JSON.parse(fs.readFileSync(FALLBACK_PASS_FILE, 'utf8'));
        }

        const passRoomsToMigrate = fallbackRooms.filter(r => r.listingType === 'pass' || r.has_pass);
        let addedCount = 0;

        for (const old of passRoomsToMigrate) {
            const alreadyExists = existingPassList.some(p => String(p.id) === String(old.id || old._id));
            if (!alreadyExists) {
                const { tokenHash, expiresAt } = generateConfirmationToken();
                const newRecord = {
                    _id: old._id || old.id || `pass_${Date.now()}`,
                    id: old.id || old._id || `pass_${Date.now()}`,
                    title: old.title || 'Pass phòng trọ',
                    description: old.description || '',
                    address: old.address || 'Ninh Kiều, Cần Thơ',
                    campus: old.campus || 'ĐH Cần Thơ',
                    area_sqm: old.area_sqm || 20,
                    room_type: old.room_type || 'Phòng trọ khép kín',
                    images: old.images || (old.image_url ? [old.image_url] : []),
                    contractImages: old.contractImage ? [old.contractImage] : [],
                    monthlyRent: Number(old.price) || 2000000,
                    passPrice: Number(old.remaining_deposit || old.price || 2000000),
                    depositAmount: Number(old.remaining_deposit || old.price || 2000000),
                    remainingMonths: Number(old.pass_months_left || old.remaining_duration || 3),
                    moveInDate: old.moveOutDate || new Date().toISOString(),
                    isFlexibleMoveIn: true,
                    amenities: old.amenities || [],
                    rules: [],
                    landlordName: old.landlordName || 'Chủ trọ',
                    landlordPhone: old.landlordPhone || old.contactPhone || '0901234567',
                    landlordEmail: old.landlordEmail || '',
                    status: mapOldStatusToNew(old.pass_status),
                    landlordConfirmation: {
                        tokenHash,
                        expiresAt,
                        confirmedAt: old.pass_status === 'landlord_confirmed' ? new Date() : null,
                        note: old.landlordNote || ''
                    },
                    owner: old.owner || '651a1b2c3d4e5f6a7b8c9d01',
                    posterName: old.posterName || 'Sinh viên',
                    posterPhone: old.contactPhone || '',
                    ownerEmail: old.ownerEmail || '',
                    viewCount: 0,
                    savedBy: [],
                    reports: [],
                    createdAt: old.createdAt || new Date(),
                    updatedAt: new Date()
                };
                existingPassList.push(newRecord);
                addedCount++;
            }
        }

        fs.writeFileSync(FALLBACK_PASS_FILE, JSON.stringify(existingPassList, null, 2), 'utf8');
        console.log(`✅ [Fallback Migration] Đã đồng bộ ${addedCount} bản ghi cũ sang fallback_pass_rooms.json`);
    } catch (err) {
        console.warn('⚠️ Lỗi migration Fallback JSON:', err.message);
    }

    // 2. Migration cho MongoDB Atlas (nếu có chuỗi kết nối)
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (mongoUri) {
        try {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ Đã kết nối MongoDB Atlas để chạy migration PassRoom...');

            const oldRooms = await Room.find({
                $or: [{ listingType: 'pass' }, { has_pass: true }]
            });

            let mongoCount = 0;
            for (const r of oldRooms) {
                const exists = await PassRoom.findById(r._id);
                if (!exists) {
                    const { tokenHash, expiresAt } = generateConfirmationToken();
                    await PassRoom.create({
                        _id: r._id,
                        title: r.title,
                        description: r.description || '',
                        address: r.address || 'Ninh Kiều, Cần Thơ',
                        campus: r.campus || 'ĐH Cần Thơ',
                        area_sqm: r.area_sqm || 20,
                        room_type: r.room_type || 'Phòng trọ khép kín',
                        images: r.images && r.images.length ? r.images : (r.image_url ? [r.image_url] : []),
                        monthlyRent: r.price,
                        passPrice: r.remaining_deposit || r.price,
                        depositAmount: r.remaining_deposit || r.price,
                        remainingMonths: r.pass_months_left || r.remaining_duration || 3,
                        moveInDate: r.moveOutDate || new Date(),
                        isFlexibleMoveIn: true,
                        amenities: r.amenities || [],
                        landlordName: r.landlordName || 'Chủ trọ',
                        landlordPhone: r.landlordPhone || r.contactPhone || '0901234567',
                        landlordEmail: r.landlordEmail || '',
                        status: mapOldStatusToNew(r.pass_status),
                        landlordConfirmation: {
                            tokenHash,
                            expiresAt,
                            confirmedAt: r.pass_status === 'landlord_confirmed' ? new Date() : null,
                            note: r.landlordNote || ''
                        },
                        owner: r.owner || new mongoose.Types.ObjectId(),
                        ownerEmail: r.ownerEmail || '',
                        posterName: r.posterName || 'Sinh viên'
                    });
                    mongoCount++;
                }
            }

            console.log(`✅ [MongoDB Migration] Đã di chuyển thành công ${mongoCount} phòng sang PassRoom.`);
            await mongoose.disconnect();
        } catch (mErr) {
            console.log('ℹ️ Bỏ qua migration MongoDB trực tiếp (DB offline hoặc không kết nối được):', mErr.message);
        }
    }

    console.log('🎉 Migration hoàn tất!');
};

if (require.main === module) {
    runMigration().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = runMigration;
