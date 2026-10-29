/**
 * Bộ công cụ Bảo mật Chuyên sâu cho Quản trị viên (Admin Security Suite)
 * 1. Xác thực 2 bước TOTP (Google Authenticator / Authy)
 * 2. Mã PIN Quản trị cấp 2 (Admin Master PIN)
 * 3. Chống dò quét Brute-Force (Tự động khóa 30 phút sau 5 lần sai)
 * 4. Giới hạn IP truy cập (Admin IP Whitelist)
 */

const { generateSecret, generateURI, verifySync } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

// ── 1. QUẢN LÝ IP WHITELIST ──
function getClientIp(req) {
    let ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket?.remoteAddress || 
             req.ip || 
             '127.0.0.1';

    if (typeof ip === 'string' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    // Chuẩn hóa IPv6 loopback và IPv4-mapped IPv6
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    } else if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }
    return ip;
}

function isIpWhitelisted(clientIp) {
    const whitelistConfig = process.env.ADMIN_IP_WHITELIST || '*';
    if (whitelistConfig === '*' || !whitelistConfig.trim()) {
        return true; // Cho phép mọi IP nếu để wildcard *
    }

    const allowedIps = whitelistConfig.split(',').map(s => s.trim().toLowerCase());
    const normalizedClient = String(clientIp).toLowerCase().trim();

    return allowedIps.some(allowed => {
        if (allowed === normalizedClient) return true;
        if (allowed.endsWith('.*')) {
            const prefix = allowed.slice(0, -2);
            return normalizedClient.startsWith(prefix);
        }
        return false;
    });
}

const adminIpWhitelistMiddleware = (req, res, next) => {
    const clientIp = getClientIp(req);
    if (!isIpWhitelisted(clientIp)) {
        return res.status(403).json({
            success: false,
            message: `Địa chỉ IP [${clientIp}] không nằm trong danh sách được phép truy cập phân hệ Quản trị viên (Admin IP Whitelist).`
        });
    }
    next();
};

// ── 2. MÃ PIN QUẢN TRỊ CẤP 2 (ADMIN MASTER PIN) ──
function getAdminMasterPin() {
    return String(process.env.ADMIN_SECURITY_PIN || '839201').trim();
}

const verifyAdminPinMiddleware = (req, res, next) => {
    const enteredPin = req.headers['x-admin-pin'] || req.body?.adminPin || req.query?.adminPin;
    const requiredPin = getAdminMasterPin();

    if (!enteredPin || String(enteredPin).trim() !== requiredPin) {
        return res.status(403).json({
            success: false,
            requireAdminPin: true,
            message: 'Mã PIN Quản trị cấp 2 không chính xác. Thao tác nhạy cảm bị từ chối vì lý do an toàn!'
        });
    }
    next();
};

// ── 3. CHỐNG DÒ QUÉT BRUTE-FORCE VÀ KHÓA TỰ ĐỘNG ──
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS, 10) || 5;
const LOCKOUT_MINUTES = parseInt(process.env.ADMIN_LOCKOUT_MINUTES, 10) || 30;

function checkAdminLockout(user) {
    if (!user) return { isLocked: false };
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
        const remainingMs = new Date(user.lockUntil).getTime() - Date.now();
        const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        return {
            isLocked: true,
            remainingMinutes,
            message: `Tài khoản Quản trị viên đang bị tạm khóa an toàn trong ${remainingMinutes} phút do đã nhập sai mật khẩu quá ${MAX_LOGIN_ATTEMPTS} lần liên tiếp (Cơ chế chống dò quét Brute-Force).`
        };
    }
    return { isLocked: false };
}

async function recordFailedAdminLogin(user, onSave) {
    if (!user) return;
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
    if (typeof onSave === 'function') {
        await onSave(user);
    }
    return {
        attempts: user.loginAttempts,
        isLocked: user.loginAttempts >= MAX_LOGIN_ATTEMPTS,
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - user.loginAttempts)
    };
}

async function recordSuccessfulAdminLogin(user, onSave) {
    if (!user) return;
    user.loginAttempts = 0;
    user.lockUntil = null;
    if (typeof onSave === 'function') {
        await onSave(user);
    }
}

// ── 4. XÁC THỰC 2 BƯỚC TOTP (GOOGLE AUTHENTICATOR / AUTHY) ──
async function generateTotpSetup(userEmail = 'admin@smartstay.vn') {
    const secret = generateSecret();
    const otpauthURI = generateURI({
        secret,
        label: userEmail,
        issuer: 'SmartStay Portal'
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauthURI, {
        width: 250,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
    });

    // Tạo 5 mã khôi phục dự phòng (Recovery Codes)
    const backupCodes = Array.from({ length: 5 }, () => {
        const rand = crypto.randomInt(10000000, 99999999).toString();
        return `${rand.slice(0, 4)}-${rand.slice(4)}`;
    });

    return {
        secret,
        otpauthURI,
        qrCodeUrl,
        backupCodes
    };
}

function verifyTotpCode(code, secret, backupCodes = []) {
    if (!code || !secret) return { valid: false };
    const cleanCode = String(code).trim().replace(/\s+/g, '');

    // 1. Kiểm tra mã 6 số thời gian thực từ app Google Authenticator
    try {
        const res = verifySync({ token: cleanCode, secret });
        if (res && res.valid) {
            return { valid: true, isBackupCode: false };
        }
    } catch (_) {}

    // 2. Kiểm tra mã dự phòng 8 số (Backup Recovery Code)
    if (Array.isArray(backupCodes) && backupCodes.length > 0) {
        const matchedIndex = backupCodes.findIndex(bc => bc.replace('-', '') === cleanCode.replace('-', ''));
        if (matchedIndex !== -1) {
            return { valid: true, isBackupCode: true, matchedIndex };
        }
    }

    return { valid: false };
}

module.exports = {
    getClientIp,
    isIpWhitelisted,
    adminIpWhitelistMiddleware,
    getAdminMasterPin,
    verifyAdminPinMiddleware,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_MINUTES,
    checkAdminLockout,
    recordFailedAdminLogin,
    recordSuccessfulAdminLogin,
    generateTotpSetup,
    verifyTotpCode
};

