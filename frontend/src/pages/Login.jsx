import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, Shield, Star, Users, Building2, Truck, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleClientIdDialog from "@/components/GoogleClientIdDialog";
import { triggerGoogleSignIn } from "@/lib/googleAuth";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";

const FEATURES = [
  {
    icon: Truck,
    title: "Hỗ trợ chuyển trọ",
    desc: "Kết nối tài xế ba gác, xe tải chuyển đồ tiện lợi, an toàn",
  },
  {
    icon: Users,
    title: "Ghép bạn cùng phòng",
    desc: "Kết nối với người thuê phù hợp tính cách, cùng lối sống",
  },
  {
    icon: Star,
    title: "Đánh giá thực tế",
    desc: "Review từ người thuê thật, không quảng cáo ảo",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Trạng thái Xác thực 2 bước Google Authenticator
  const [twoFactorData, setTwoFactorData] = useState({
    required: false,
    tempToken: "",
    email: ""
  });
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const cleanCode = totpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError("Vui lòng nhập đầy đủ mã xác thực 6 chữ số từ app Google Authenticator.");
      return;
    }
    setError("");
    setTotpLoading(true);
    try {
      const res = await base44.auth.verifyAdmin2FA({
        tempToken: twoFactorData.tempToken,
        code: cleanCode
      });
      if (res?.access_token) {
        base44.auth.setToken(res.access_token);
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message || "Mã xác thực không chính xác. Vui lòng kiểm tra lại.");
    } finally {
      setTotpLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "employee" || user.role === "landlord") navigate("/chu-tro");
      else if (user.role === "transporter") navigate("/tai-xe");
      else navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await base44.auth.loginViaEmailPassword(email, password);

      // Nếu tài khoản Admin yêu cầu Xác thực 2 bước (Google Authenticator)
      if (result?.require2FA) {
        setTwoFactorData({
          required: true,
          tempToken: result.tempToken,
          email: email
        });
        setTotpCode("");
        setError("");
        setLoading(false);
        return;
      }

      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      
      const role = result?.user?.role;
      const status = result?.user?.verificationStatus;
      const returnUrl = safeReturnTo();
      
      if (role === "landlord") {
        if (status === "APPROVED") {
          // Chủ trọ đã được Admin duyệt
          sessionStorage.setItem("smartstay_login_role_notice", "landlord_approved");
        } else if (status === "PENDING") {
          // Chủ trọ đang chờ duyệt
          sessionStorage.setItem("smartstay_login_role_notice", "landlord_pending");
        } else if (status === "REJECTED") {
          // Chủ trọ bị từ chối
          sessionStorage.setItem("smartstay_login_role_notice", "landlord_rejected");
        }
      }

      // Nếu có returnTo cụ thể thì chuyển hướng về đó, ngược lại phân luồng chuyên biệt theo Role
      if (returnUrl && returnUrl !== "/" && !returnUrl.includes("/login")) {
        window.location.href = returnUrl;
      } else if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "employee" || role === "landlord") {
        window.location.href = "/chu-tro";
      } else if (role === "transporter") {
        window.location.href = "/tai-xe";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("chưa được bật")) {
        setError("Không thể kết nối đến máy chủ Backend (Port 5000). Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.");
      } else {
        setError(msg || "Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const startGoogleOAuth = () => {
    setError("");
    setGoogleLoading(true);
    triggerGoogleSignIn({
      onPromptClientId: () => {
        setGoogleLoading(false);
        setShowClientIdDialog(true);
      },
      onSuccess: (result) => {
        setGoogleLoading(false);
        const role = result?.user?.role;
        const returnUrl = safeReturnTo();
        if (returnUrl && returnUrl !== "/" && !returnUrl.includes("/login")) {
          window.location.href = returnUrl;
        } else if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "employee" || role === "landlord") {
          window.location.href = "/chu-tro";
        } else if (role === "transporter") {
          window.location.href = "/tai-xe";
        } else {
          window.location.href = "/";
        }
      },
      onError: (err) => {
        setGoogleLoading(false);
        // Nếu người dùng chủ động đóng popup hoặc hủy, reset loading mà không hiện lỗi đỏ
        if (err?.code === "POPUP_CLOSED" || err?.message === "popup_closed" || err?.message?.includes("hủy") || err?.message?.includes("closed")) {
          return;
        }
        setError(err.message || "Đăng nhập Google thất bại.");
      }
    });
  };

  const handleGoogle = () => {
    startGoogleOAuth();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT PANEL - Branding */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c1a2e 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />

        {/* Top - Logo */}
        <div className="relative z-10 p-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <img src="/smartstay-icon.png" alt="SmartStay Logo" className="w-8 h-8 object-contain drop-shadow" />
            <span className="text-white font-bold text-xl tracking-tight">SmartStay</span>
          </Link>
        </div>

        {/* Middle - Headline */}
        <div className="relative z-10 px-10 pb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{
              background: "rgba(249,115,22,0.15)",
              color: "#fb923c",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span>SmartStay Cần Thơ - Hỗ trợ tìm phòng & Quản lí phòng trọ</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Tìm phòng trọ
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #f97316, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              an toàn & thông minh
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            Hàng trăm phòng trọ, căn hộ chất lượng dành cho mọi người có nhu cầu thuê tại Cần Thơ.
            Thông tin rõ ràng, an toàn tuyệt đối.
          </p>
        </div>

        {/* Bottom - Feature cards */}
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

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/smartstay-icon.png" alt="SmartStay Logo" className="w-7 h-7 object-contain" />
            <span className="font-bold text-lg text-foreground">SmartStay</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Chào mừng trở lại</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Đăng nhập để khám phá và quản lý phòng trọ chất lượng
            </p>
          </div>

          {/* Google Button */}
          <button
            id="btn-google-login"
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm transition-all duration-200 hover:bg-accent/10 hover:border-orange-300 hover:shadow-sm active:scale-[0.98] mb-6 disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                Đang kết nối tài khoản Google...
              </>
            ) : (
              <>
                <GoogleIcon className="w-5 h-5" />
                Tiếp tục với Google
              </>
            )}
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

          {/* Error */}
          {error && (
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
          )}

          {/* Form Xác thực 2 bước Google Authenticator hoặc Đăng nhập thông thường */}
          {twoFactorData.required ? (
            <form onSubmit={handleVerify2FA} className="space-y-5 animate-in fade-in duration-200" noValidate>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#f97316] flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                  Xác thực 2 bước (Google Authenticator)
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Nhập mã <strong>6 chữ số</strong> ngẫu nhiên từ ứng dụng Google Authenticator hoặc Authy trên điện thoại của Quản trị viên.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                  }}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="totp-code" className="text-xs font-bold text-slate-700 block text-center uppercase tracking-wider">
                  MÃ XÁC THỰC 6 CHỮ SỐ (TOTP)
                </Label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={9}
                  autoFocus
                  placeholder="000 000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9-]/g, ''))}
                  className="h-14 text-center font-mono font-black text-2xl tracking-[0.3em] rounded-2xl border-orange-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20"
                  required
                />
                <p className="text-[11px] text-slate-400 text-center italic">
                  💡 Bạn cũng có thể nhập mã dự phòng 8 số (Backup Code) nếu không mang theo điện thoại.
                </p>
              </div>

              <button
                type="submit"
                disabled={totpLoading || totpCode.length < 6}
                className="w-full h-12 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                }}
              >
                {totpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực 2FA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Xác nhận & Vào Bảng Quản Trị</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorData({ required: false, tempToken: "", email: "" });
                    setTotpCode("");
                    setError("");
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-orange-600 transition inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại nhập mật khẩu
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="login-email"
                  type="text"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Mật khẩu
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: "#f97316" }}
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

            <button
              id="btn-login-submit"
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
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
          )}

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-7">
            Chưa có tài khoản?{" "}
            <Link
              to={
                "/register" +
                (safeReturnTo() !== "/"
                  ? "?returnTo=" + encodeURIComponent(safeReturnTo())
                  : "")
              }
              className="font-semibold transition-colors hover:underline"
              style={{ color: "#f97316" }}
            >
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </div>

      {/* Google Client ID Setup Dialog */}
      <GoogleClientIdDialog
        open={showClientIdDialog}
        onClose={() => setShowClientIdDialog(false)}
        onSaveAndContinue={() => startGoogleOAuth()}
      />
    </div>
  );
}
