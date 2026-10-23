import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS & Security Headers
  const allowedOrigins = [
    'https://smart-stay-swart.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { to, otpCode, purpose = 'VERIFY_EMAIL', subject, htmlContent, textContent } = req.body || {};

  if (!to || !otpCode) {
    return res.status(400).json({ success: false, message: 'Thiếu email người nhận hoặc mã OTP' });
  }

  const gmailUser = (process.env.GMAIL_USER || 'smartstay06@gmail.com').trim();
  const gmailPass = (process.env.GMAIL_APP_PASS || 'ijgn pxtc hxxs mufc').replace(/\s+/g, '');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    let purposeText = 'xác thực tài khoản';
    let dynamicSubject = `[SmartStay] Mã OTP của bạn là: ${otpCode}`;
    if (purpose === 'REGISTER') {
      purposeText = 'hoàn tất đăng ký tài khoản';
      dynamicSubject = `[SmartStay] ${otpCode} là mã xác nhận đăng ký tài khoản`;
    } else if (purpose === 'RESET_PASSWORD') {
      purposeText = 'đặt lại mật khẩu đăng nhập';
      dynamicSubject = `[SmartStay] ${otpCode} là mã đặt lại mật khẩu`;
    }

    const defaultHtml = `
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        Mã xác nhận SmartStay của bạn: ${otpCode}. Có hiệu lực trong 1 phút (60 giây). Vui lòng không chia sẻ mã này.
      </div>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #ea580c; margin: 0 0 6px; font-size: 20px; font-weight: 800;">SmartStay Cần Thơ</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Nền tảng phòng trọ & bạn cùng phòng sinh viên Cần Thơ</p>
        <p style="color: #334155; font-size: 14px; margin: 0 0 16px;">Mã xác thực ${purposeText} của bạn là:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; padding: 18px; background: #fff7ed; text-align: center; border-radius: 12px; margin: 16px 0; border: 2px dashed #fb923c; font-family: monospace;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">Mã có hiệu lực trong vòng 1 phút (60 giây). Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <div style="padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 11.5px; color: #64748b; line-height: 1.5;">
          💡 Nếu thư nằm trong mục <strong>Thư rác (Spam)</strong>, bạn vui lòng bấm <strong>"Báo cáo không phải là thư rác" (Not Spam)</strong> để nhận thông báo phòng trọ nhanh nhất nhé!
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SmartStay Cần Thơ" <${gmailUser}>`,
      replyTo: gmailUser,
      to,
      subject: subject || dynamicSubject,
      text: textContent || `[SmartStay Cần Thơ] Mã xác thực của bạn là: ${otpCode}. Mã có hiệu lực trong 1 phút (60 giây). Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
      html: htmlContent || defaultHtml,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'SmartStay-System-v1.0'
      }
    });

    console.log(`[Vercel Serverless] Sent OTP email to ${to}, ID: ${info.messageId}`);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[Vercel Serverless] Error sending mail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
