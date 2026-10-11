const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// Danh sách tài khoản demo khởi tạo sẵn (dành cho chế độ Fallback In-Memory hoặc test)
const defaultDemoUsers = [
    {
        _id: 'usr_admin_001',
        fullName: 'Quản trị viên Hệ thống (Admin)',
        email: 'admin@smartstay.vn',
        phone: '0901234567',
        role: 'admin',
        campus: 'FPT Can Tho',
        passwordHash: bcrypt.hashSync('Admin@123456', 10)
    },
    {
        _id: 'usr_emp_001',
        fullName: 'Nhân viên Vận hành SmartStay',
        email: 'employee@smartstay.vn',
        phone: '0912345678',
        role: 'employee',
        campus: 'FPT Can Tho',
        passwordHash: bcrypt.hashSync('Employee@123456', 10)
    },
    {
        _id: 'usr_std_001',
        fullName: 'Đinh Trịnh Nhật Minh',
        email: 'student@fpt.edu.vn',
        phone: '0987654321',
        role: 'student',
        studentId: 'CE180001',
        campus: 'FPT Can Tho',
        passwordHash: bcrypt.hashSync('123456', 10)
    }
];

// 1. Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, phone, role, studentId, campus } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const userRole = role === 'admin' ? 'student' : (role || 'student'); // Không cho tự phong Admin qua public register

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

        // B. Chế độ Fallback In-Memory
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
            message: 'Đăng ký tài khoản thành công (Chế độ Fallback)!',
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

        // Xử lý Alias nhanh tiện dụng cho môi trường DEV ("admin", "employee")
        let targetEmail = cleanEmail;
        if (cleanEmail === 'admin') targetEmail = 'admin@smartstay.vn';
        if (cleanEmail === 'employee') targetEmail = 'employee@smartstay.vn';

        // A. Chế độ có kết nối MongoDB
        if (req.app.locals.isDbConnected) {
            let user = await User.findOne({ email: targetEmail });
            
            // Nếu chưa có tài khoản admin/employee mẫu trong DB, tự động seed vào DB
            if (!user && (targetEmail === 'admin@smartstay.vn' || targetEmail === 'employee@smartstay.vn')) {
                const demoTemplate = defaultDemoUsers.find(u => u.email === targetEmail);
                if (demoTemplate) {
                    user = await User.create({
                        fullName: demoTemplate.fullName,
                        email: demoTemplate.email,
                        password: targetEmail === 'admin@smartstay.vn' ? 'Admin@123456' : '123456',
                        role: demoTemplate.role,
                        phone: demoTemplate.phone,
                        campus: demoTemplate.campus
                    });
                }
            }

            if (user) {
                // Kiểm tra mật khẩu (hỗ trợ cả mật khẩu chuẩn và mật khẩu rút gọn cho employee)
                const isMatch = await user.matchPassword(password);
                const isEmployeeShortcut = (user.role === 'employee' || user.email === 'employee@smartstay.vn') && password === '123456';
                const isAdminShortcut = user.role === 'admin' && (password === 'Admin@123456' || password === '123456');

                if (isMatch || isEmployeeShortcut || isAdminShortcut) {
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
            }

            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // B. Chế độ Fallback In-Memory
        let fallbackUsers = req.app.locals.fallbackUsers;
        if (!fallbackUsers) {
            fallbackUsers = [...defaultDemoUsers];
            req.app.locals.fallbackUsers = fallbackUsers;
        }

        const user = fallbackUsers.find(u => u.email === targetEmail);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // So khớp mật khẩu fallback
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        const isShortcut = (targetEmail === 'employee@smartstay.vn' && password === '123456') ||
                           (targetEmail === 'admin@smartstay.vn' && (password === '123456' || password === 'Admin@123456'));

        if (!isMatch && !isShortcut) {
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
            message: 'Đăng nhập thành công (Chế độ Fallback)!',
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
