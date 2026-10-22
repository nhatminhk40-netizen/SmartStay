import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Lock, 
  Loader2, 
  Eye, 
  EyeOff, 
  Shield, 
  Star, 
  Users, 
  Phone, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload, 
  Info,
  MapPin,
  IdCard,
  GraduationCap,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleClientIdDialog from "@/components/GoogleClientIdDialog";
import { triggerGoogleSignIn } from "@/lib/googleAuth";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { cn } from "@/lib/utils";
import LandlordDocUploader, { PROOF_DOCUMENT_TYPES } from "@/components/LandlordDocUploader";
import { useAuth } from "@/lib/AuthContext";

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

// Mẫu ảnh minh họa để test nhanh hồ sơ giấy tờ
const SAMPLE_DOCS = {
  idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
  idCardBack: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
  ownership: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
};

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "employee" || user.role === "landlord") navigate("/chu-tro");
      else if (user.role === "transporter") navigate("/tai-xe");
      else navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // Step state: 1 = Basic Info & Role, 2 = Phone OTP, 3 = Landlord Documents (if landlord), 4 = Done/Pending Notice
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("student"); // "student" | "landlord"

  // Step 1: Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [campus, setCampus] = useState("FPT Can Tho");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2: OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [showOtpHelp, setShowOtpHelp] = useState(false);

  // Step 3: Landlord Documents state
  const [idCardNumber, setIdCardNumber] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [idCardFrontUrl, setIdCardFrontUrl] = useState("");
  const [idCardBackUrl, setIdCardBackUrl] = useState("");
  const [ownershipDocUrl, setOwnershipDocUrl] = useState("");
  const [ownershipDocType, setOwnershipDocType] = useState("UTILITY_BILL");
  const [landlordNote, setLandlordNote] = useState("");

  // Common UX state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Countdown timer for OTP
  useEffect(() => {
    if (currentStep !== 2 || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, otpCountdown]);

  // Handle Step 1 submit: Send phone OTP and advance
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setError("Vui lòng điền đầy đủ các trường thông tin.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (phone.trim().length < 9) {
      setError("Số điện thoại không hợp lệ (tối thiểu 9 chữ số).");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.sendOtp({ email: email.trim(), purpose: "REGISTER" });
      setOtpCountdown(60);
      setCurrentStep(2);
      toast({
        title: "Đã gửi mã xác thực",
        description: `Mã OTP đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư Gmail.`
      });
    } catch (err) {
      setError(err.message || "Không thể khởi tạo phiên xác thực.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Resend OTP
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await base44.auth.sendOtp({ email: email.trim(), purpose: "REGISTER" });
      setOtpCountdown(60);
      toast({
        title: "Đã gửi lại mã",
        description: `Mã xác thực mới đã được gửi đến ${email}.`
      });
    } catch (err) {
      setError(err.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 submit: Verify Email OTP
  const handleVerifyOtp = async () => {
    setError("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email: email.trim(), code: otpCode, purpose: "REGISTER" });

      // Nếu là Sinh viên -> Đăng ký và kích hoạt tài khoản ngay lập tức
      if (selectedRole === "student") {
        const result = await base44.auth.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          phoneVerified: true,
          isEmailVerified: true,
          role: "student",
          campus
        });
        setRegisteredUser(result.user);
        toast({
          title: "Đăng ký thành công!",
          description: "Chào mừng bạn đến với nền tảng SmartStay."
        });
        const returnUrl = safeReturnTo();
        window.location.href = returnUrl || "/";
        return;
      }

      // Nếu là Chủ trọ -> Chuyển sang Bước 3: Cung cấp giấy tờ chứng minh
      setCurrentStep(3);
      toast({
        title: "Xác thực email thành công!",
        description: "Vui lòng cung cấp giấy tờ chứng minh cơ sở nhà trọ."
      });
    } catch (err) {
      setError(err.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };


  // Step 3 submit: Submit Landlord application
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!idCardNumber.trim() || !propertyName.trim() || !propertyAddress.trim()) {
      setError("Vui lòng nhập số CCCD, tên nhà trọ và địa chỉ cơ sở.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        phoneVerified: true,
        role: "landlord",
        campus,
        landlordDocuments: {
          idCardNumber: idCardNumber.trim(),
          propertyName: propertyName.trim(),
          propertyAddress: propertyAddress.trim(),
          idCardFrontUrl: idCardFrontUrl.trim(),
          idCardBackUrl: idCardBackUrl.trim(),
          ownershipDocUrl: ownershipDocUrl.trim(),
          ownershipDocType,
          ownershipDocTypeName: PROOF_DOCUMENT_TYPES.find(t => t.id === ownershipDocType)?.name || "Hóa đơn tiền điện / nước",
          note: landlordNote.trim()
        }
      };

      const result = await base44.auth.register(payload);
      setRegisteredUser(result.user);
      setCurrentStep(4); // Advance to Completed / Pending Screen
    } catch (err) {
      setError(err.message || "Gửi hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Nạp ảnh mẫu nhanh cho Chủ trọ khi test
  const handleFillSampleDocs = () => {
    setIdCardNumber("092095001234");
    setPropertyName("Nhà trọ Hưng Thịnh Cần Thơ");
    setPropertyAddress("Hẻm 51, đường 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ");
    setIdCardFrontUrl(SAMPLE_DOCS.idCardFront);
    setIdCardBackUrl(SAMPLE_DOCS.idCardBack);
    setOwnershipDocUrl(SAMPLE_DOCS.ownership);
    setOwnershipDocType("UTILITY_BILL");
    setLandlordNote("Hóa đơn tiền điện nước chính chủ trùng khớp CCCD và địa chỉ trọ, dãy 12 phòng khép kín.");
    toast({
      title: "Đã nạp hồ sơ mẫu!",
      description: "Đã tự động điền giấy tờ và thông tin nhà trọ mẫu để kiểm thử."
    });
  };

  // Google OAuth
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
      onSuccess: () => {
        setGoogleLoading(false);
        const returnUrl = safeReturnTo();
        window.location.href = returnUrl || "/";
      },
      onError: (err) => {
        setGoogleLoading(false);
        setError(err.message || "Đăng ký bằng Google thất bại.");
      }
    });
  };

  // ── Left Branding Panel ──
  const LeftPanel = () => (
    <div
      className="hidden lg:flex lg:w-[48%] relative flex-col justify-between overflow-hidden p-10 select-none"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)",
      }}
    >
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-orange-500" />
        </div>
        <span className="text-white font-black text-2xl tracking-tight">SmartStay</span>
      </div>

      <div className="relative z-10 my-auto py-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{
            background: "rgba(249,115,22,0.15)",
            color: "#fb923c",
            border: "1px solid rgba(249,115,22,0.3)",
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          <span>Quy trình xác thực minh bạch & bảo mật</span>
        </div>
        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
          Nền tảng phòng trọ
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #f97316, #fb923c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            số 1 tại TP. Cần Thơ
          </span>
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-md">
          Chủ nhà trọ được thẩm định giấy tờ bởi Quản trị viên. Sinh viên an tâm tìm phòng,
          không lo tin ảo, giá cả minh bạch tuyệt đối.
        </p>

        {/* Workflow mini timeline */}
        <div className="mt-8 space-y-3 max-w-md">
          {[
            { step: "1", title: "Đăng ký & Chọn vai trò", desc: "Chọn Chủ trọ hoặc Người thuê / Sinh viên" },
            { step: "2", title: "Xác thực số điện thoại", desc: "Mã OTP gửi đến SĐT để chống tài khoản ảo" },
            { step: "3", title: "Gửi hồ sơ & Admin duyệt", desc: "Admin kiểm tra giấy tờ trước khi cấp quyền" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 SmartStay Cần Thơ</span>
        <span>Hỗ trợ: hotro@smartstay.vn</span>
      </div>
    </div>
  );

  // ── Step Indicator Bar ──
  const StepIndicator = () => {
    const steps = [
      { num: 1, label: "Thông tin" },
      { num: 2, label: "Xác thực Gmail" },
      ...(selectedRole === "landlord" ? [{ num: 3, label: "Hồ sơ chủ trọ" }] : []),
      { num: selectedRole === "landlord" ? 4 : 3, label: "Hoàn tất" }
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
          {steps.map((s, index) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                      ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30 scale-110"
                      : "bg-white border-slate-300 text-slate-400"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-1.5 font-semibold whitespace-nowrap",
                    isCurrent ? "text-orange-600 font-bold" : isCompleted ? "text-emerald-700" : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Error Block ──
  const ErrorBlock = () =>
    error ? (
      <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-600 animate-in fade-in">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex bg-background font-body">
      <LeftPanel />

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-[480px]">
          
          {/* Logo on mobile */}
          <div className="mb-6 lg:hidden flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">SmartStay</span>
          </div>

          <StepIndicator />
          <ErrorBlock />

          {/* ==================== BƯỚC 1: THÔNG TIN CƠ BẢN & CHỌN VAI TRÒ ==================== */}
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Tạo tài khoản mới
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Đăng ký dễ dàng để trải nghiệm nền tảng phòng trọ số 1 Cần Thơ
                </p>
              </div>

              {/* CHỌN VAI TRÒ (Radio Cards) */}
              <div className="mb-6">
                <Label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">
                  Bạn tham gia với vai trò gì? <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: Người thuê */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between",
                      selectedRole === "student"
                        ? "border-orange-500 bg-orange-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      {selectedRole === "student" && (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Người thuê / SV</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Tìm phòng, ghép bạn, chuyển trọ</div>
                    </div>
                  </button>

                  {/* Option 2: Chủ trọ */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("landlord")}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between",
                      selectedRole === "landlord"
                        ? "border-orange-500 bg-orange-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {selectedRole === "landlord" && (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Chủ nhà trọ</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Đăng tin & quản lý phòng trọ</div>
                    </div>
                  </button>
                </div>

                {selectedRole === "landlord" && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <span>
                      <strong>Lưu ý:</strong> Tài khoản Chủ trọ cần xác thực bằng Gmail và cung cấp thông tin/giấy tờ minh chứng để Admin thẩm định trước khi đăng tin.
                    </span>
                  </div>
                )}
              </div>

              {/* GOOGLE SIGN IN (chỉ khả dụng nhanh cho Sinh viên) */}
              {selectedRole === "student" && (
                <>
                  <button
                    id="btn-google-register"
                    type="button"
                    disabled={googleLoading || loading}
                    onClick={startGoogleOAuth}
                    className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border bg-card text-foreground font-medium text-xs transition-all hover:bg-accent/10 hover:border-orange-300 mb-5 disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <GoogleIcon className="w-4 h-4" />
                        Đăng ký nhanh với Google
                      </>
                    )}
                  </button>
                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        hoặc đăng ký bằng email
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* FORM FIELDS */}
              <form onSubmit={handleStep1Submit} className="space-y-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Họ và tên *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Số điện thoại *</Label>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="tel"
                        required
                        placeholder="0901234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Khu vực / Campus</Label>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full h-11 px-3 mt-1 rounded-xl border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="FPT Can Tho">FPT Cần Thơ</option>
                      <option value="ĐH Cần Thơ (Khu 2)">ĐH Cần Thơ (Khu 2)</option>
                      <option value="ĐH Y Dược Cần Thơ">ĐH Y Dược Cần Thơ</option>
                      <option value="ĐH Nam Cần Thơ">ĐH Nam Cần Thơ</option>
                      <option value="Ninh Kiều">Q. Ninh Kiều</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Email *</Label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Mật khẩu *</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Ít nhất 6 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 h-11 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu *</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 h-11 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-white text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-md shadow-orange-500/25"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Tiếp tục xác thực bằng Gmail
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-5">
                Đã có tài khoản?{" "}
                <Link to="/login" className="font-bold hover:underline" style={{ color: "#f97316" }}>
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          )}

          {/* ==================== BƯỚC 2: XÁC THỰC SỐ ĐIỆN THOẠI ==================== */}
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại bước trước
                </button>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Xác thực mã OTP qua Email
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Mã xác thực gồm 6 số đã được gửi qua Gmail đến địa chỉ{" "}
                  <strong className="text-slate-900">{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/spam).
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  autoFocus
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
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length < 6}
                className="w-full h-11 rounded-xl font-bold text-white text-xs transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-orange-500/25"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    {selectedRole === "landlord" ? "Xác nhận & Sang bước hồ sơ Chủ trọ" : "Hoàn tất đăng ký"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-5">
                <button
                  type="button"
                  onClick={() => setShowOtpHelp(!showOtpHelp)}
                  className="font-semibold text-slate-600 hover:text-orange-600 transition-colors underline flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-orange-500" />
                  Không nhận được mã?
                </button>
                {otpCountdown > 0 ? (
                  <span className="text-slate-400 font-medium">Gửi lại sau {otpCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendOtp}
                    className="font-bold transition-colors hover:underline text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    {loading ? "Đang gửi lại mã..." : "Gửi lại mã OTP"}
                  </button>
                )}
              </div>

              {showOtpHelp && (
                <div className="mt-4 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-slate-800 animate-in fade-in slide-in-from-top-1 shadow-xs">
                  <div className="font-bold text-orange-950 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Hướng dẫn kiểm tra mã xác thực:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                    <li>Vui lòng kiểm tra kỹ thư mục <strong>Thư rác (Spam)</strong>, <strong>Quảng cáo</strong> hoặc <strong>Cập nhật</strong> trong hộp thư Gmail.</li>
                    <li>Đảm bảo địa chỉ email <strong className="text-slate-900">{email}</strong> của bạn là chính xác và còn dung lượng nhận thư.</li>
                    <li>Nếu gõ nhầm email, bạn có thể <button type="button" onClick={() => setCurrentStep(1)} className="text-orange-600 font-bold underline hover:text-orange-700 inline">quay lại bước 1 để sửa email</button>.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ==================== BƯỚC 3: HỒ SƠ GIẤY TỜ CHỦ TRỌ (CHỜ DUYỆT) ==================== */}
          {currentStep === 3 && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Hồ sơ xác minh Chủ trọ
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Cung cấp giấy tờ để Ban Quản Trị SmartStay thẩm định và cấp quyền Chủ trọ
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Số CCCD / CMND chủ sở hữu *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="12 chữ số (VD: 092095001234)"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    className="h-11 rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Tên khu trọ / Tòa nhà *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="VD: Nhà trọ Hưng Thịnh, Căn hộ Mini An Khánh..."
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="h-11 rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Địa chỉ cơ sở nhà trọ tại Cần Thơ *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Số nhà, hẻm, tên đường, phường, quận tại TP. Cần Thơ"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="h-11 rounded-xl text-xs mt-1"
                  />
                </div>

                {/* Giấy tờ chứng minh theo Cấp độ 1 (CCCD 2 mặt + Hóa đơn / Giấy tờ cơ sở) */}
                <LandlordDocUploader
                  idCardFront={idCardFrontUrl}
                  setIdCardFront={setIdCardFrontUrl}
                  idCardBack={idCardBackUrl}
                  setIdCardBack={setIdCardBackUrl}
                  ownershipDoc={ownershipDocUrl}
                  setOwnershipDoc={setOwnershipDocUrl}
                  ownershipType={ownershipDocType}
                  setOwnershipType={setOwnershipDocType}
                />

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Ghi chú bổ sung cho Ban Quản Trị
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="Số lượng phòng, hệ thống camera, giờ giấc, PCCC..."
                    value={landlordNote}
                    onChange={(e) => setLandlordNote(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input text-xs bg-card focus:outline-none focus:ring-2 focus:ring-orange-500/20 mt-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-white text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 mt-4"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang gửi hồ sơ...
                    </>
                  ) : (
                    <>
                      Gửi hồ sơ xét duyệt Chủ trọ
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ==================== BƯỚC 4: THÔNG BÁO CHỜ DUYỆT (PENDING) ==================== */}
          {currentStep === 4 && (
            <div className="text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 mb-2">
                TRẠNG THÁI: CHỜ DUYỆT (PENDING)
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Đã tiếp nhận hồ sơ Chủ trọ
              </h2>

              <p className="text-slate-600 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                Cảm ơn <strong>{fullName}</strong>. Hồ sơ đăng ký cơ sở trọ <strong>"{propertyName}"</strong> đã được gửi tới Ban Quản Trị SmartStay để thẩm định giấy tờ.
              </p>

              {/* Box giải thích quan trọng theo yêu cầu người dùng */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Xác thực Gmail hoàn tất ({email})</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Đã gửi giấy tờ CCCD & cơ sở nhà trọ</span>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200 text-slate-600">
                  <Info className="w-4 h-4 mt-0.5 text-orange-600 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <strong>Sau khi Admin phê duyệt:</strong> Khi đăng nhập, bạn <strong>KHÔNG CẦN</strong> phải chọn lại vai trò "Chủ trọ" nữa vì hệ thống đã tự động nhận diện tài khoản của bạn là Chủ trọ chính thức!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="w-full h-11 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-md hover:bg-orange-600 transition"
                >
                  Đăng nhập vào tài khoản
                </Link>
                <Link
                  to="/"
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-50 transition"
                >
                  Quay về trang chủ SmartStay
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      <GoogleClientIdDialog
        open={showClientIdDialog}
        onClose={() => setShowClientIdDialog(false)}
        onSaved={startGoogleOAuth}
      />
    </div>
  );
}
