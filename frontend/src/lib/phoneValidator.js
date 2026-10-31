/**
 * Xác thực số điện thoại chuẩn viễn thông Việt Nam
 * - Bắt buộc 10 chữ số (hoặc 11 ký tự nếu bắt đầu bằng +84)
 * - Chỉ chấp nhận các đầu số di động chính thức tại Việt Nam: 03, 05, 07, 08, 09
 * - Chặn đầu số 01 (đã khai tử từ năm 2018), 02 (máy bàn cố định) và các đầu số không có thực
 * - Chặn các số điện thoại ảo, số spam lặp (0900000000, 0888888888, 0000000000)
 */
export function validateVietnamesePhone(phone) {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, message: "Vui lòng nhập số điện thoại." };
  }

  const trimmed = phone.trim();
  const cleanPhone = trimmed.replace(/[\s.-]/g, "");

  if (!cleanPhone) {
    return { isValid: false, message: "Số điện thoại không được để trống." };
  }

  // Kiểm tra chỉ chứa ký tự số (và tối đa 1 dấu + ở đầu)
  if (!/^\+?\d+$/.test(cleanPhone)) {
    return { isValid: false, message: "Số điện thoại chỉ được chứa các chữ số (0-9)." };
  }

  // Chuẩn hóa về đầu số 0
  let normalized = cleanPhone;
  if (cleanPhone.startsWith("+84")) {
    normalized = "0" + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith("84") && cleanPhone.length === 11) {
    normalized = "0" + cleanPhone.slice(2);
  }

  // Kiểm tra độ dài chính xác 10 chữ số
  if (normalized.length !== 10) {
    if (normalized.length < 10) {
      return { isValid: false, message: `Số điện thoại chưa đủ 10 số (${normalized.length}/10 số).` };
    }
    return { isValid: false, message: `Số điện thoại vượt quá 10 số (${normalized.length}/10 số).` };
  }

  // Phải bắt đầu bằng số 0
  if (!normalized.startsWith("0")) {
    return { isValid: false, message: "Số điện thoại Việt Nam phải bắt đầu bằng số 0 (hoặc +84)." };
  }

  // Chặn trường hợp 10 số giống hệt nhau (VD: 0000000000)
  if (/^(\d)\1{9}$/.test(normalized)) {
    return { isValid: false, message: "Số điện thoại không hợp lệ (không chấp nhận số lặp ảo)." };
  }

  // Kiểm tra đầu số di động
  const prefix = normalized.slice(0, 2);
  const validMobilePrefixes = ["03", "05", "07", "08", "09"];

  if (!validMobilePrefixes.includes(prefix)) {
    if (prefix === "01") {
      return {
        isValid: false,
        message: "Đầu số 01 đã được chuyển đổi sang 10 số (03, 07, 08) từ năm 2018. Vui lòng nhập số di động 10 số mới!"
      };
    }
    if (prefix === "02") {
      return {
        isValid: false,
        message: "Đầu số 02 là số điện thoại bàn cố định. Vui lòng nhập số di động để nhận thông báo và liên hệ!"
      };
    }
    return {
      isValid: false,
      message: `Đầu số "${prefix}" không phải đầu số di động Việt Nam. Vui lòng sử dụng đầu số: 03, 05, 07, 08, 09.`
    };
  }

  // Chặn số lặp ảo phần đuôi (VD: 0900000000, 0888888888, 0333333333, 0911111111)
  const suffix = normalized.slice(2);
  if (/^(\d)\1{7}$/.test(suffix)) {
    return { isValid: false, message: "Số điện thoại không hợp lệ (không chấp nhận số lặp ảo)." };
  }

  // Chặn dãy số test ảo điển hình
  if (normalized === "0123456789" || normalized === "0987654321") {
    return { isValid: false, message: "Vui lòng nhập số điện thoại thực tế của bạn, không dùng dãy số mẫu." };
  }

  return { isValid: true, cleanPhone: normalized };
}

export default validateVietnamesePhone;
