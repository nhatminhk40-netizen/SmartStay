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

  const { to, otpCode, purpose = 'VERIFY_EMAIL', htmlContent, textContent } = req.body || {};

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
    if (purpose === 'REGISTER') purposeText = 'hoàn tất đăng ký tài khoản';
    else if (purpose === 'RESET_PASSWORD') purposeText = 'đặt lại mật khẩu đăng nhập';

    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ea580c; border-radius: 12px;">
        <h2 style="color: #ea580c; margin-bottom: 8px;">SmartStay Cần Thơ</h2>
        <p>Mã xác thực ${purposeText} của bạn là:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ea580c; padding: 16px; background: #fff7ed; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b;">Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SmartStay" <${gmailUser}>`,
      to,
      subject: 'Mã xác thực SmartStay',
      text: textContent || `Mã xác thực SmartStay của bạn là: ${otpCode}`,
      html: htmlContent || defaultHtml
    });

    console.log(`[Vercel Serverless] Sent OTP email to ${to}, ID: ${info.messageId}`);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[Vercel Serverless] Error sending mail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
