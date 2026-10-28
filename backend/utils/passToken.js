const crypto = require('crypto');

/**
 * Thời hạn hiệu lực của link xác nhận chủ trọ: 72 giờ
 */
const TOKEN_EXPIRY_HOURS = 72;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * Tạo token ngẫu nhiên an toàn bằng crypto.randomBytes(32)
 * Chỉ lưu HASH sha256 vào Database, trả token gốc cho người gửi
 * @returns {{ token: string, tokenHash: string, expiresAt: Date }}
 */
const generateConfirmationToken = () => {
    // 32 bytes = 64 ký tự hex ngẫu nhiên bảo mật cao
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    return {
        token: rawToken,
        tokenHash,
        expiresAt
    };
};

/**
 * Băm token bằng thuật toán SHA-256
 * @param {string} token 
 * @returns {string} tokenHash
 */
const hashToken = (token) => {
    if (!token || typeof token !== 'string') return '';
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
};

/**
 * Kiểm tra trạng thái hiệu lực của token xác nhận
 * @param {Object} landlordConfirmation 
 * @returns {{ isValid: boolean, reason?: string }}
 */
const verifyTokenValidity = (landlordConfirmation) => {
    if (!landlordConfirmation || !landlordConfirmation.tokenHash) {
        return { isValid: false, reason: 'Token không tồn tại hoặc đã bị vô hiệu hóa.' };
    }

    if (landlordConfirmation.confirmedAt || landlordConfirmation.rejectedAt) {
        return { isValid: false, reason: 'Link xác nhận này đã được xử lý trước đó và không còn hiệu lực (chỉ sử dụng một lần).' };
    }

    const now = new Date();
    if (landlordConfirmation.expiresAt && now > new Date(landlordConfirmation.expiresAt)) {
        return { isValid: false, reason: 'Link xác nhận đã hết hạn (quá thời hạn 72 giờ).' };
    }

    return { isValid: true };
};

module.exports = {
    TOKEN_EXPIRY_HOURS,
    TOKEN_EXPIRY_MS,
    generateConfirmationToken,
    hashToken,
    verifyTokenValidity
};
