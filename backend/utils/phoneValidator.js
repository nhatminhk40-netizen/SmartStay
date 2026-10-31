/**
 * Xác thực số điện thoại chuẩn viễn thông Việt Nam (Backend)
 */
function validateVietnamesePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Vui lòng cung cấp số điện thoại.' };
  }

  const cleanPhone = phone.trim().replace(/[\s.-]/g, '');

  if (!cleanPhone) {
    return { isValid: false, message: 'Số điện thoại không được để trống.' };
  }

  if (!/^\+?\d+$/.test(cleanPhone)) {
    return { isValid: false, message: 'Số điện thoại chỉ được chứa các chữ số (0-9).' };
  }

  let normalized = cleanPhone;
  if (cleanPhone.startsWith('+84')) {
    normalized = '0' + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith('84') && cleanPhone.length === 11) {
    normalized = '0' + cleanPhone.slice(2);
  }

  if (normalized.length !== 10) {
    if (normalized.length < 10) {
      return { isValid: false, message: `Số điện thoại chưa đủ 10 số (${normalized.length}/10 số).` };
    }
    return { isValid: false, message: `Số điện thoại vượt quá 10 số (${normalized.length}/10 số).` };
  }

  if (!normalized.startsWith('0')) {
    return { isValid: false, message: 'Số điện thoại Việt Nam phải bắt đầu bằng số 0 (hoặc +84).' };
  }

  if (/^(\d)\1{9}$/.test(normalized)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ (không chấp nhận số lặp ảo).' };
  }

  const prefix = normalized.slice(0, 2);
  const validMobilePrefixes = ['03', '05', '07', '08', '09'];

  if (!validMobilePrefixes.includes(prefix)) {
    if (prefix === '01') {
      return {
        isValid: false,
        message: 'Đầu số 01 đã được chuyển đổi sang 10 số (03, 07, 08) từ năm 2018. Vui lòng nhập số di động 10 số mới!'
      };
    }
    if (prefix === '02') {
      return {
        isValid: false,
        message: 'Đầu số 02 là số điện thoại bàn cố định. Vui lòng nhập số di động để nhận thông báo và liên hệ!'
      };
    }
    return {
      isValid: false,
      message: `Đầu số "${prefix}" không phải đầu số di động Việt Nam. Vui lòng sử dụng đầu số: 03, 05, 07, 08, 09.`
    };
  }

  const suffix = normalized.slice(2);
  if (/^(\d)\1{7}$/.test(suffix)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ (không chấp nhận số lặp ảo).' };
  }

  if (normalized === '0123456789' || normalized === '0987654321') {
    return { isValid: false, message: 'Vui lòng nhập số điện thoại thực tế của bạn, không dùng dãy số mẫu.' };
  }

  return { isValid: true, cleanPhone: normalized };
}

module.exports = {
  validateVietnamesePhone
};
