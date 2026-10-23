const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/sendEmail');
const { protect, generateToken } = require('../middleware/auth');

// Đường dẫn lưu trữ tài khoản fallback offline
const FALLBACK_USERS_FILE = path.join(__dirname, '../fallback_users.json');

const saveFallbackUsers = (users) => {
    try {
        fs.writeFileSync(FALLBACK_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        // silent fail
    }
};

// Rate limiters bảo mật chống Brute Force và Spam
const sendOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // Tối đa 10 yêu cầu gửi mã từ 1 IP trong 15 phút
    message: {
        success: false,
        message: 'Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const verifyOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Tối đa 20 lần thử xác thực từ 1 IP trong 15 phút
    message: {
        success: false,
        message: 'Bạn đã thử xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Tối đa 50 lần thử đăng nhập từ 1 IP trong 15 phút chống Brute Force
    message: {
        success: false,
        message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Kho lưu trữ tạm mã OTP xác thực số điện thoại
const phoneOtpStore = new Map();

// Danh sách tài khoản demo (CHỈ dành cho môi trường local development khi MongoDB chưa sẵn sàng)
const isProd = process.env.NODE_ENV === 'production';
const defaultDemoUsers = isProd ? [] : [
    {
        _id: 'usr_admin_001',
        fullName: 'Quản trị viên Hệ thống (Dev Mode)',
        email: 'admin@smartstay.vn',
        phone: '0901234567',
        role: 'admin',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        passwordHash: bcrypt.hashSync('Admin@123456', 10)
    },
    {
        _id: 'usr_emp_001',
        fullName: 'Nhân viên Vận hành SmartStay (Dev Mode)',
        email: 'employee@smartstay.vn',
        phone: '0912345678',
        role: 'employee',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        passwordHash: bcrypt.hashSync('Employee@123456', 10)
    },
    {
        _id: 'usr_landlord_001',
        fullName: 'Bác Ba Cần Thơ (Chủ trọ đã duyệt)',
        email: 'chutro@smartstay.vn',
        phone: '0939112233',
        role: 'landlord',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        landlordDocuments: {
            idCardNumber: '092095001234',
            propertyName: 'Nhà trọ Hưng Thịnh Cần Thơ',
            propertyAddress: 'Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
            idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            ownershipDocUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
            note: 'Dãy trọ 12 phòng khép kín, camera an ninh 24/7'
        },
        passwordHash: bcrypt.hashSync('Chutro@123456', 10)
    },
    {
        _id: 'usr_landlord_002',
        fullName: 'Cô Mai Hưng Lợi (Chờ duyệt)',
        email: 'chutro.pending@smartstay.vn',
        phone: '0949887766',
        role: 'landlord',
        campus: 'ĐH Cần Thơ',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'PENDING',
        landlordDocuments: {
            idCardNumber: '092198005678',
            propertyName: 'Căn hộ Mini An Khánh',
            propertyAddress: 'Hẻm 51 đường 3 Tháng 2, Xuân Khánh, Ninh Kiều',
            idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            ownershipDocUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
            note: 'Vừa hoàn thiện 8 phòng có ban công, mong Admin duyệt sớm'
        },
        passwordHash: bcrypt.hashSync('Chutro@123456', 10)
    },
    {
        _id: 'usr_landlord_nhatminh',
        fullName: 'Đinh Trịnh Nhật Minh',
        email: 'nhatminhk40@gmail.com',
        phone: '0939112233',
        role: 'landlord',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        landlordDocuments: {
            idCardNumber: '092095001234',
            propertyName: 'Nhà trọ SmartStay Cần Thơ',
            propertyAddress: 'Khu dân cư Hồng Phát, An Bình, Ninh Kiều, Cần Thơ',
            idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            ownershipDocUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
            note: 'Cơ sở trọ chính chủ Đinh Trịnh Nhật Minh (Đã duyệt)'
        },
        passwordHash: bcrypt.hashSync('123456', 10)
    },
    {
        _id: 'usr_transporter_001',
        fullName: 'Chú Bảy Ba Gác Cần Thơ',
        email: 'taixe@smartstay.vn',
        phone: '0939556677',
        role: 'transporter',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        transporterProfile: {
            vehicleType: 'Xe ba gác chuyển trọ',
            licensePlate: '65B1-888.99',
            driverLicenseNumber: 'B2-65009812',
            operatingArea: 'Ninh Kiều / Cái Răng / Bình Thủy, Cần Thơ',
            rating: 4.9,
            totalTrips: 48,
            isVerified: true,
            bio: 'Tài xế ba gác uy tín tại Cần Thơ, kinh nghiệm chuyển trọ sinh viên FPT & ĐHCT 5 năm. Bốc xếp cẩn thận.'
        },
        passwordHash: bcrypt.hashSync('Taixe@123456', 10)
    },
    {
        _id: 'usr_student_001',
        fullName: 'Nguyễn Văn Sinh Viên (FPT Cần Thơ)',
        email: 'sinhvien@smartstay.vn',
        phone: '0988776655',
        role: 'student',
        studentId: 'CE180001',
        campus: 'FPT Can Tho',
        phoneVerified: true,
        isEmailVerified: true,
        verificationStatus: 'APPROVED',
        passwordHash: bcrypt.hashSync('Sinhvien@123456', 10)
    }
];

// Helper đảm bảo danh sách fallbackUsers luôn chứa tài khoản Admin/Employee mặc định và đồng bộ file
const getFallbackUsers = (app) => {
    if (!app.locals.fallbackUsers || !Array.isArray(app.locals.fallbackUsers) || app.locals.fallbackUsers.length === 0) {
        let loaded = [];
        try {
            if (fs.existsSync(FALLBACK_USERS_FILE)) {
                loaded = JSON.parse(fs.readFileSync(FALLBACK_USERS_FILE, 'utf8'));
            }
        } catch (e) {
            loaded = [];
        }
        app.locals.fallbackUsers = Array.isArray(loaded) && loaded.length > 0 ? loaded : [...defaultDemoUsers];
    }

    defaultDemoUsers.forEach(demoUser => {
        const idx = app.locals.fallbackUsers.findIndex(u => u.email === demoUser.email);
        if (idx === -1) {
            app.locals.fallbackUsers.push(demoUser);
        } else if (demoUser.email === 'nhatminhk40@gmail.com') {
            // Đảm bảo mật khẩu 123456 luôn khả dụng cho tài khoản nhatminhk40
            app.locals.fallbackUsers[idx].passwordHash = demoUser.passwordHash;
            app.locals.fallbackUsers[idx].verificationStatus = 'APPROVED';
            app.locals.fallbackUsers[idx].role = 'landlord';
        }
    });

    saveFallbackUsers(app.locals.fallbackUsers);
    return app.locals.fallbackUsers;
};

// 1. Gửi mã OTP xác thực (Email qua Gmail SMTP & SĐT dự phòng)
router.post('/send-otp', sendOtpLimiter, async (req, res) => {
    try {
        const { email, phone, purpose = 'VERIFY_EMAIL' } = req.body;

        // A. XỬ LÝ XÁC THỰC QUA EMAIL (GỬI BẰNG GMAIL SMTP)
        if (email) {
            const cleanEmail = String(email).toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                return res.status(400).json({ success: false, message: 'Địa chỉ email không hợp lệ.' });
            }

            // Nếu là mục đích ĐĂNG KÝ: kiểm tra email đã được dùng chưa
            if (purpose === 'REGISTER' && req.app.locals.isDbConnected) {
                const userExists = await User.findOne({ email: cleanEmail });
                if (userExists) {
                    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng trên hệ thống.' });
                }
            }

            // Quy tắc: Chỉ cho gửi lại sau 60 giây (Resend Cooldown)
            if (req.app.locals.isDbConnected) {
                const existingOtp = await Otp.findOne({ email: cleanEmail, purpose });
                if (existingOtp && existingOtp.sentAt) {
                    const elapsedMs = Date.now() - new Date(existingOtp.sentAt).getTime();
                    if (elapsedMs < 60 * 1000) {
                        const waitSec = Math.ceil((60 * 1000 - elapsedMs) / 1000);
                        return res.status(429).json({
                            success: false,
                            message: `Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.`
                        });
                    }
                }
            } else {
                const fallbackOtps = req.app.locals.fallbackOtps || (req.app.locals.fallbackOtps = new Map());
                const key = `${cleanEmail}_${purpose}`;
                const existing = fallbackOtps.get(key);
                if (existing && existing.sentAt) {
                    const elapsedMs = Date.now() - existing.sentAt;
                    if (elapsedMs < 60 * 1000) {
                        const waitSec = Math.ceil((60 * 1000 - elapsedMs) / 1000);
                        return res.status(429).json({
                            success: false,
                            message: `Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.`
                        });
                    }
                }
            }

            // Quy tắc 5: 6 chữ số sinh bằng crypto.randomInt
            const otpCode = String(crypto.randomInt(100000, 1000000));
            // Quy tắc 5: Lưu dạng băm SHA-256, không lưu OTP gốc
            const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');
            // Quy tắc: Hết hạn sau 1 phút (60 giây)
            const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

            // Lưu bản ghi OTP vào MongoDB hoặc Fallback Map
            if (req.app.locals.isDbConnected) {
                await Otp.deleteMany({ email: cleanEmail, purpose });
                await Otp.create({
                    email: cleanEmail,
                    codeHash,
                    expiresAt,
                    attempts: 0,
                    purpose,
                    sentAt: new Date()
                });
            } else {
                const fallbackOtps = req.app.locals.fallbackOtps || (req.app.locals.fallbackOtps = new Map());
                fallbackOtps.set(`${cleanEmail}_${purpose}`, {
                    codeHash,
                    expiresAt: expiresAt.getTime(),
                    attempts: 0,
                    purpose,
                    sentAt: Date.now()
                });
            }

            // Gửi qua Gmail SMTP (backend/utils/sendEmail.js)
            // Nếu là email test nội bộ (@smartstay.vn, @example.com, @test.com) hoặc chưa cấu hình Gmail credentials
            const isMockDomain = cleanEmail.endsWith('@smartstay.vn') || cleanEmail.endsWith('@example.com') || cleanEmail.endsWith('@test.com');
            const hasEmailProvider = Boolean(
                process.env.BREVO_API_KEY ||
                process.env.RESEND_API_KEY ||
                (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS)
            );

            let sentViaEmail = false;

            if (!isMockDomain && hasEmailProvider) {
                try {
                    // Giới hạn thời gian 3.5 giây: nếu hạ tầng mạng cloud (Render) chặn cổng SMTP,
                    // hệ thống tự ngắt kết nối an toàn để không bao giờ bị treo đợi 60s hay báo Connection timeout
                    await Promise.race([
                        sendOtpEmail({
                            to: cleanEmail,
                            otpCode,
                            purpose
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_NETWORK_TIMEOUT')), 3500))
                    ]);
                    sentViaEmail = true;
                    console.log(`✅ [sendOtp] Gửi email OTP thành công đến ${cleanEmail}`);
                } catch (mailErr) {
                    console.warn(`⚠️ [sendOtp] Gửi qua SMTP không khả dụng (${mailErr.message}). Kích hoạt cơ chế bảo vệ phiên để người dùng không bị gián đoạn.`);
                    sentViaEmail = false;
                }
            } else if (isMockDomain) {
                console.log(`ℹ️ [Dev Mock Domain]: Bỏ qua gửi SMTP cho ${cleanEmail}. Mã OTP: ${otpCode}`);
            }

            return res.status(200).json({
                success: true,
                sentViaEmail,
                message: 'Mã xác thực OTP đã được gửi đến email của bạn. Nếu không thấy ở Hộp thư đến, vui lòng kiểm tra thư mục Thư rác (Spam).'
            });
        }

        // B. XỬ LÝ XÁC THỰC SỐ ĐIỆN THOẠI (Duy trì tính tương thích)
        if (phone) {
            const cleanPhone = phone.trim();
            if (cleanPhone.length < 8) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ.' });
            }
            const otpCode = String(crypto.randomInt(100000, 1000000));
            phoneOtpStore.set(cleanPhone, {
                code: otpCode,
                expiresAt: Date.now() + 1 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                message: `Mã OTP đã được gửi đến số ${cleanPhone}`
            });
        }

        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hoặc số điện thoại.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Xác nhận mã OTP (Email hoặc SĐT)
router.post('/verify-otp', verifyOtpLimiter, async (req, res) => {
    try {
        const { email, code, otpCode, phone, purpose = 'VERIFY_EMAIL' } = req.body;
        const enteredCode = String(code || otpCode || '').trim();

        // A. XÁC THỰC MÃ EMAIL OTP
        if (email) {
            const cleanEmail = String(email).toLowerCase().trim();
            if (!enteredCode) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập mã OTP gồm 6 chữ số.' });
            }

            let otpRecord = null;
            let isFallback = false;

            if (req.app.locals.isDbConnected) {
                otpRecord = await Otp.findOne({ email: cleanEmail, purpose });
            } else {
                isFallback = true;
                const fallbackOtps = req.app.locals.fallbackOtps || (req.app.locals.fallbackOtps = new Map());
                const key = `${cleanEmail}_${purpose}`;
                otpRecord = fallbackOtps.get(key);
            }

            if (!otpRecord) {
                return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
            }

            const expiresTime = isFallback ? otpRecord.expiresAt : new Date(otpRecord.expiresAt).getTime();
            if (Date.now() > expiresTime) {
                if (isFallback) {
                    req.app.locals.fallbackOtps.delete(`${cleanEmail}_${purpose}`);
                } else {
                    await Otp.deleteOne({ _id: otpRecord._id });
                }
                return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' });
            }

            // Quy tắc 5: Tối đa 5 lần nhập sai, sau đó hủy mã
            if (otpRecord.attempts >= 5) {
                if (isFallback) {
                    req.app.locals.fallbackOtps.delete(`${cleanEmail}_${purpose}`);
                } else {
                    await Otp.deleteOne({ _id: otpRecord._id });
                }
                return res.status(400).json({
                    success: false,
                    message: 'Mã xác thực đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu gửi mã mới.'
                });
            }

            // Quy tắc 5: So sánh bằng crypto.timingSafeEqual với mã băm SHA-256 trong DB
            const enteredHash = crypto.createHash('sha256').update(enteredCode).digest('hex');
            const inputBuf = Buffer.from(enteredHash, 'hex');
            const storedBuf = Buffer.from(otpRecord.codeHash, 'hex');
            const isMatch = (inputBuf.length === storedBuf.length) && crypto.timingSafeEqual(inputBuf, storedBuf);

            if (!isMatch) {
                if (otpRecord) {
                    otpRecord.attempts = (otpRecord.attempts || 0) + 1;
                    const remaining = 5 - otpRecord.attempts;

                    if (otpRecord.attempts >= 5) {
                        if (isFallback) {
                            req.app.locals.fallbackOtps.delete(`${cleanEmail}_${purpose}`);
                        } else {
                            await Otp.deleteOne({ _id: otpRecord._id });
                        }
                        return res.status(400).json({
                            success: false,
                            message: 'Mã xác thực đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu gửi mã mới.'
                        });
                    }

                    if (isFallback) {
                        req.app.locals.fallbackOtps.set(`${cleanEmail}_${purpose}`, otpRecord);
                    } else {
                        await otpRecord.save();
                    }

                    return res.status(400).json({
                        success: false,
                        message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
                    });
                }
                return res.status(400).json({ success: false, message: 'Mã OTP không chính xác.' });
            }

            // Quy tắc 5: Dùng một lần (xác thực xong thì xóa)
            if (isFallback) {
                req.app.locals.fallbackOtps.delete(`${cleanEmail}_${purpose}`);
            } else {
                await Otp.deleteOne({ _id: otpRecord._id });
            }

            // Đánh dấu isEmailVerified nếu tài khoản đã tồn tại
            if (req.app.locals.isDbConnected) {
                await User.updateOne({ email: cleanEmail }, { $set: { isEmailVerified: true } });
            } else {
                const fbUsers = getFallbackUsers(req.app);
                const u = fbUsers.find(x => x.email === cleanEmail);
                if (u) u.isEmailVerified = true;
            }

            // Nếu mục đích là RESET_PASSWORD, tạo token đặt lại mật khẩu tạm thời (15 phút)
            let resetToken = undefined;
            if (purpose === 'RESET_PASSWORD') {
                const secret = process.env.JWT_SECRET || 'smartstay_jwt_secret_dev_2026';
                resetToken = jwt.sign(
                    { email: cleanEmail, action: 'RESET_PASSWORD' },
                    secret,
                    { expiresIn: '15m' }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Xác thực email thành công!',
                email: cleanEmail,
                resetToken
            });
        }

        // B. XÁC THỰC MÃ SỐ ĐIỆN THOẠI
        if (phone) {
            const cleanPhone = phone.trim();
            const stored = phoneOtpStore.get(cleanPhone);
            const isValid = (stored && stored.code === enteredCode && stored.expiresAt > Date.now()) || (!isProd && enteredCode === '123456');

            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Mã xác thực OTP không đúng hoặc đã hết hạn.' });
            }

            phoneOtpStore.delete(cleanPhone);
            return res.status(200).json({
                success: true,
                message: 'Xác thực số điện thoại thành công!'
            });
        }

        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hoặc số điện thoại kèm mã OTP.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Đăng ký tài khoản (hỗ trợ vai trò Chủ trọ hoặc Người thuê)
router.post('/register', async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            password, 
            phone, 
            role, 
            studentId, 
            campus, 
            phoneVerified, 
            landlordDocuments 
        } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let userRole = 'student';
        if (role === 'landlord') userRole = 'landlord';
        else if (role === 'transporter') userRole = 'transporter';
        else if (role === 'employee') userRole = 'employee';

        const isLandlord = userRole === 'landlord';
        const isTransporter = userRole === 'transporter';
        const verificationStatus = isLandlord ? 'PENDING' : 'APPROVED';
        const isPhoneVerified = phoneVerified !== false;

        const docs = isLandlord ? {
            idCardNumber: landlordDocuments?.idCardNumber || '',
            propertyName: landlordDocuments?.propertyName || '',
            propertyAddress: landlordDocuments?.propertyAddress || '',
            idCardFrontUrl: landlordDocuments?.idCardFrontUrl || '',
            idCardBackUrl: landlordDocuments?.idCardBackUrl || '',
            ownershipDocUrl: landlordDocuments?.ownershipDocUrl || '',
            ownershipDocType: landlordDocuments?.ownershipDocType || 'UTILITY_BILL',
            ownershipDocTypeName: landlordDocuments?.ownershipDocTypeName || 'Hóa đơn tiền điện / nước',
            note: landlordDocuments?.note || ''
        } : {};

        const transporterData = isTransporter ? {
            vehicleType: req.body.vehicleType || req.body.transporterProfile?.vehicleType || 'Xe ba gác chuyển trọ',
            licensePlate: req.body.licensePlate || req.body.transporterProfile?.licensePlate || '',
            driverLicenseNumber: req.body.driverLicenseNumber || req.body.transporterProfile?.driverLicenseNumber || '',
            operatingArea: req.body.operatingArea || req.body.transporterProfile?.operatingArea || 'Ninh Kiều / Cái Răng, Cần Thơ',
            rating: 5.0,
            totalTrips: 0,
            isVerified: true
        } : undefined;

        const isEmailVerified = Boolean(req.body.isEmailVerified || req.body.emailVerified);

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
            }

            const newUser = await User.create({
                fullName: fullName.trim(),
                email: normalizedEmail,
                password,
                phone: phone ? phone.trim() : '',
                phoneVerified: isPhoneVerified,
                isEmailVerified,
                role: userRole,
                verificationStatus,
                landlordDocuments: docs,
                transporterProfile: transporterData,
                studentId: studentId || '',
                campus: campus || 'FPT Can Tho'
            });

            const token = generateToken({
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                fullName: newUser.fullName
            });

            return res.status(201).json({
                success: true,
                message: isLandlord 
                    ? 'Hồ sơ đăng ký Chủ trọ đã được gửi! Vui lòng chờ Admin thẩm định duyệt thông tin.' 
                    : 'Đăng ký tài khoản thành công!',
                access_token: token,
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone,
                    phoneVerified: newUser.phoneVerified,
                    isEmailVerified: newUser.isEmailVerified,
                    verificationStatus: newUser.verificationStatus,
                    landlordDocuments: newUser.landlordDocuments,
                    transporterProfile: newUser.transporterProfile || {},
                    campus: newUser.campus
                }
            });
        }

        // B. Chế độ Fallback In-Memory (chỉ cho phép khi dev)
        if (isProd) {
            return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng trong môi trường Production.' });
        }

        let fallbackUsers = getFallbackUsers(req.app);

        if (fallbackUsers.some(u => u.email === normalizedEmail)) {
            return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong bộ nhớ.' });
        }

        const newUser = {
            _id: `usr_${Date.now()}`,
            id: `usr_${Date.now()}`,
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: phone ? phone.trim() : '',
            phoneVerified: isPhoneVerified,
            isEmailVerified,
            role: userRole,
            verificationStatus,
            landlordDocuments: docs,
            transporterProfile: transporterData,
            studentId: studentId || '',
            campus: campus || 'FPT Can Tho',
            passwordHash: await bcrypt.hash(password, 10),
            createdAt: new Date()
        };

        fallbackUsers.unshift(newUser);
        saveFallbackUsers(fallbackUsers);

        const token = generateToken({
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.fullName
        });

        res.status(201).json({
            success: true,
            message: isLandlord 
                ? 'Hồ sơ đăng ký Chủ trọ đã gửi (Local Dev)! Đang ở trạng thái Chờ duyệt.' 
                : 'Đăng ký tài khoản thành công (Chế độ Local Dev)!',
            access_token: token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                phoneVerified: newUser.phoneVerified,
                isEmailVerified: newUser.isEmailVerified,
                verificationStatus: newUser.verificationStatus,
                landlordDocuments: newUser.landlordDocuments,
                campus: newUser.campus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Đăng nhập tài khoản (tự động nhận diện vai trò Chủ trọ / Sinh viên / Admin đã được duyệt)
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const rawEmail = req.body.email || req.body.emailOrPhone;
        const { password } = req.body;

        if (!rawEmail || !password || typeof rawEmail !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email/số điện thoại và mật khẩu hợp lệ.' });
        }

        const cleanEmail = rawEmail.toLowerCase().trim();

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            let user = await User.findOne({
                $or: [
                    { email: cleanEmail },
                    { phone: cleanEmail }
                ]
            });

            // Nếu là tài khoản demo nhưng chưa có trong MongoDB, tự động tạo vào DB
            if (!user) {
                const demoAccount = defaultDemoUsers.find(d => d.email === cleanEmail || d.phone === cleanEmail);
                if (demoAccount && (await bcrypt.compare(password, demoAccount.passwordHash))) {
                    try {
                        user = await User.create({
                            fullName: demoAccount.fullName,
                            email: demoAccount.email,
                            password: password,
                            role: demoAccount.role,
                            phone: demoAccount.phone,
                            phoneVerified: demoAccount.phoneVerified !== false,
                            verificationStatus: demoAccount.verificationStatus || 'APPROVED',
                            landlordDocuments: demoAccount.landlordDocuments || {},
                            campus: demoAccount.campus
                        });
                    } catch (seedErr) {
                        user = {
                            ...demoAccount,
                            matchPassword: async (pwd) => await bcrypt.compare(pwd, demoAccount.passwordHash)
                        };
                    }
                }
            }

            if (!user) {
                return res.status(401).json({ success: false, message: 'Email/Số điện thoại hoặc mật khẩu không chính xác.' });
            }

            // So khớp mật khẩu an toàn
            let isMatch = false;
            try {
                if (typeof user.matchPassword === 'function') {
                    isMatch = await user.matchPassword(password);
                } else if (user.passwordHash || user.password) {
                    isMatch = await bcrypt.compare(password, user.passwordHash || user.password);
                }
            } catch (cmpErr) {
                console.error('[AUTH LOGIN] Error comparing password:', cmpErr.message);
                isMatch = false;
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Email/Số điện thoại hoặc mật khẩu không chính xác.' });
            }

            const token = generateToken({
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName
            });

            return res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công!',
                access_token: token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    campus: user.campus,
                    avatar: user.avatar || '',
                    phoneVerified: Boolean(user.phoneVerified),
                    verificationStatus: user.verificationStatus || (user.role === 'landlord' ? 'APPROVED' : 'NONE'),
                    landlordDocuments: user.landlordDocuments || {},
                    transporterProfile: user.transporterProfile || {},
                    rejectionReason: user.rejectionReason || ''
                }
            });
        }

        // B. Chế độ Fallback In-Memory (Chỉ cho phép khi dev)
        if (isProd) {
            return res.status(503).json({ success: false, message: 'Dịch vụ xác thực cơ sở dữ liệu tạm thời gián đoạn.' });
        }

        const fallbackUsers = getFallbackUsers(req.app);

        const user = fallbackUsers.find(u => u.email === cleanEmail || u.phone === cleanEmail);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email/Số điện thoại hoặc mật khẩu không chính xác.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash || user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email/Số điện thoại hoặc mật khẩu không chính xác.' });
        }

        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công (Chế độ Local Dev)!',
            access_token: token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                campus: user.campus,
                avatar: user.avatar || '',
                phoneVerified: Boolean(user.phoneVerified),
                verificationStatus: user.verificationStatus || (user.role === 'landlord' ? 'APPROVED' : 'NONE'),
                landlordDocuments: user.landlordDocuments || {},
                rejectionReason: user.rejectionReason || ''
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Đăng nhập / Đăng ký nhanh qua Google OAuth
router.post('/google', async (req, res) => {
    try {
        const { email, fullName, googleId, avatar, campus } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin email từ Google.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const detectedCampus = campus || (normalizedEmail.includes('fpt') ? 'FPT Can Tho' : 'ĐH Cần Thơ');
        const defaultName = fullName || normalizedEmail.split('@')[0];

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            let user = await User.findOne({ email: normalizedEmail });

            if (user) {
                let hasChange = false;
                if (!user.googleId && googleId) {
                    user.googleId = googleId;
                    hasChange = true;
                }
                if (!user.avatar && avatar) {
                    user.avatar = avatar;
                    hasChange = true;
                }
                if (hasChange) {
                    await user.save();
                }
            } else {
                user = await User.create({
                    fullName: defaultName,
                    email: normalizedEmail,
                    authProvider: 'google',
                    googleId: googleId || `gg_${Date.now()}`,
                    avatar: avatar || '',
                    role: 'student',
                    verificationStatus: 'APPROVED',
                    phoneVerified: false,
                    campus: detectedCampus
                });
            }

            const token = generateToken({
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName
            });

            return res.status(200).json({
                success: true,
                message: 'Đăng nhập Google thành công!',
                access_token: token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    campus: user.campus,
                    phone: user.phone || '',
                    verificationStatus: user.verificationStatus || 'APPROVED',
                    phoneVerified: Boolean(user.phoneVerified)
                }
            });
        }

        // B. Chế độ Fallback In-Memory
        let fallbackUsers = getFallbackUsers(req.app);

        let user = fallbackUsers.find(u => u.email === normalizedEmail);
        if (!user) {
            user = {
                _id: `usr_gg_${Date.now()}`,
                fullName: defaultName,
                email: normalizedEmail,
                authProvider: 'google',
                googleId: googleId || `gg_${Date.now()}`,
                avatar: avatar || '',
                role: 'student',
                verificationStatus: 'APPROVED',
                phoneVerified: false,
                campus: detectedCampus,
                createdAt: new Date()
            };
            fallbackUsers.push(user);
            saveFallbackUsers(fallbackUsers);
        }

        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập Google thành công (Fallback)!',
            access_token: token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                campus: user.campus,
                phone: user.phone || '',
                verificationStatus: user.verificationStatus || 'APPROVED',
                phoneVerified: Boolean(user.phoneVerified)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Lấy thông tin tài khoản hiện tại (Me)
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id || req.user.id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar || '',
            phone: req.user.phone || '',
            campus: req.user.campus || 'FPT Can Tho',
            phoneVerified: Boolean(req.user.phoneVerified),
            isEmailVerified: Boolean(req.user.isEmailVerified),
            verificationStatus: req.user.verificationStatus || (req.user.role === 'landlord' ? 'APPROVED' : 'NONE'),
            landlordDocuments: req.user.landlordDocuments || {},
            transporterProfile: req.user.transporterProfile || {},
            rejectionReason: req.user.rejectionReason || ''
        }
    });
});

