const assert = require('assert');
const express = require('express');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_2026';

const app = express();
app.use(express.json());
app.locals.isDbConnected = false;

const authRoutes = require('../routes/authRoutes');
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

function requestJson(port, path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(resData) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resData });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    console.log(`🧪 Bắt đầu kiểm thử Bảo mật Quên mật khẩu & Tài khoản Admin (cổng ${port})...\n`);

    try {
        // Test 1: Nhập email chưa đăng ký tài khoản -> Bị từ chối ngay lập tức, không gửi OTP
        console.log('--- Test 1: Gửi OTP quên mật khẩu với email KHÔNG tồn tại ---');
        const res1 = await requestJson(port, '/api/auth/send-otp', {
            email: 'email_chua_dang_ky_123456@gmail.com',
            purpose: 'RESET_PASSWORD'
        });

        console.log('Status:', res1.status, '| Response:', res1.body.message);
        assert.strictEqual(res1.status, 404, 'Phải trả về status 404');
        assert.strictEqual(res1.body.success, false, 'success phải là false');
        assert(res1.body.message.includes('chưa được đăng ký'), 'Thông báo phải nêu rõ email chưa đăng ký');
        console.log('✅ Test 1 thành công: Email không tồn tại bị chặn 100%, không gửi OTP!\n');

        // Test 2: Cố tình yêu cầu reset mật khẩu cho tài khoản Admin -> Bị chặn 403
        console.log('--- Test 2: Thử reset mật khẩu cho tài khoản Quản trị viên (Admin) ---');
        const res2 = await requestJson(port, '/api/auth/send-otp', {
            email: 'admin@smartstay.vn',
            purpose: 'RESET_PASSWORD'
        });

        console.log('Status:', res2.status, '| Response:', res2.body.message);
        assert.strictEqual(res2.status, 403, 'Phải trả về status 403');
        assert.strictEqual(res2.body.success, false, 'success phải là false');
        assert(res2.body.message.includes('Quản trị viên (Admin) được bảo vệ đặc biệt'), 'Thông báo phải chặn bảo vệ Admin');
        console.log('✅ Test 2 thành công: Tài khoản Admin được bảo vệ đặc biệt, không thể reset qua web công cộng!\n');

        // Test 3: Email hợp lệ đã đăng ký (ví dụ tài khoản demo chủ trọ chutro@smartstay.vn)
        console.log('--- Test 3: Gửi OTP quên mật khẩu cho tài khoản HỢP LỆ đã đăng ký ---');
        const res3 = await requestJson(port, '/api/auth/send-otp', {
            email: 'chutro@smartstay.vn',
            purpose: 'RESET_PASSWORD'
        });

        console.log('Status:', res3.status, '| Response:', res3.body.message);
        assert.strictEqual(res3.status, 200, 'Phải trả về status 200');
        assert.strictEqual(res3.body.success, true, 'success phải là true');
        console.log('✅ Test 3 thành công: Email chính xác đã đăng ký được gửi mã OTP thành công!\n');

        console.log('🎉 TẤT CẢ CÁC BÀI TEST BẢO MẬT QUÊN MẬT KHẨU & ADMIN ĐÃ ĐẠT 100%!');
    } catch (err) {
        console.error('❌ Test thất bại:', err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
