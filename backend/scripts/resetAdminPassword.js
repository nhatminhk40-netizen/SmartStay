/**
 * Script Đặt lại Mật khẩu Quản trị viên (Admin Password Console Recovery)
 * Sử dụng an toàn trực tiếp trên máy chủ / Terminal nội bộ, không phụ thuộc vào Email.
 * 
 * Cách dùng:
 *   node backend/scripts/resetAdminPassword.js <Mật_Khẩu_Mới> [email_admin_tùy_chọn]
 * 
 * Ví dụ:
 *   node backend/scripts/resetAdminPassword.js Admin@2026StrongPass!
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const FALLBACK_USERS_FILE = path.join(__dirname, '../fallback_users.json');

async function main() {
    const args = process.argv.slice(2);
    const newPassword = args[0];
    const targetEmail = (args[1] || 'admin@smartstay.vn').toLowerCase().trim();

    if (!newPassword) {
        console.log('\n❌ Lỗi: Bạn chưa cung cấp mật khẩu mới!');
        console.log('📌 Hướng dẫn sử dụng:');
        console.log('   node backend/scripts/resetAdminPassword.js <Mật_Khẩu_Mới> [email_admin]');
        console.log('   Ví dụ: node backend/scripts/resetAdminPassword.js Admin@2026SmartStay!\n');
        process.exit(1);
    }

    if (newPassword.length < 8) {
        console.log('\n❌ Lỗi: Mật khẩu Quản trị viên (Admin) phải chứa ít nhất 8 ký tự để đảm bảo an toàn!\n');
        process.exit(1);
    }

    console.log(`\n🔐 Bắt đầu thiết lập lại mật khẩu cho tài khoản Quản trị viên: [${targetEmail}]...`);

    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    let updatedMongo = false;
    let updatedFallback = false;

    // 1. Cập nhật trong MongoDB nếu có kết nối
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (mongoUri) {
        try {
            console.log('⏳ Đang kết nối tới MongoDB...');
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
            const User = require('../models/User');

            let adminUser = await User.findOne({ email: targetEmail });
            if (adminUser) {
                adminUser.password = newPassword;
                adminUser.role = 'admin';
                await adminUser.save();
                updatedMongo = true;
                console.log(`✅ Đã cập nhật mật khẩu Admin trong CSDL MongoDB thành công!`);
            } else {
                console.log(`ℹ️ Không tìm thấy tài khoản [${targetEmail}] trong MongoDB, sẽ tạo mới nếu cần.`);
                await User.create({
                    fullName: 'Quản trị viên Hệ thống',
                    email: targetEmail,
                    password: newPassword,
                    role: 'admin',
                    phone: '0901234567',
                    phoneVerified: true,
                    isEmailVerified: true,
                    verificationStatus: 'APPROVED'
                });
                updatedMongo = true;
                console.log(`✅ Đã tạo mới tài khoản Admin trong MongoDB với mật khẩu mới!`);
            }
        } catch (err) {
            console.log(`⚠️ Không thể kết nối tới MongoDB (${err.message}). Bỏ qua bước MongoDB.`);
        } finally {
            try { await mongoose.disconnect(); } catch (_) {}
        }
    }

    // 2. Cập nhật trong Fallback file (fallback_users.json)
    try {
        let users = [];
        if (fs.existsSync(FALLBACK_USERS_FILE)) {
            users = JSON.parse(fs.readFileSync(FALLBACK_USERS_FILE, 'utf8'));
        }
        let found = false;
        users = users.map(u => {
            if (u.email === targetEmail || (u.role === 'admin' && !args[1])) {
                found = true;
                return {
                    ...u,
                    role: 'admin',
                    passwordHash: newHash,
                    updatedAt: new Date()
                };
            }
            return u;
        });

        if (!found) {
            users.unshift({
                _id: 'usr_admin_001',
                fullName: 'Quản trị viên Hệ thống (Master Admin)',
                email: targetEmail,
                phone: '0901234567',
                role: 'admin',
                campus: 'FPT Can Tho',
                phoneVerified: true,
                isEmailVerified: true,
                verificationStatus: 'APPROVED',
                passwordHash: newHash,
                createdAt: new Date()
            });
        }

        fs.writeFileSync(FALLBACK_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
        updatedFallback = true;
        console.log(`✅ Đã đồng bộ mật khẩu Admin vào tệp lưu trữ nội bộ (fallback_users.json)!`);
    } catch (fbErr) {
        console.error('❌ Lỗi cập nhật fallback_users.json:', fbErr.message);
    }

    if (updatedMongo || updatedFallback) {
        console.log(`\n🎉 THÀNH CÔNG: Mật khẩu mới cho Quản trị viên [${targetEmail}] đã được cập nhật!`);
        console.log(`👉 Bạn có thể đăng nhập ngay tại http://localhost:5173/login với mật khẩu vừa đặt.`);
    } else {
        console.log(`\n❌ Thất bại: Không thể cập nhật mật khẩu cho Admin.`);
    }
    console.log('');
}

main().catch(console.error);

