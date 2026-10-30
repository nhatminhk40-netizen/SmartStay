import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, Shield, Star, Users, Building2, Truck, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleClientIdDialog from "@/components/GoogleClientIdDialog";
import { triggerGoogleSignIn } from "@/lib/googleAuth";
import { safeReturnTo, resolvePostLoginRedirect } from "@/lib/authReturnTo";
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
      const returnUrl = safeReturnTo();
      const target = resolvePostLoginRedirect(user.role, returnUrl);
      navigate(target);
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

      // Điều hướng thông minh theo Role và URL trả về (ngăn chặn xung đột phân quyền)
      const targetUrl = resolvePostLoginRedirect(role, returnUrl);
      window.location.href = targetUrl;
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
        const targetUrl = resolvePostLoginRedirect(role, returnUrl);
        window.location.href = targetUrl;
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SmartStay</span>
          </Link>
        </div>

        {/* Center - Hero content */}
        <div className="relative z-10 px-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-6">
            <Building2 className="w-3.5 h-3.5" />
            SmartStay Cần Thơ - Hỗ trợ tìm phòng & Quản lý phòng trọ
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Tìm phòng trọ <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              an toàn & thông minh
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Hàng trăm phòng trọ, căn hộ chất lượng dành cho mọi người có nhu cầu thuê tại Cần Thơ. Thông tin rõ ràng, an toàn tuyệt đối.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{f.title}</div>
                  <div className="text-xs text-slate-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Footer note */}
        <div className="relative z-10 p-10 flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Hệ thống bảo vệ quyền lợi người thuê hàng đầu Cần Thơ</span>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Trang chủ
          </Link>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {twoFactorData.required ? "Xác thực 2 bước (2FA)" : "Chào mừng trở lại"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {twoFactorData.required 
                ? "Nhập mã xác thực 6 chữ số từ ứng dụng Google Authenticator của Quản trị viên."
                : "Đăng nhập để khám phá và quản lý phòng trọ chất lượng"}
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {twoFactorData.required ? (
            /* FORM 2FA GOOGLE AUTHENTICATOR */
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-orange-600 shrink-0" />
                <div className="text-xs text-orange-800">
                  <span className="font-bold">Bảo mật cấp cao Quản trị viên:</span> Mở app Google Authenticator trên điện thoại để lấy mã 6 số.
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="totpCode">Mã 6 số từ Google Authenticator</Label>
                <div className="relative">
                  <Input
                    id="totpCode"
                    type="text"
                    maxLength={6}
                    placeholder="VD: 123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-2xl tracking-[0.3em] font-mono font-bold"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={totpLoading || totpCode.length < 6}
                className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {totpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Xác nhận & Vào trang Quản trị
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorData({ required: false, tempToken: "", email: "" });
                    setTotpCode("");
                    setError("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Quay lại đăng nhập bằng tài khoản khác
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Google login button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full h-11 rounded-xl border border-input bg-background hover:bg-muted/60 transition-colors flex items-center justify-center gap-3 text-sm font-semibold text-foreground disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon className="w-4 h-4" />
                )}
                <span>Tiếp tục với Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Hoặc
                </span>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-orange-600/20"
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

              {/* Register link */}
              <div className="text-center text-sm text-muted-foreground pt-2">
                Chưa có tài khoản?{" "}
                <Link
                  to={
                    "/register" +
                    (safeReturnTo() !== "/"
                      ? "?returnTo=" + encodeURIComponent(safeReturnTo())
                      : "")
                  }
                  className="font-semibold text-orange-600 hover:text-orange-700 hover:underline underline-offset-4"
                >
                  Đăng ký miễn phí
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <GoogleClientIdDialog
        open={showClientIdDialog}
        onOpenChange={setShowClientIdDialog}
        onSuccess={() => {
          setShowClientIdDialog(false);
          startGoogleOAuth();
        }}
      />
    </div>
  );
}
