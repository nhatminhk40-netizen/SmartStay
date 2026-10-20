/**
 * Script seedContract.js
 * Tạo dữ liệu mẫu hợp đồng & cọc cho SmartStay
 * QUY TẮC: KHÔNG dùng deleteMany, KHÔNG xóa dữ liệu cũ, chỉ THÊM mới nếu chưa có.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Contract = require('./models/Contract');
const Room = require('./models/Room');
const User = require('./models/User');

const FALLBACK_CONTRACTS_FILE = path.join(__dirname, 'fallback_contracts.json');

const sampleLandlord = {
    _id: 'usr_landlord_nhatminh',
    id: 'usr_landlord_nhatminh',
    fullName: 'Đinh Trịnh Nhật Minh',
    email: 'nhatminhk40@gmail.com',
    phone: '0939112233',
    role: 'landlord'
};

const sampleTenants = [
    {
        _id: 'usr_tenant_001',
        id: 'usr_tenant_001',
        fullName: 'Trần Văn An',
        email: 'tranvanan@gmail.com',
        phone: '0981234567',
        studentId: 'MSSV18001',
        campus: 'FPT Can Tho',
        role: 'student'
    },
    {
        _id: 'usr_tenant_002',
        id: 'usr_tenant_002',
        fullName: 'Lê Thị Thu Thảo',
        email: 'thuthaole@gmail.com',
        phone: '0979888999',
        studentId: 'MSSV18002',
        campus: 'ĐH Cần Thơ',
        role: 'student'
    },
    {
        _id: 'usr_tenant_003',
        id: 'usr_tenant_003',
        fullName: 'Nguyễn Thành Long',
        email: 'thanhlong.it@gmail.com',
        phone: '0933445566',
        studentId: 'MSSV18003',
        campus: 'FPT Can Tho',
        role: 'student'
    },
    {
        _id: 'usr_tenant_004',
        id: 'usr_tenant_004',
        fullName: 'Phạm Minh Hưng',
        email: 'hungminh@gmail.com',
        phone: '0912233445',
        studentId: 'MSSV18004',
        campus: 'ĐH Y Dược',
        role: 'student'
    }
];

const sampleRooms = [
    {
        _id: '6aad186f1f34d48876cf6301',
        id: '6aad186f1f34d48876cf6301',
        title: 'Phòng 101 - Gác lửng đúc cao cấp KDC Hồng Phát',
        address: 'Số 12 đường Số 3, KDC Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
        price: 2500000,
        campus: 'FPT Can Tho',
        status: 'rented'
    },
    {
        _id: '6aad186f1f34d48876cf6302',
        id: '6aad186f1f34d48876cf6302',
        title: 'Phòng 102 - Studio ban công thoáng mát gần ĐH Cần Thơ',
        address: 'Hẻm 51 đường 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ',
        price: 2200000,
        campus: 'ĐH Cần Thơ',
        status: 'rented'
    },
    {
        _id: '6aad186f1f34d48876cf6303',
        id: '6aad186f1f34d48876cf6303',
        title: 'Phòng 201 - Phòng trọ khép kín đầy đủ nội thất',
        address: 'Khu vực 2, An Bình, Ninh Kiều, Cần Thơ',
        price: 1800000,
        campus: 'FPT Can Tho',
        status: 'rented'
    },
    {
        _id: '6aad186f1f34d48876cf6304',
        id: '6aad186f1f34d48876cf6304',
        title: 'Phòng 202 - Phòng đôi có máy lạnh, máy giặt riêng',
        address: 'Đường Nguyễn Văn Cừ nối dài, An Bình, Cần Thơ',
        price: 3000000,
        campus: 'ĐH Y Dược',
        status: 'available'
    }
];

// Tạo các ngày mẫu
const now = new Date();

// 1. Hợp đồng 1: Đang hiệu lực, cọc đã thu, còn hạn 6 tháng
const start1 = new Date(now);
start1.setMonth(start1.getMonth() - 2);
const end1 = new Date(start1);
end1.setMonth(end1.getMonth() + 12);

// 2. Hợp đồng 2: Đang hiệu lực, SẮP HẾT HẠN trong vòng 15 ngày tới
const start2 = new Date(now);
start2.setMonth(start2.getMonth() - 11);
start2.setDate(start2.getDate() - 15);
const end2 = new Date(now);
end2.setDate(end2.getDate() + 15); // Còn 15 ngày hết hạn

// 3. Hợp đồng 3: Đang hiệu lực, CỌC CHƯA THU (khách vừa ký, hẹn thanh toán cọc sau 3 ngày)
const start3 = new Date(now);
start3.setDate(start3.getDate() - 3);
const end3 = new Date(start3);
end3.setMonth(end3.getMonth() + 6);

// 4. Hợp đồng 4: ĐÃ KẾT THÚC, HOÀN CỌC MỘT PHẦN (sau khi trừ 300k tiền hư vòi sen)
const start4 = new Date(now);
start4.setMonth(start4.getMonth() - 13);
const end4 = new Date(now);
end4.setMonth(end4.getMonth() - 1);

const sampleContractsData = [
    {
        _id: 'ctr_sample_001',
        id: 'ctr_sample_001',
        room: sampleRooms[0],
        tenant: sampleTenants[0],
        landlord: sampleLandlord,
        startDate: start1.toISOString(),
        endDate: end1.toISOString(),
        durationMonths: 12,
        monthlyRent: 2500000,
        paymentDay: 5,
        electricPrice: 3500,
        waterPrice: 20000,
        terms: 'Hợp đồng thuê 1 năm, giữ trật tự sau 23h, không hút thuốc trong phòng, thanh toán trước ngày 5 hàng tháng.',
        deposit: {
            amount: 2500000,
            status: 'paid',
            paidAt: start1.toISOString(),
            paymentMethod: 'transfer',
            refundedAmount: 0,
            deductions: [],
            note: 'Chuyển khoản cọc đủ 1 tháng'
        },
        status: 'active',
        createdAt: start1.toISOString()
    },
    {
        _id: 'ctr_sample_002',
        id: 'ctr_sample_002',
        room: sampleRooms[1],
        tenant: sampleTenants[1],
        landlord: sampleLandlord,
        startDate: start2.toISOString(),
        endDate: end2.toISOString(),
        durationMonths: 12,
        monthlyRent: 2200000,
        paymentDay: 10,
        electricPrice: 3800,
        waterPrice: 15000,
        terms: 'Hợp đồng chuẩn bị đáo hạn. Khách đang có nguyện vọng gia hạn thêm 6 tháng.',
        deposit: {
            amount: 2200000,
            status: 'paid',
            paidAt: start2.toISOString(),
            paymentMethod: 'cash',
            refundedAmount: 0,
            deductions: [],
            note: 'Thu cọc tiền mặt tại phòng'
        },
        status: 'active',
        createdAt: start2.toISOString()
    },
    {
        _id: 'ctr_sample_003',
        id: 'ctr_sample_003',
        room: sampleRooms[2],
        tenant: sampleTenants[2],
        landlord: sampleLandlord,
        startDate: start3.toISOString(),
        endDate: end3.toISOString(),
        durationMonths: 6,
        monthlyRent: 1800000,
        paymentDay: 1,
        electricPrice: 3500,
        waterPrice: 20000,
        terms: 'Khách dọn vào ở trước, hẹn chuyển khoản tiền cọc trong vòng 3 ngày làm việc.',
        deposit: {
            amount: 1800000,
            status: 'unpaid',
            paidAt: null,
            paymentMethod: 'transfer',
            refundedAmount: 0,
            deductions: [],
            note: 'Chưa thu cọc - Chờ khách chuyển khoản'
        },
        status: 'active',
        createdAt: start3.toISOString()
    },
    {
        _id: 'ctr_sample_004',
        id: 'ctr_sample_004',
        room: sampleRooms[3],
        tenant: sampleTenants[3],
        landlord: sampleLandlord,
        startDate: start4.toISOString(),
        endDate: end4.toISOString(),
        durationMonths: 12,
        monthlyRent: 3000000,
        paymentDay: 5,
        electricPrice: 3500,
        waterPrice: 20000,
        terms: 'Hợp đồng đã kết thúc đúng hạn. Đã bàn giao chìa khóa và kiểm tra phòng.',
        deposit: {
            amount: 3000000,
            status: 'partial_refund',
            paidAt: start4.toISOString(),
            paymentMethod: 'transfer',
            refundedAmount: 2700000,
            deductions: [
                {
                    reason: 'Làm hỏng vòi sen nhà tắm và chốt cửa ban công',
                    amount: 300000
                }
            ],
            note: 'Đã hoàn trả 2.700.000 VNĐ qua ngân hàng sau khi trừ phí sửa chữa vật tư.'
        },
        status: 'ended',
        createdAt: start4.toISOString()
    }
];

async function seed() {
    console.log('🚀 Bắt đầu nạp hợp đồng mẫu (seedContract.js)...');

    // 1. Luôn ghi nhận vào file dữ liệu dự phòng fallback_contracts.json
    let existingFallback = [];
    try {
        if (fs.existsSync(FALLBACK_CONTRACTS_FILE)) {
            existingFallback = JSON.parse(fs.readFileSync(FALLBACK_CONTRACTS_FILE, 'utf8'));
        }
    } catch (e) {
        existingFallback = [];
    }

    let addedFallbackCount = 0;
    for (const sample of sampleContractsData) {
        if (!existingFallback.some(c => c._id === sample._id || c.id === sample.id)) {
            existingFallback.push(sample);
            addedFallbackCount++;
        }
    }

    fs.writeFileSync(FALLBACK_CONTRACTS_FILE, JSON.stringify(existingFallback, null, 2), 'utf8');
    console.log(`✅ [Local Fallback]: Đã cập nhật ${addedFallbackCount} hợp đồng mẫu vào fallback_contracts.json`);

    // 2. Nếu có MongoDB URI, kết nối và nạp vào DB nếu chưa tồn tại
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
            console.log('✅ Kết nối MongoDB thành công để kiểm tra dữ liệu hợp đồng...');

            // Tìm landlord và tenants trong DB
            let landlord = await User.findOne({ email: 'nhatminhk40@gmail.com' });
            if (!landlord) landlord = await User.findOne({ role: 'landlord' });

            const rooms = await Room.find().limit(4);
            const tenants = await User.find({ role: 'student' }).limit(4);

            if (landlord && rooms.length > 0 && tenants.length > 0) {
                let dbAdded = 0;
                for (let i = 0; i < Math.min(rooms.length, sampleContractsData.length); i++) {
                    const r = rooms[i];
                    const t = tenants[i % tenants.length];
                    const sample = sampleContractsData[i];

                    // Kiểm tra xem đã có hợp đồng cho phòng này chưa
                    const existed = await Contract.findOne({ room: r._id, tenant: t._id });
                    if (!existed) {
                        await Contract.create({
                            room: r._id,
                            tenant: t._id,
                            landlord: landlord._id,
                            startDate: new Date(sample.startDate),
                            endDate: new Date(sample.endDate),
                            durationMonths: sample.durationMonths,
                            monthlyRent: r.price || sample.monthlyRent,
                            paymentDay: sample.paymentDay,
                            electricPrice: sample.electricPrice,
                            waterPrice: sample.waterPrice,
                            terms: sample.terms,
                            deposit: sample.deposit,
                            status: sample.status
                        });

                        if (sample.status === 'active') {
                            r.status = 'rented';
                            await r.save();
                        }
                        dbAdded++;
                    }
                }
                console.log(`✅ [MongoDB]: Đã nạp thành công ${dbAdded} hợp đồng mới vào cơ sở dữ liệu.`);
            } else {
                console.log('ℹ️ Chưa đủ dữ liệu Room/User trong DB để liên kết, hợp đồng mẫu offline đã sẵn sàng.');
            }
            await mongoose.disconnect();
        } catch (dbErr) {
            console.log('ℹ️ MongoDB chưa sẵn sàng hoặc timeout, hệ thống hoạt động ở chế độ Local Mock Contracts: ', dbErr.message);
        }
    } else {
        console.log('ℹ️ Không có chuỗi kết nối MongoDB thực tế. Đã hoàn tất nạp hợp đồng mẫu offline.');
    }

    console.log('🎉 Hoàn tất seedContract.js thành công!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Lỗi khi chạy seedContract:', err);
    process.exit(1);
});
