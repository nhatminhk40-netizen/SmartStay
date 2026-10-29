const assert = require('assert');
const express = require('express');
const chatRoutes = require('../routes/chatRoutes');

async function testApi() {
    console.log('🧪 Bắt đầu kiểm thử REST API Chat & MongoDB / Fallback Store...\n');

    const app = express();
    app.use(express.json());
    app.locals.isDbConnected = false; // Test in-memory fallback
    app.use('/api/chat', chatRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api/chat`;

    try {
        // 1. Tạo conversation giữa User 1 và User 2
        const convRes = await fetch(`${baseUrl}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantA: { id: 'u_test_1', name: 'Nguyễn Văn A', phone: '0901111111' },
                participantB: { id: 'u_test_2', name: 'Trần Thị B', phone: '0902222222' }
            })
        });
        const convData = await convRes.json();
        assert.strictEqual(convData.success, true);
        const convId = convData.data._id || convData.data.id;
        assert(convId, 'Phải có convId');
        console.log('✅ 1. POST /api/chat/conversations tạo hội thoại thành công');

        // 2. Gửi tin nhắn thông thường
        const msgRes1 = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: convId,
                senderId: 'u_test_1',
                senderName: 'Nguyễn Văn A',
                recipientId: 'u_test_2',
                text: 'Chào bạn B, mình muốn hỏi về phòng ở ghép.'
            })
        });
        const msgData1 = await msgRes1.json();
        assert.strictEqual(msgData1.success, true);
        assert.strictEqual(msgData1.data.containsSensitiveInfo, false);
        console.log('✅ 2. POST /api/chat/messages gửi tin nhắn thông thường thành công');

        // 3. Gửi tin nhắn có SĐT -> Phải phát hiện và che số, chuyển hướng Zalo
        const msgRes2 = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: convId,
                senderId: 'u_test_1',
                senderName: 'Nguyễn Văn A',
                recipientId: 'u_test_2',
                text: 'Số điện thoại của mình là 0939112233 nhé',
                recipientPhone: '0902222222'
            })
        });
        const msgData2 = await msgRes2.json();
        assert.strictEqual(msgData2.success, true);
        assert.strictEqual(msgData2.data.containsSensitiveInfo, true);
        assert.strictEqual(msgData2.data.redirectZalo, true);
        assert.strictEqual(msgData2.inspection.containsSensitiveInfo, true);
        assert(msgData2.data.maskedText.includes('[Đã ẩn SĐT - Vui lòng mở qua Zalo]'));
        console.log('✅ 3. POST /api/chat/messages phát hiện SĐT & kích hoạt Zalo thành công');

        // 4. Lấy lịch sử tin nhắn
        const listRes = await fetch(`${baseUrl}/messages/${convId}`);
        const listData = await listRes.json();
        assert.strictEqual(listData.success, true);
        assert.strictEqual(listData.count, 2);
        console.log('✅ 4. GET /api/chat/messages/:conversationId lấy 2 tin nhắn chuẩn xác');

        // 5. Lấy danh sách hội thoại của User 1
        const userConvRes = await fetch(`${baseUrl}/conversations?userId=u_test_1`);
        const userConvData = await userConvRes.json();
        assert.strictEqual(userConvData.success, true);
        assert.strictEqual(userConvData.count, 1);
        console.log('✅ 5. GET /api/chat/conversations?userId=... trả về danh sách hội thoại');

        console.log('\n🎉 TOÀN BỘ ENDPOINT API CHAT & KIỂM DUYỆT SĐT QUA ZALO HOẠT ĐỘNG HOÀN HẢO!');
    } finally {
        server.close();
    }
}

testApi().catch(err => {
    console.error('❌ Lỗi API test:', err);
    process.exit(1);
});

