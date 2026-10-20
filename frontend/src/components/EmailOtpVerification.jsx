import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Component xác thực mã OTP qua Email gồm 2 bước:
 * Bước 1: Nhập email cần xác thực
 * Bước 2: Nhập mã OTP 6 chữ số (với nút Gửi lại mã có đếm ngược 60s)
 * 
 * @param {Object} props
 * @param {string} [props.purpose='VERIFY_EMAIL'] - REGISTER | RESET_PASSWORD | VERIFY_EMAIL
 * @param {string} [props.initialEmail=''] - Email khởi tạo nếu có sẵn
 * @param {Function} props.onSuccess - Callback({ email, resetToken }) khi xác thực thành công
 * @param {Function} [props.onCancel] - Callback khi người dùng hủy bỏ hoặc muốn quay lại
 * @param {string} [props.title] - Tiêu đề tùy chỉnh
 * @param {string} [props.subtitle] - Phụ đề tùy chỉnh
 * @param {boolean} [props.lockEmail=false] - Khóa không cho sửa email nếu đã có sẵn
 */
export default function EmailOtpVerification({
  purpose = "VERIFY_EMAIL",
  initialEmail = "",
  onSuccess,
  onCancel,
  title,
  subtitle,
  lockEmail = false
}) {
  const [step, setStep] = useState(initialEmail ? 2 : 1);
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tự động đếm ngược 60 giây khi bước 2 kích hoạt
  useEffect(() => {
    let timer = null;
    if (step === 2 && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Nếu có initialEmail và ở bước 2 ngay từ đầu, tự động gửi OTP lần đầu nếu chưa gửi
  useEffect(() => {
    if (initialEmail && step === 2 && !successMsg && !error) {
      handleSendOtp(initialEmail);
    }
  }, []);

  // Xử lý gửi mã OTP đến email
  const handleSendOtp = async (targetEmail) => {
    const emailToSend = (targetEmail || email).trim().toLowerCase();
    if (!emailToSend || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.sendOtp({
        email: emailToSend,
        purpose
      });
      setSuccessMsg(res.message || "Mã xác thực đã được gửi đến email của bạn.");
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setOtpCode("");
    } catch (err) {
      setError(err.message || "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.");
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  // Xử lý gửi lại mã OTP (đếm ngược 60s)
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError("");
    setSuccessMsg("");
    await handleSendOtp(email);
  };

  // Xử lý xác thực mã OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        code: otpCode.trim(),
        purpose
      });

      setSuccessMsg("Xác thực email thành công!");
      if (onSuccess) {
        setTimeout(() => {
          onSuccess({
            email: email.trim().toLowerCase(),
            resetToken: res.resetToken
          });
        }, 500);
      }
    } catch (err) {
      setError(err.message || "Mã xác thực không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // Tự động submit khi đã nhập đủ 6 chữ số
  useEffect(() => {
    if (otpCode && otpCode.length === 6 && step === 2) {
      handleVerifyOtp();
    }
  }, [otpCode]);

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border/80 shadow-sm p-6 sm:p-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          {step === 1 ? <Mail className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">
          {title || (step === 1 ? "Xác thực Email" : "Nhập mã xác thực")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {subtitle || (step === 1 
            ? "Nhập email của bạn để nhận mã xác thực OTP qua hộp thư Gmail." 
            : `Mã OTP gồm 6 số đã được gửi đến email ${email}`)}
        </p>
      </div>

      {/* Thông báo lỗi / thành công */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* BƯỚC 1: NHẬP EMAIL */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp-email" className="text-xs font-bold text-foreground">
              Địa chỉ Email nhận mã *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="otp-email"
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || lockEmail}
                className="pl-10 h-11 rounded-xl text-sm"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi mã qua Gmail...
              </>
            ) : (
              "Gửi mã xác thực OTP"
            )}
          </Button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground pt-1 transition text-center block"
            >
              Quay lại
            </button>
          )}
        </form>
      )}

      {/* BƯỚC 2: NHẬP MÃ 6 SỐ */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Mã xác thực gồm 6 chữ số
            </Label>
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              disabled={loading}
              autoFocus
            >
              <InputOTPGroup className="gap-1.5 sm:gap-2">
                <InputOTPSlot index={0} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
                <InputOTPSlot index={1} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
                <InputOTPSlot index={2} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
                <InputOTPSlot index={3} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
                <InputOTPSlot index={4} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
                <InputOTPSlot index={5} className="w-10 sm:w-12 h-12 text-lg font-bold rounded-xl border-2" />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[11px] text-muted-foreground mt-1">
              Mã có hiệu lực trong 5 phút. Vui lòng kiểm tra kỹ hòm thư.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xác thực mã...
              </>
            ) : (
              "Xác nhận mã OTP"
            )}
          </Button>

          {/* Đếm ngược 60 giây & Nút gửi lại */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
            {!lockEmail && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpCode("");
                  setError("");
                  setSuccessMsg("");
                }}
                className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi email</span>
              </button>
            )}

            <div className={cn("ml-auto", lockEmail && "w-full text-center")}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang gửi lại...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gửi lại mã
                    </>
                  )}
                </button>
              ) : (
                <span className="text-slate-400">
                  Gửi lại mã sau <strong className="text-orange-600">{countdown}s</strong>
                </span>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
