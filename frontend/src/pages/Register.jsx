import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, Shield, Star, Users } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

const FEATURES = [
  {
    icon: Shield,
    title: "Phòng Safe Badge™",
    desc: "Phòng trọ được kiểm duyệt & xác nhận minh bạch",
  },
  {
    icon: Users,
    title: "Ghép bạn cùng phòng",
    desc: "Kết nối với sinh viên cùng trường, cùng sở thích",
  },
  {
    icon: Star,
    title: "Đánh giá thực tế",
    desc: "Review từ người thuê thật, không quảng cáo ảo",
  },
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Mã xác nhận không đúng");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Đã gửi lại mã", description: "Kiểm tra email của bạn." });
    } catch (err) {
      setError(err.message || "Gửi lại mã thất bại");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  // ── Shared left panel ──
  const LeftPanel = () => (
    <div
      className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c1a2e 100%)",
      }}
    >
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />

      <div className="relative z-10 p-10">
        <span className="text-white font-bold text-xl tracking-tight">SmartStay</span>
      </div>

      <div className="relative z-10 px-10 pb-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{
            background: "rgba(249,115,22,0.15)",
            color: "#fb923c",
            border: "1px solid rgba(249,115,22,0.3)",
          }}
        >
          🏠 Nền tảng tìm phòng trọ #1 Cần Thơ
        </div>
        <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
          Tham gia cộng đồng
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #f97316, #fb923c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            sinh viên Cần Thơ
          </span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-md">
          Tạo tài khoản miễn phí và khám phá hàng trăm phòng trọ an toàn,
          chất lượng ngay hôm nay.
        </p>
      </div>

      <div className="relative z-10 p-10 grid gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.15)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#f97316" }} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Error block ──
  const ErrorBlock = () =>
    error ? (
      <div
        className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444",
        }}
      >
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    ) : null;

  // ── OTP screen ──
  if (showOtp) {
    return (
      <div className="min-h-screen flex bg-background">
        <LeftPanel />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
          <div className="mb-8 lg:hidden">
            <span className="font-bold text-lg text-foreground">SmartStay</span>
          </div>
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Xác nhận email 📬</h2>
              <p className="text-muted-foreground text-sm mt-1.5">
                Chúng tôi đã gửi mã 6 số tới <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <ErrorBlock />

            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              id="btn-verify-otp"
              onClick={handleVerify}
              disabled={loading || otpCode.length < 6}
              className="w-full h-12 rounded-xl font-semibold text-white text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: loading || otpCode.length < 6 ? "none" : "0 4px 16px rgba(249,115,22,0.4)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                "Xác nhận"
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Không nhận được mã?{" "}
              <button
                onClick={handleResend}
                className="font-semibold transition-colors hover:underline"
                style={{ color: "#f97316" }}
              >
                Gửi lại
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Register form ──
  return (
    <div className="min-h-screen flex bg-background">
      <LeftPanel />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="mb-8 lg:hidden">
          <span className="font-bold text-lg text-foreground">SmartStay</span>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Tạo tài khoản mới ✨</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Đăng ký miễn phí để bắt đầu tìm phòng trọ
            </p>
          </div>

          {/* Google Button */}
          <button
            id="btn-google-register"
            onClick={handleGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm transition-all duration-200 hover:bg-accent/10 hover:border-orange-300 hover:shadow-sm active:scale-[0.98] mb-6"
          >
            <GoogleIcon className="w-5 h-5" />
            Tiếp tục với Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-widest">
                hoặc
              </span>
            </div>
          </div>

          <ErrorBlock />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-sm font-medium text-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-11 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-11 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: loading ? "none" : "0 4px 16px rgba(249,115,22,0.4)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-7">
            Đã có tài khoản?{" "}
            <Link
              to={
                "/login" +
                (safeReturnTo() !== "/"
                  ? "?returnTo=" + encodeURIComponent(safeReturnTo())
                  : "")
              }
              className="font-semibold transition-colors hover:underline"
              style={{ color: "#f97316" }}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
