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
    let dynamicSubject = `[SmartStay] Mã OTP của bạn là: ${otpCode}`;

    if (purpose === 'REGISTER') {
        purposeText = 'hoàn tất đăng ký tài khoản';
        dynamicSubject = `[SmartStay] ${otpCode} là mã xác nhận đăng ký tài khoản`;
    } else if (purpose === 'RESET_PASSWORD') {
        purposeText = 'đặt lại mật khẩu đăng nhập';
        dynamicSubject = `[SmartStay] ${otpCode} là mã đặt lại mật khẩu`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dynamicSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <!-- Preheader preview text (chống spam & hiển thị ngay trên thanh thông báo) -->
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Mã xác nhận SmartStay của bạn: ${otpCode}. Mã có hiệu lực trong vòng 1 phút (60 giây). Vui lòng không chia sẻ mã này.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #ea580c; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                SmartStay Cần Thơ
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
                  Mã có hiệu lực trong vòng 1 phút (hết hạn sau 60 giây)
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

          <!-- Footer & Anti-Spam Tip -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 8px; color: #475569;">
                💡 <strong>Mẹo nhỏ:</strong> Nếu thư này nằm trong mục <em>Thư rác (Spam)</em> hoặc <em>Quảng cáo</em>, bạn vui lòng bấm <strong>"Báo cáo không phải là thư rác" (Not Spam)</strong> để các thông báo sau này luôn đến Hộp thư đến nhé!
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Email được gửi tự động từ hệ thống SmartStay Cần Thơ. Vui lòng không trả lời trực tiếp email này.
              </p>
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
[SmartStay Cần Thơ]
Bạn đang thực hiện yêu cầu ${purposeText} trên hệ thống SmartStay.
Mã xác thực của bạn là: ${otpCode}

Mã có hiệu lực trong vòng 1 phút (60 giây).
LƯU Ý: Tuyệt đối KHÔNG chia sẻ mã này cho bất kỳ ai.

💡 Mẹo: Nếu thư rơi vào mục Thư rác, vui lòng đánh dấu "Không phải spam" để nhận email nhanh nhất.

Đội ngũ vận hành SmartStay Cần Thơ
    `.trim();

    // 1. ƯU TIÊN 1: Vercel Mail Relay (Gửi Gmail SMTP từ Vercel qua HTTPS port 443 - không bị Render chặn cổng)
    try {
        const vercelRelayUrl = process.env.VERCEL_RELAY_URL || 'https://smart-stay-swart.vercel.app/api/send-otp';
        console.log(`🚀 [sendEmail] Đang gửi OTP cho ${to} qua Vercel Relay (${vercelRelayUrl})...`);
        const relayRes = await fetch(vercelRelayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, otpCode, purpose, subject: dynamicSubject, htmlContent, textContent })
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
                subject: dynamicSubject,
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

    // 3. ƯU TIÊN 3: Resend API (HTTPS port 443)
    if (process.env.RESEND_API_KEY) {
        console.log(`🚀 [sendEmail] Gửi OTP đến ${to} qua Resend HTTPS API...`);
        const fromEmail = process.env.RESEND_FROM || 'SmartStay Cần Thơ <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject: dynamicSubject,
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

    // 4. Nodemailer Gmail SMTP (Phù hợp máy local hoặc máy chủ không chặn cổng SMTP)
    const transporter = createTransporter();
    const mailSender = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : 'smartstay06@gmail.com';
    const mailOptions = {
        from: `"SmartStay Cần Thơ" <${mailSender}>`,
        replyTo: mailSender,
        to,
        subject: dynamicSubject,
        text: textContent,
        html: htmlContent,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
            'X-Mailer': 'SmartStay-System-v1.0'
        }
    };

    return await transporter.sendMail(mailOptions);
};

/**
 * Gửi email link xác nhận Pass phòng đến Chủ trọ
 * @param {Object} params
 * @param {string} params.to - Email chủ trọ
 * @param {string} params.landlordName - Tên chủ trọ
 * @param {string} params.tenantName - Tên người đang thuê (người pass)
 * @param {string} params.roomTitle - Tên phòng / địa chỉ
 * @param {string} params.confirmLink - Link xác nhận /xac-nhan-pass/:token
 * @param {number} params.depositAmount - Tiền cọc đã đóng
 * @param {number} params.monthlyRent - Tiền thuê mỗi tháng
 * @param {string} [params.moveInDate] - Ngày muốn chuyển
 * @returns {Promise<Object>}
 */
const sendLandlordPassEmail = async ({
    to,
    landlordName,
    tenantName,
    roomTitle,
    confirmLink,
    depositAmount,
    monthlyRent,
    moveInDate
}) => {
    if (!to) {
        console.log('ℹ️ [sendLandlordPassEmail] Không có email chủ trọ, bỏ qua bước gửi mail.');
        return { success: false, reason: 'no_email' };
    }

    const subject = `[SmartStay] Yêu cầu xác nhận chuyển nhượng cọc phòng: ${roomTitle}`;
    const textContent = `Kính gửi ${landlordName || 'Chủ trọ'},\n\nSinh viên ${tenantName || 'đang thuê'} đã gửi yêu cầu chuyển nhượng (pass) phòng trọ "${roomTitle}" trên nền tảng SmartStay Cần Thơ.\nTiền cọc hiện tại: ${Number(depositAmount || 0).toLocaleString()}đ.\nGiá thuê: ${Number(monthlyRent || 0).toLocaleString()}đ/tháng.\nNgày muốn chuyển: ${moveInDate || 'Linh hoạt'}.\n\nVui lòng truy cập đường dẫn sau để xem chi tiết và xác nhận hoặc từ chối (link có hiệu lực 72 giờ và chỉ sử dụng 1 lần):\n${confirmLink}\n\nTrân trọng,\nĐội ngũ SmartStay Cần Thơ`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdfbf7; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #f4ebd9; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: #f97316; padding: 28px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
            .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
            .body { padding: 28px 24px; }
            .info-card { background: #fdfbf7; border: 1px solid #f4ebd9; border-radius: 14px; padding: 18px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
            .row:last-child { border-bottom: none; }
            .label { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; text-align: right; }
            .btn-wrap { text-align: center; margin: 28px 0 20px; }
            .btn { display: inline-block; background: #f97316; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
            .notice { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin-top: 16px; }
            .footer { padding: 18px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafaf9; border-top: 1px solid #f1f5f9; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 SmartStay Cần Thơ</h1>
                <p>Yêu cầu xác nhận chuyển nhượng phòng từ người thuê</p>
            </div>
            <div class="body">
                <p>Kính gửi <strong>${landlordName || 'Chủ trọ'}</strong>,</p>
                <p>Sinh viên <strong>${tenantName || 'đang thuê'}</strong> vừa tạo yêu cầu chuyển nhượng (pass) phòng trọ trên hệ thống SmartStay. Để đảm bảo quyền lợi và bảo vệ an toàn cho cả hai bên, tin pass phòng sẽ chỉ được công khai sau khi có sự đồng ý của Quý chủ trọ.</p>
                
                <div class="info-card">
                    <div class="row">
                        <span class="label">Phòng / Địa chỉ:</span>
                        <span class="val">${roomTitle}</span>
                    </div>
                    <div class="row">
                        <span class="label">Người thuê hiện tại:</span>
                        <span class="val">${tenantName || 'Sinh viên'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Tiền cọc đã đóng:</span>
                        <span class="val" style="color: #059669;">${Number(depositAmount || 0).toLocaleString()} VNĐ</span>
                    </div>
                    <div class="row">
                        <span class="label">Giá thuê mỗi tháng:</span>
                        <span class="val" style="color: #f97316;">${Number(monthlyRent || 0).toLocaleString()} VNĐ</span>
                    </div>
                    <div class="row">
                        <span class="label">Ngày muốn chuyển:</span>
                        <span class="val">${moveInDate || 'Linh hoạt'}</span>
                    </div>
                </div>

                <div class="btn-wrap">
                    <a href="${confirmLink}" class="btn" target="_blank">Xem Chi Tiết & Xác Nhận</a>
                </div>

                <p class="notice">
                    🔒 <strong>Lưu ý bảo mật:</strong> Đường dẫn này được mã hóa bảo mật, có hạn dùng trong <strong>72 giờ</strong> và chỉ sử dụng <strong>một lần duy nhất</strong>. Nếu Quý chủ trọ không đồng ý, có thể bấm "Từ chối" kèm lý do.
                </p>
            </div>
            <div class="footer">
                © SmartStay Cần Thơ — Nền tảng thuê trọ & chuyển nhượng an toàn cho sinh viên.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        // Gửi qua Brevo API nếu có key
        if (process.env.BREVO_API_KEY) {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY.trim(),
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'SmartStay Cần Thơ', email: process.env.BREVO_SENDER_EMAIL || 'smartstay06@gmail.com' },
                    to: [{ email: to, name: landlordName || 'Chủ trọ' }],
                    subject,
                    htmlContent,
                    textContent
                })
            });
            if (response.ok) return { success: true };
        }

        // Gửi qua Resend API nếu có key
        if (process.env.RESEND_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || 'SmartStay Cần Thơ <onboarding@resend.dev>',
                    to: [to],
                    subject,
                    html: htmlContent,
                    text: textContent
                })
            });
            if (response.ok) return { success: true };
        }

        // Gửi qua Nodemailer SMTP nếu có thông tin gmail
        const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
        const pass = process.env.GMAIL_APP_PASS ? process.env.GMAIL_APP_PASS.replace(/\s+/g, '') : '';
        if (user && pass) {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"SmartStay Cần Thơ" <${user}>`,
                to,
                subject,
                text: textContent,
                html: htmlContent
            });
            return { success: true };
        }

        console.log(`📧 [MOCK EMAIL] Đã sinh link duyệt cho chủ trọ (${to}): ${confirmLink}`);
        return { success: true, mocked: true };
    } catch (err) {
        console.warn('⚠️ Lỗi khi gửi email chủ trọ:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = {
    sendOtpEmail,
    sendLandlordPassEmail
};

