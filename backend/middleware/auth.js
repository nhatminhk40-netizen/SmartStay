const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smartstay_jwt_secret_fallback_key';

// Middleware xác thực JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            // Kiểm tra user trong DB nếu có kết nối
            if (req.app.locals.isDbConnected) {
                req.user = await User.findById(decoded.id).select('-password');
                if (!req.user) {
                    // Nếu user không tồn tại trong DB nhưng token hợp lệ (vd: từ in-memory)
                    req.user = decoded;
                }
            } else {
                // Chế độ in-memory fallback
                const fallbackUsers = req.app.locals.fallbackUsers || [];
                const found = fallbackUsers.find(u => String(u._id) === String(decoded.id) || u.email === decoded.email);
                req.user = found || decoded;
            }

            return next();
        } catch (error) {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' });
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

// Helper tạo JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
    protect,
    authorize,
    generateToken,
    JWT_SECRET
};
