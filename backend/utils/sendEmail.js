const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');

/**
 * Khởi tạo transporter Nodemailer với dịch vụ Gmail
 * Cấu hình port 587 STARTTLS + IPv4 first để tránh timeout trên hạ tầng cloud (Render/Docker)
 */
const createTransporter = () => {
    const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
    const pass = process.env.GMAIL_APP_PASS ? process.env.GMAIL_APP_PASS.replace(/\s+/g, '') : '';

    if (!user || !pass) {
        console.warn('⚠️ [sendEmail] GMAIL_USER hoặc GMAIL_APP_PASS chưa được thiết lập đầy đủ');
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true cho port 465, false cho port 587 (dùng STARTTLS)
        auth: {
            user,
            pass
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};

/**
 * Gửi email chứa mã xác thực OTP
 * Hỗ trợ 3 phương thức:
 * 1. Brevo REST API (HTTPS port 443 - Tối ưu 100% cho Render Free không bị chặn cổng)
 * 2. Resend REST API (HTTPS port 443)
 * 3. Nodemailer Gmail SMTP (cho môi trường local / máy chủ mở cổng 587)
 *
 * @param {Object} params
 * @param {string} params.to - Địa chỉ email người nhận
 * @param {string} params.otpCode - Mã OTP 6 chữ số
 * @param {string} [params.purpose] - Mục đích (REGISTER, RESET_PASSWORD, VERIFY_EMAIL)
 * @returns {Promise<Object>} kết quả gửi thư
 */
const sendOtpEmail = async ({ to, otpCode, purpose = 'VERIFY_EMAIL' }) => {
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

    // 1. ƯU TIÊN 1: Vercel Mail Relay (Gửi Gmail SMTP từ Vercel qua HTTPS port 443 - không bị Render chặn cổng)
    try {
        const vercelRelayUrl = process.env.VERCEL_RELAY_URL || 'https://smart-stay-swart.vercel.app/api/send-otp';
        console.log(`🚀 [sendEmail] Đang gửi OTP cho ${to} qua Vercel Relay (${vercelRelayUrl})...`);
        const relayRes = await fetch(vercelRelayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, otpCode, purpose, htmlContent, textContent })
        });
        const relayData = await relayRes.json();
        if (relayRes.ok && relayData.success) {
            console.log('✅ [Vercel Relay] Đã gửi email Gmail thành công! MessageId:', relayData.messageId);
            return { messageId: relayData.messageId };
        } else {
            console.warn('⚠️ [Vercel Relay] Không thành công:', relayData?.message || relayData);
        }
    } catch (relayErr) {
        console.warn('⚠️ [Vercel Relay] Lỗi gọi relay:', relayErr.message);
    }

    // 2. ƯU TIÊN 2: Brevo REST API (nếu có cấu hình)
    if (process.env.BREVO_API_KEY) {
        console.log(`🚀 [sendEmail] Gửi OTP đến ${to} qua Brevo HTTPS API...`);
        const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'hotro@smartstay.vn';
        const senderName = process.env.BREVO_SENDER_NAME || 'SmartStay Cần Thơ';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY.trim(),
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email: to }],
                subject: 'Mã xác thực SmartStay',
                htmlContent,
                textContent
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Brevo API (${response.status}): ${data.message || JSON.stringify(data)}`);
        }
        console.log('✅ [Brevo API] Gửi email thành công. MessageId:', data.messageId);
        return { messageId: data.messageId };
    }

    // 2. ƯU TIÊN 2: Resend API (HTTPS port 443)
    if (process.env.RESEND_API_KEY) {
        console.log(`🚀 [sendEmail] Gửi OTP đến ${to} qua Resend HTTPS API...`);
        const fromEmail = process.env.RESEND_FROM || 'SmartStay <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject: 'Mã xác thực SmartStay',
                html: htmlContent,
                text: textContent
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Resend API: ${data.message || JSON.stringify(data)}`);
        }
        console.log('✅ [Resend API] Gửi email thành công. ID:', data.id);
        return { messageId: data.id };
    }

    // 3. Nodemailer Gmail SMTP (Phù hợp máy local hoặc máy chủ không chặn cổng SMTP)
    const transporter = createTransporter();
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
