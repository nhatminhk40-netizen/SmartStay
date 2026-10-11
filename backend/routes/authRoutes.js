const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

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
        passwordHash: bcrypt.hashSync('Admin@123456', 10)
    },
    {
        _id: 'usr_emp_001',
        fullName: 'Nhân viên Vận hành SmartStay (Dev Mode)',
        email: 'employee@smartstay.vn',
        phone: '0912345678',
        role: 'employee',
        campus: 'FPT Can Tho',
        passwordHash: bcrypt.hashSync('Employee@123456', 10)
    }
];

// 1. Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, phone, role, studentId, campus } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        // Không cho phép đăng ký trực tiếp vai trò admin từ public API
        const userRole = (role === 'admin' || role === 'employee') ? 'student' : (role || 'student');

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
            }

            const newUser = await User.create({
                fullName,
                email: normalizedEmail,
                password,
                phone: phone || '',
                role: userRole,
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
                message: 'Đăng ký tài khoản thành công!',
                access_token: token,
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone,
                    campus: newUser.campus
                }
            });
        }

        // B. Chế độ Fallback In-Memory (chỉ cho phép khi dev)
        if (isProd) {
            return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng trong môi trường Production.' });
        }

        let fallbackUsers = req.app.locals.fallbackUsers;
        if (!fallbackUsers) {
            fallbackUsers = [...defaultDemoUsers];
            req.app.locals.fallbackUsers = fallbackUsers;
        }

        if (fallbackUsers.some(u => u.email === normalizedEmail)) {
            return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong bộ nhớ.' });
        }

        const newUser = {
            _id: `usr_${Date.now()}`,
            fullName,
            email: normalizedEmail,
            phone: phone || '',
            role: userRole,
            studentId: studentId || '',
            campus: campus || 'FPT Can Tho',
            passwordHash: await bcrypt.hash(password, 10),
            createdAt: new Date()
        };

        fallbackUsers.push(newUser);

        const token = generateToken({
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.fullName
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công (Chế độ Local Dev)!',
            access_token: token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                campus: newUser.campus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Đăng nhập tài khoản
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const cleanEmail = email.toLowerCase().trim();

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            const user = await User.findOne({ email: cleanEmail });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
            }

            // Nghiêm ngặt: Luôn so khớp mật khẩu bằng bcrypt, không dùng shortcut
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
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
                    campus: user.campus
                }
            });
        }

        // B. Chế độ Fallback In-Memory (Chỉ cho phép khi dev)
        if (isProd) {
            return res.status(503).json({ success: false, message: 'Dịch vụ xác thực cơ sở dữ liệu tạm thời gián đoạn.' });
        }

        let fallbackUsers = req.app.locals.fallbackUsers;
        if (!fallbackUsers) {
            fallbackUsers = [...defaultDemoUsers];
            req.app.locals.fallbackUsers = fallbackUsers;
        }

        const user = fallbackUsers.find(u => u.email === cleanEmail);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
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
                campus: user.campus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Đăng nhập / Đăng ký nhanh qua Google OAuth
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
                    campus: user.campus
                }
            });
        }

        // B. Chế độ Fallback In-Memory
        let fallbackUsers = req.app.locals.fallbackUsers;
        if (!fallbackUsers) {
            fallbackUsers = [...defaultDemoUsers];
            req.app.locals.fallbackUsers = fallbackUsers;
        }

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
                campus: detectedCampus,
                createdAt: new Date()
            };
            fallbackUsers.push(user);
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
                campus: user.campus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Lấy thông tin tài khoản hiện tại (Me)
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id || req.user.id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            phone: req.user.phone,
            campus: req.user.campus
        }
    });
});

module.exports = router;
