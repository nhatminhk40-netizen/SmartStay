/**
 * BỘ KIỂM THỬ BẢO MẬT & CÁCH LY DỮ LIỆU TÀI KHOẢN (MULTI-TENANT ACCOUNT ISOLATION)
 * Kiểm chứng:
 * 1. Chặn request không có token (HTTP 401 Unauthorized), chống giả mạo tự động Bác Ba
 * 2. Phân tách danh tính: Token offline của người nào giữ nguyên danh tính người đó
 * 3. Cách ly dữ liệu Hợp đồng: Chủ trọ A không thể đọc trộm hợp đồng của Chủ trọ B
 * 4. Cách ly Bảng chốt số điện nước Grid: Chủ trọ A không bị cắm nhầm phòng/hóa đơn của Bác Ba
 */

const assert = require('assert');
const express = require('express');
const http = require('http');
const { protect, generateToken } = require('../middleware/auth');
const billRoutes = require('../routes/billRoutes');
const contractRoutes = require('../routes/contracts');

const app = express();
app.use(express.json());

// Giả lập môi trường in-memory độc lập
app.locals.isDbConnected = false;
app.locals.fallbackUsers = [
    {
        _id: 'usr_landlord_001',
        id: 'usr_landlord_001',
        fullName: 'Bác Ba Cần Thơ (Chủ trọ)',
        email: 'chutro@smartstay.vn',
        role: 'landlord'
    },
    {
        _id: 'usr_landlord_minh',
        id: 'usr_landlord_minh',
        fullName: 'Minh Minh (Chủ trọ mới)',
        email: 'minhminh@gmail.com',
        role: 'landlord'
    },
    {
        _id: 'usr_student_001',
        id: 'usr_student_001',
        fullName: 'Nguyễn Văn An (Người thuê)',
        email: 'nguoithue@smartstay.vn',
        role: 'student'
    }
];

// Phòng mẫu: Bác Ba có phòng riêng, Minh Minh có phòng riêng
app.locals.fallbackRooms = [
    {
        _id: 'room_bac_ba_1',
        id: 'room_bac_ba_1',
        title: 'Phòng Bác Ba 101',
        property_name: 'Khu trọ Cô Ba',
        owner: 'usr_landlord_001',
        ownerEmail: 'chutro@smartstay.vn',
        price: 2500000,
        status: 'rented'
    },
    {
        _id: 'room_minh_1',
        id: 'room_minh_1',
        title: 'Phòng A1 - P.101 của Minh',
        property_name: 'Dãy trọ Minh Minh',
        owner: 'usr_landlord_minh',
        ownerEmail: 'minhminh@gmail.com',
        price: 1800000,
        status: 'available'
    }
];

app.use('/api/bills', billRoutes);
app.use('/api/contracts', contractRoutes);

const testServer = http.createServer(app);

const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
};

