/**
 * Module lọc & kiểm duyệt thông tin cá nhân (SĐT, liên hệ riêng tư)
 * Yêu cầu: "các thông tin cá nhân như sđt này kia thì phải mở qua zalo mới có thể tiếp tục nhắn"
 */

// Regex nhận diện số điện thoại Việt Nam (10-11 số, định dạng liền hoặc có dấu chấm/cách/gạch ngang)
const VIETNAM_PHONE_REGEX = /(?:(?:\+84|0)[3|5|7|8|9](?:[\s.-]?[0-9]){8})/g;
const GENERIC_DIGITS_REGEX = /(?:\b\d{9,11}\b)/g;
const SPACED_DIGITS_REGEX = /(?:0[\s.-]?[35789](?:[\s.-]?\d){8})/g;

// Từ khóa liên hệ cá nhân
const CONTACT_KEYWORDS_REGEX = /(?:sđt|sdt|số\s*điện\s*thoại|số\s*đt|zalo\s*mình|inbox\s*zalo|kb\s*zalo|kết\s*bạn\s*zalo|gọi\s*qua\s*số)/i;

/**
 * Phân tích và kiểm tra xem nội dung tin nhắn có chứa thông tin cá nhân / SĐT hay không
 * @param {string} text 
 * @returns {Object} { containsSensitiveInfo, sensitiveType, detectedPhone, cleanPhone, maskedText, notice }
 */
function inspectSensitiveContent(text = '') {
    if (!text || typeof text !== 'string') {
        return {
            containsSensitiveInfo: false,
            sensitiveType: 'none',
            detectedPhone: '',
            cleanPhone: '',
            maskedText: text || '',
            notice: ''
        };
    }

    let detectedPhone = '';
    let cleanPhone = '';
    let containsSensitiveInfo = false;
    let sensitiveType = 'none';

    // 1. Tìm số điện thoại chuẩn VN hoặc dạng cách nhau
    const phoneMatches = text.match(SPACED_DIGITS_REGEX) || text.match(VIETNAM_PHONE_REGEX) || text.match(GENERIC_DIGITS_REGEX);

    if (phoneMatches && phoneMatches.length > 0) {
        detectedPhone = phoneMatches[0];
        cleanPhone = detectedPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('84')) {
            cleanPhone = '0' + cleanPhone.slice(2);
        }
        containsSensitiveInfo = true;
        sensitiveType = 'phone';
    } else if (CONTACT_KEYWORDS_REGEX.test(text)) {
        containsSensitiveInfo = true;
        sensitiveType = 'contact_keywords';
    }

    // 2. Tạo nội dung đã che (Masked text)
    let maskedText = text;
    if (containsSensitiveInfo) {
        if (detectedPhone) {
            maskedText = text.replace(detectedPhone, '[Đã ẩn SĐT - Vui lòng mở qua Zalo]');
        } else {
            maskedText = text;
        }
    }

    return {
        containsSensitiveInfo,
        sensitiveType,
        detectedPhone,
        cleanPhone,
        maskedText,
        redirectZalo: containsSensitiveInfo,
        notice: containsSensitiveInfo 
            ? 'Tin nhắn chứa thông tin liên hệ cá nhân (SĐT). Nhằm bảo vệ an toàn & quyền riêng tư, hệ thống yêu cầu mở qua Zalo để tiếp tục trao đổi.'
            : ''
    };
}

module.exports = {
    inspectSensitiveContent,
    VIETNAM_PHONE_REGEX
};

