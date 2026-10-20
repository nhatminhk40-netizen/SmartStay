const nodemailer = require('nodemailer');

/**
 * Khởi tạo transporter Nodemailer với dịch vụ Gmail
 * Đọc GMAIL_USER và GMAIL_APP_PASS từ process.env (Bảo mật: Tuyệt đối không log credentials)
 */
const createTransporter = () => {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASS;

    if (!user || !pass) {
        console.warn('⚠️ [sendEmail] GMAIL_USER hoặc GMAIL_APP_PASS chưa được thiết lập đầy đủ trong backend/.env');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        }
    });
};

/**
 * Gửi email chứa mã xác thực OTP
 * @param {Object} params
 * @param {string} params.to - Địa chỉ email người nhận
 * @param {string} params.otpCode - Mã OTP 6 chữ số
 * @param {string} [params.purpose] - Mục đích (REGISTER, RESET_PASSWORD, VERIFY_EMAIL)
 * @returns {Promise<Object>} kết quả gửi thư
 */
const sendOtpEmail = async ({ to, otpCode, purpose = 'VERIFY_EMAIL' }) => {
    const transporter = createTransporter();

    let purposeText = 'xác thực tài khoản';
    if (purpose === 'REGISTER') {
        purposeText = 'hoàn tất đăng ký tài khoản';
    } else if (purpose === 'RESET_PASSWORD') {
        purposeText = 'đặt lại mật khẩu đăng nhập';
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực SmartStay</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #ea580c; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                SmartStay
              </h1>
              <p style="margin: 4px 0 0; color: #ffedd5; font-size: 13px;">
                Nền tảng phòng trọ & bạn cùng phòng sinh viên Cần Thơ
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
                Mã xác thực tài khoản
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                Bạn đang thực hiện yêu cầu <strong>${purposeText}</strong> trên hệ thống SmartStay. Vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #fff7ed; border: 2px dashed #fb923c; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ea580c; display: inline-block; font-family: 'Courier New', Courier, monospace;">
                  ${otpCode}
                </span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #c2410c; font-weight: 600;">
                  Mã có hiệu lực trong vòng 5 phút (hết hạn sau 5 phút)
                </p>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 16px; margin: 20px 0 24px; font-size: 13px; color: #475569; line-height: 1.5;">
                <p style="margin: 0; font-weight: 600; color: #334155;">⚠️ Lưu ý bảo mật:</p>
                <ul style="margin: 6px 0 0; padding-left: 18px;">
                  <li>Tuyệt đối <strong>KHÔNG</strong> chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ SmartStay.</li>
                  <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo vệ tài khoản.</li>
                </ul>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Trân trọng,<br>
                <strong>Đội ngũ vận hành SmartStay Cần Thơ</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              Email được gửi tự động từ hệ thống SmartStay. Vui lòng không trả lời trực tiếp email này.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Mã xác thực SmartStay

Bạn đang thực hiện yêu cầu ${purposeText} trên hệ thống SmartStay.
Mã xác thực của bạn là: ${otpCode}

Mã có hiệu lực trong vòng 5 phút.
LƯU Ý: Tuyệt đối KHÔNG chia sẻ mã này cho bất kỳ ai.

Đội ngũ vận hành SmartStay
    `.trim();

    const mailOptions = {
        from: `"SmartStay" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Mã xác thực SmartStay',
        text: textContent,
        html: htmlContent
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOtpEmail
};