testServer.listen(0, async () => {
    const port = testServer.address().port;
    console.log(`\n🛡️ Bắt đầu kiểm thử Cách ly Dữ liệu Tài khoản & Phân quyền (Port ${port})...\n`);

    try {
        // --- TEST 1: Request KHÔNG có token -> Bị từ chối 401 ngay lập tức, không gán mặc định Bác Ba ---
        console.log('--- TEST 1: Kiểm tra chống gán ngầm danh tính Bác Ba khi không có Token ---');
        const unauthRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/bills/grid?month=10&year=2026',
            method: 'GET'
        });
        assert.strictEqual(unauthRes.status, 401, 'Request không có token phải bị từ chối 401');
        assert.strictEqual(unauthRes.body.success, false);
        console.log('✓ Request không token bị chặn 401 Unauthorized.');
        console.log('✅ TEST 1 THÀNH CÔNG: Chấm dứt hoàn toàn lỗ hổng tự động gán tài khoản Bác Ba!\n');

        // --- TEST 2: Đăng nhập bằng tài khoản "Minh Minh" -> Chỉ thấy phòng của Minh Minh, không thấy Bác Ba ---
        console.log('--- TEST 2: Chủ trọ "Minh Minh" tải Bảng chốt số điện nước Grid ---');
        const tokenMinh = generateToken({
            id: 'usr_landlord_minh',
            email: 'minhminh@gmail.com',
            role: 'landlord',
            fullName: 'Minh Minh'
        });

        const gridMinhRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/bills/grid?month=10&year=2026',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenMinh}`
            }
        });

        assert.strictEqual(gridMinhRes.status, 200);
        assert.strictEqual(gridMinhRes.body.success, true);
        const rowsMinh = gridMinhRes.body.data;
        assert(Array.isArray(rowsMinh), 'Dữ liệu trả về phải là mảng');
        
        // Minh Minh chỉ được thấy phòng của mình, KHÔNG ĐƯỢC THẤY "Khu trọ Cô Ba" hoặc "Phòng Bác Ba 101"
        const containsBacBaRoom = rowsMinh.some(r => r.propertyName?.includes('Cô Ba') || r.tenantName === 'Nguyễn Văn A' || r.roomId === 'room_bac_ba_1');
        assert.strictEqual(containsBacBaRoom, false, 'Dữ liệu của Minh Minh bị lộ thông tin của Bác Ba!');
        
        const hasMinhRoom = rowsMinh.some(r => r.roomId === 'room_minh_1' || r.propertyName === 'Dãy trọ Minh Minh');
        assert.strictEqual(hasMinhRoom, true, 'Minh Minh phải thấy đúng phòng thuộc quyền sở hữu của mình');
        console.log(`✓ Minh Minh nhận được ${rowsMinh.length} dòng phòng: [${rowsMinh.map(r => r.roomNumber || r.propertyName).join(', ')}].`);
        console.log('✓ Hoàn toàn KHÔNG rò rỉ phòng P.101 Nguyễn Văn A hay Khu trọ Cô Ba của Bác Ba.');
        console.log('✅ TEST 2 THÀNH CÔNG: Dữ liệu Bảng chốt số đã được cách ly 100% giữa các chủ trọ!\n');

        // --- TEST 3: Minh Minh lưu số điện nước Tháng 10 -> Không ghi đè hay ảnh hưởng đến Bác Ba ---
        console.log('--- TEST 3: Minh Minh lưu bảng chốt số -> Lưu đúng kho riêng của Minh Minh ---');
        const saveMinhRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/bills/batch-save-grid',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenMinh}`,
                'Content-Type': 'application/json'
            }
        }, {
            month: 10,
            year: 2026,
            rows: [
                {
                    roomId: 'room_minh_1',
                    roomNumber: 'P.101 Minh',
                    propertyName: 'Dãy trọ Minh Minh',
                    tenantName: 'Khách A',
                    electricPrevious: 50,
                    electricCurrent: 120,
                    electricPrice: 3500,
                    waterPrevious: 10,
                    waterCurrent: 15,
                    waterPrice: 15000,
                    monthlyRent: 1800000,
                    status: 'unpaid'
                }
            ]
        });
        assert.strictEqual(saveMinhRes.status, 200);

        // Bác Ba đăng nhập và tải bảng điện nước -> Phải thấy dữ liệu riêng của Bác Ba, không bị đè bởi Minh Minh
        const tokenBacBa = generateToken({
            id: 'usr_landlord_001',
            email: 'chutro@smartstay.vn',
            role: 'landlord',
            fullName: 'Bác Ba Cần Thơ'
        });
        const gridBacBaRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/bills/grid?month=10&year=2026',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenBacBa}`
            }
        });
        assert.strictEqual(gridBacBaRes.status, 200);
        const rowsBacBa = gridBacBaRes.body.data;
        const containsMinhDataInBacBa = rowsBacBa.some(r => r.roomId === 'room_minh_1');
        assert.strictEqual(containsMinhDataInBacBa, false, 'Dữ liệu của Minh Minh bị trộn vào Bác Ba!');
        console.log('✓ Kho dữ liệu của Bác Ba và Minh Minh hoàn toàn độc lập, không ghi đè chéo.');
        console.log('✅ TEST 3 THÀNH CÔNG: Cách ly kho lưu trữ Multi-tenant thành công!\n');

        // --- TEST 4: Chủ trọ chưa có phòng nào (chủ trọ mới toanh) -> Trả về mảng rỗng [] ---
        console.log('--- TEST 4: Chủ trọ mới chưa có phòng -> Trả về mảng rỗng [] thay vì gán phòng Bác Ba ---');
        const tokenNewLandlord = generateToken({
            id: 'usr_landlord_new_empty',
            email: 'newlandlord@smartstay.vn',
            role: 'landlord',
            fullName: 'Chủ Trọ Mới Toanh'
        });
        const gridEmptyRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/bills/grid?month=10&year=2026',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenNewLandlord}`
            }
        });
        assert.strictEqual(gridEmptyRes.status, 200);
        assert.strictEqual(gridEmptyRes.body.count, 0, 'Chủ trọ mới chưa có phòng phải có count = 0');
        assert.deepStrictEqual(gridEmptyRes.body.data, [], 'Chủ trọ mới phải nhận mảng rỗng [], không lấy râu ông nọ cắm cằm bà kia');
        console.log('✓ Chủ trọ mới nhận mảng rỗng [] an toàn.');
        console.log('✅ TEST 4 THÀNH CÔNG: Đã ngăn chặn triệt để việc nhồi nhét phòng mẫu Bác Ba cho tài khoản mới!\n');

                // --- TEST 5: Cách ly Hợp đồng & Cọc phòng: Chủ trọ chưa có hợp đồng nhận mảng rỗng [] & stats = 0 ---
        console.log('--- TEST 5: Chủ trọ chưa có hợp đồng -> Trả về mảng rỗng [] và stats = 0 ---');
        const contractsMinhRes = await makeRequest({
            hostname: '127.0.0.1',
            port,
            path: '/api/contracts?page=1&limit=10',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenMinh}`
            }
        });
        assert.strictEqual(contractsMinhRes.status, 200);
        assert.strictEqual(contractsMinhRes.body.success, true);
        assert.deepStrictEqual(contractsMinhRes.body.data, [], 'Chủ trọ Minh Minh chưa có hợp đồng phải nhận mảng rỗng []');
        assert.strictEqual(contractsMinhRes.body.stats.totalContracts, 0, 'Minh Minh phải có totalContracts = 0');
        assert.strictEqual(contractsMinhRes.body.stats.activeCount, 0, 'Minh Minh phải có activeCount = 0');
        assert.strictEqual(contractsMinhRes.body.stats.totalHoldingDeposit, 0, 'Minh Minh phải có totalHoldingDeposit = 0');
        console.log('✓ Minh Minh nhận danh sách hợp đồng rỗng [] và toàn bộ stats = 0 chuẩn xác.');
        console.log('✅ TEST 5 THÀNH CÔNG: Cách ly danh sách Hợp đồng & Tiền cọc an toàn tuyệt đối!\n');

        console.log('🎉 TẤT CẢ 5 BỘ TEST CÁCH LY TÀI KHOẢN VÀ BẢO MẬT ĐỀU ĐẠT 100%!');
        testServer.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ KIỂM THỬ THẤT BẠI:', err);
        testServer.close();
        process.exit(1);
    }
});
