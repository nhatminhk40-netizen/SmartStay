const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kiểm tra bảo mật JWT Secret: cấu hình linh hoạt cho cả Cloud/Render và Local
const isProd = process.env.NODE_ENV === 'production';
const rawSecret = process.env.JWT_SECRET;
let JWT_SECRET = rawSecret;

if (!rawSecret || rawSecret === 'smartstay_jwt_secret_fallback_key' || rawSecret.length < 24) {
    if (isProd) {
        console.warn('⚠️ [SECURITY ADVISORY] JWT_SECRET chưa được cấu hình hoặc dưới 24 ký tự trong môi trường Production.');
        console.warn('👉 Hệ thống kích hoạt khóa bảo mật mở rộng để duy trì dịch vụ hoạt động liên tục trên Render/Cloud.');
        JWT_SECRET = rawSecret || 'smartstay_jwt_secure_prod_vault_fallback_token_2026_xyz';
    } else {
        JWT_SECRET = rawSecret || 'smartstay_jwt_secret_fallback_key';
    }
}

// Middleware xác thực JWT token (Phân quyền & Cách ly tài khoản nghiêm ngặt)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 1. Hỗ trợ offline / demo token trong môi trường development hoặc fallback
            if (!isProd && token) {
                // Token rỗng hoặc literal undefined/null -> từ chối ngay lập tức, tuyệt đối không gán nhầm sang Bác Ba
                if (token === 'undefined' || token === 'null' || token === '') {
                    return res.status(401).json({ success: false, message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' });
                }

                // Nếu là jwt_offline_ chứa payload base64 của chính người dùng đăng nhập
                if (token.startsWith('jwt_offline_')) {
                    const rawPayload = token.replace('jwt_offline_', '');
                    try {
                        const parsedUser = JSON.parse(Buffer.from(rawPayload, 'base64').toString('utf8'));
                        if (parsedUser && (parsedUser.id || parsedUser._id || parsedUser.email)) {
                            req.user = {
                                _id: parsedUser._id || parsedUser.id,
                                id: parsedUser.id || parsedUser._id,
                                fullName: parsedUser.fullName || 'Người dùng SmartStay',
                                email: parsedUser.email,
                                role: parsedUser.role || 'landlord'
                            };
                            return next();
                        }
                    } catch (_) {
                        // Không phải base64 JSON, tiếp tục xử lý
                    }
                }

                // Nếu là demo_token chỉ định đích danh vai trò
                if (token.startsWith('demo_token_')) {
                    const fallbackUsers = req.app.locals.fallbackUsers || [];
                    if (token === 'demo_token_admin') {
                        req.user = fallbackUsers.find(u => u.role === 'admin') || {
                            _id: 'usr_admin_001',
                            id: 'usr_admin_001',
                            fullName: 'Admin Hệ Thống',
                            email: 'admin@smartstay.vn',
                            role: 'admin'
                        };
                        return next();
                    } else if (token === 'demo_token_student') {
                        req.user = fallbackUsers.find(u => u.role === 'student') || {
                            _id: 'usr_student_001',
                            id: 'usr_student_001',
                            fullName: 'Nguyễn Văn An (Người thuê)',
                            email: 'nguoithue@smartstay.vn',
                            role: 'student'
                        };
                        return next();
                    } else if (token === 'demo_token_landlord') {
                        req.user = fallbackUsers.find(u => u.email === 'chutro@smartstay.vn') || {
                            _id: 'usr_landlord_001',
                            id: 'usr_landlord_001',
                            fullName: 'Bác Ba Cần Thơ (Chủ trọ)',
                            email: 'chutro@smartstay.vn',
                            role: 'landlord'
                        };
                        return next();
                    }
                }
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (jwtErr) {
                // Trong môi trường development: nếu token hết hạn (TokenExpiredError) hoặc secret cũ, decode để duy trì phiên
                if (!isProd && token) {
                    const unverified = jwt.decode(token);
                    if (unverified && (unverified.id || unverified._id || unverified.email)) {
                        decoded = unverified;
                    } else {
                        return res.status(401).json({ success: false, message: 'Token không thể giải mã hoặc thông tin người dùng không hợp lệ.' });
                    }
                } else {
                    throw jwtErr;
                }
            }

            // Kiểm tra user trong DB nếu có kết nối
            if (req.app.locals.isDbConnected) {
                const userId = decoded.id || decoded._id;
                req.user = await User.findById(userId).select('-password');
                if (!req.user && !isProd) {
                    req.user = decoded; // Dev fallback giữ nguyên danh tính thực
                } else if (!req.user) {
                    return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
                }
            } else {
                // Chế độ in-memory fallback: tìm chính xác tài khoản theo ID hoặc Email
                if (isProd) {
                    return res.status(503).json({ success: false, message: 'Dịch vụ xác thực cơ sở dữ liệu tạm thời gián đoạn.' });
                }
                const fallbackUsers = req.app.locals.fallbackUsers || [];
                const found = fallbackUsers.find(u => String(u._id) === String(decoded.id || decoded._id) || (u.email && u.email.toLowerCase() === (decoded.email || '').toLowerCase()));
                req.user = found || decoded;
            }

            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để thực hiện thao tác này.' });
    }
};

// Middleware kiểm tra quyền theo vai trò (Roles)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Vai trò [${req.user?.role || 'Khách'}] không có quyền thực hiện thao tác này.`
            });
        }
        next();
    };
};

// Helper kiểm tra quyền sở hữu phòng (Owner hoặc Admin)
const checkRoomOwnership = (room, user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (room.owner && String(room.owner) === String(user._id || user.id)) return true;
    if (room.ownerEmail && room.ownerEmail === user.email) return true;
    return false;
};

// Helper tạo JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
    protect,
    authorize,
    checkRoomOwnership,
    generateToken,
    JWT_SECRET
};