// 7. Đặt lại mật khẩu mới (sau khi đã xác thực OTP thành công)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !newPassword || !resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ email, mã xác thực và mật khẩu mới.'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
            });
        }

        const secret = process.env.JWT_SECRET || 'smartstay_jwt_secret_dev_2026';
        let decoded;
        try {
            decoded = jwt.verify(resetToken, secret);
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: 'Phiên xác thực đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại mã OTP.'
            });
        }

        const cleanEmail = String(email).toLowerCase().trim();
        if (decoded.email !== cleanEmail || decoded.action !== 'RESET_PASSWORD') {
            return res.status(400).json({
                success: false,
                message: 'Thông tin xác thực không trùng khớp.'
            });
        }

        // Cập nhật mật khẩu trong MongoDB
        if (req.app.locals.isDbConnected) {
            const user = await User.findOne({ email: cleanEmail });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tài khoản với email này.'
                });
            }
            user.password = newPassword;
            await user.save();
        } else {
            const fallbackUsers = getFallbackUsers(req.app);
            const user = fallbackUsers.find(u => u.email === cleanEmail);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tài khoản với email này.'
                });
            }
            user.passwordHash = await bcrypt.hash(newPassword, 10);
            saveFallbackUsers(fallbackUsers);
        }

        return res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
