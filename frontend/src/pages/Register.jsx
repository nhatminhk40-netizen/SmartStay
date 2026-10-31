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
  ShieldCheck,
  X
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

const STUDENT_FEATURES = [
  {
    icon: Building2,
    title: "Phòng trọ xác thực",
    desc: "Tin đăng chính chủ, thông tin minh bạch giá cả & hợp đồng",
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

const LANDLORD_FEATURES = [
  {
    icon: Users,
    title: "Tiếp cận hàng nghìn người thuê tại Cần Thơ",
    desc: "Kết nối trực tiếp người thuê có nhu cầu ở thực, thông tin rõ ràng, tối ưu tỷ lệ lấp đầy phòng",
  },
  {
    icon: ShieldCheck,
    title: "Quản lý nghiêm ngặt & Tiện lợi",
    desc: "Hợp đồng điện tử chuẩn pháp lý, chốt cọc an toàn, ghi nhận công tơ điện nước chống thất thoát",
  },
  {
    icon: CheckCircle2,
    title: "Bộ lọc khách thuê nghiêm túc",
    desc: "Giảm 90% tình trạng bùng hẹn xem phòng, tìm khách thuê văn minh phù hợp quy định nhà trọ",
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
  const [campus, setCampus] = useState("FPT Cần Thơ");
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
  const [skippedVerification, setSkippedVerification] = useState(false);

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
        description: `Mã OTP đã được gửi đến email ${email}. Nếu không thấy ở Hộp thư đến, vui lòng kiểm tra thư mục Thư rác (Spam).`
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
        description: `Mã xác thực mới đã gửi đến ${email}. Đừng quên kiểm tra thư mục Thư rác (Spam) nhé!`
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

      // Nếu là Người thuê -> Đăng ký và kích hoạt tài khoản ngay lập tức
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


  // Xử lý bỏ qua xác minh giấy tờ (tạo tài khoản trước, xác minh sau)
  const handleSkipVerification = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        phoneVerified: true,
        isEmailVerified: true,
        role: "landlord",
        campus,
        verificationStatus: "UNVERIFIED",
        landlordDocuments: {
          idCardNumber: idCardNumber.trim() || "",
          propertyName: propertyName.trim() || ("Cơ sở trọ của " + fullName.trim()),
          propertyAddress: propertyAddress.trim() || "Cần Thơ",
          idCardFrontUrl: "",
          idCardBackUrl: "",
          ownershipDocUrl: "",
          ownershipDocType: "UTILITY_BILL",
          note: "Chủ trọ tạo tài khoản và chọn bổ sung giấy tờ xác minh sau trong Cài đặt."
        }
      };

      const result = await base44.auth.register(payload);
      setRegisteredUser(result.user);
      setSkippedVerification(true);
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || "Không thể tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 submit: Submit Landlord application
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!propertyName.trim()) {
      setError("Vui lòng nhập tên khu trọ hoặc tòa nhà.");
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
        isEmailVerified: true,
        role: "landlord",
        campus,
        verificationStatus: "PENDING",
        landlordDocuments: {
          idCardNumber: idCardNumber.trim(),
          propertyName: propertyName.trim(),
          propertyAddress: propertyAddress.trim() || "Cần Thơ",
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
      setSkippedVerification(false);
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

  const startGoogleOAuth = (roleToAssign = selectedRole) => {
    setError("");
    setGoogleLoading(true);
    triggerGoogleSignIn({
      role: roleToAssign,
      action: "register",
      onPromptClientId: () => {
        setGoogleLoading(false);
        setShowClientIdDialog(true);
      },
      onSuccess: (result) => {
        setGoogleLoading(false);
        const resolvedRole = result?.user?.role || roleToAssign;
        const returnUrl = safeReturnTo();
        if (resolvedRole === "landlord" || resolvedRole === "employee") {
          window.location.href = "/chu-tro";
        } else if (resolvedRole === "admin") {
          window.location.href = "/admin";

        } else {
          window.location.href = returnUrl || "/";
        }
      },
      onError: (err) => {
        setGoogleLoading(false);
        // Nếu người dùng chủ động đóng popup hoặc hủy, reset loading mà không hiện lỗi đỏ
        if (err?.code === "POPUP_CLOSED" || err?.message === "popup_closed" || err?.message?.includes("hủy") || err?.message?.includes("closed")) {
          return;
        }
        setError(err.message || "Đăng ký bằng Google thất bại.");
      }
    });
  };

  // ── Left Branding Panel (Giao diện chuẩn đồng bộ với Login) ──
  const LeftPanel = () => (
    <div
      className="hidden lg:flex lg:w-[48%] relative flex-col justify-between overflow-hidden select-none"
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
      <div className="relative z-10 p-10 pb-0">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <img src="/smartstay-icon.png" alt="SmartStay Logo" className="w-8 h-8 object-contain drop-shadow" />
          <span className="text-white font-bold text-xl tracking-tight">SmartStay</span>
        </Link>
      </div>

      {/* Middle - Headline */}
      <div className="relative z-10 px-10 py-6 my-auto">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{
            background: "rgba(249,115,22,0.15)",
            color: "#fb923c",
            border: "1px solid rgba(249,115,22,0.3)",
          }}
        >
          <Building2 className="w-3.5 h-3.5 text-orange-400" />
          <span>
            {selectedRole === "landlord"
              ? "Dành riêng cho Chủ nhà trọ & Quản lý căn hộ tại Cần Thơ"
              : "SmartStay Cần Thơ - Hỗ trợ tìm phòng & Quản lí phòng trọ"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
          {selectedRole === "landlord" ? (
            <>
              Đồng hành cùng SmartStay
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #f97316, #fb923c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Lấp đầy phòng trống nhanh chóng
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-md">
          {selectedRole === "landlord"
            ? "Tiếp cận trực tiếp hàng nghìn người có nhu cầu thuê tại Cần Thơ. Quản lý phòng trọ nghiêm ngặt, an toàn và tiện lợi tối đa."
            : "Hàng trăm phòng trọ, căn hộ chất lượng dành cho mọi người có nhu cầu thuê tại Cần Thơ. Thông tin rõ ràng, an toàn tuyệt đối."}
        </p>
      </div>

      {/* Bottom - Feature cards */}
      <div className="relative z-10 p-10 pt-0 grid gap-4">
        {(selectedRole === "landlord" ? LANDLORD_FEATURES : STUDENT_FEATURES).map(({ icon: Icon, title, desc }) => (
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
        <div className="w-full max-w-[520px]">
          
          {/* Logo on mobile */}
          <div className="mb-6 lg:hidden flex items-center justify-center gap-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/smartstay-icon.png" alt="SmartStay Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-xl text-foreground">SmartStay</span>
            </Link>
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

              {/* CHỌN VAI TRÒ (Radio Cards - 3 Cột) */}
              <div className="mb-6">
                <Label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">
                  Bạn tham gia với vai trò gì? <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Người thuê */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between",
                      selectedRole === "student"
                        ? "border-orange-500 bg-orange-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      {selectedRole === "student" && (
                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">Người thuê phòng</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Tìm trọ, căn hộ & ở ghép</div>
                    </div>
                  </button>

                  {/* Option 2: Chủ trọ */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("landlord")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between",
                      selectedRole === "landlord"
                        ? "border-orange-500 bg-orange-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      {selectedRole === "landlord" && (
                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">Chủ nhà trọ</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Đăng tin & quản lý trọ</div>
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

              {/* GOOGLE SIGN IN (Hỗ trợ 1 chạm cho cả Người thuê & Chủ trọ) */}
              <>
                <button
                  id="btn-google-register"
                  type="button"
                  disabled={googleLoading || loading}
                  onClick={() => startGoogleOAuth(selectedRole)}
                  className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border bg-card text-foreground font-medium text-xs transition-all hover:bg-accent/10 hover:border-orange-300 mb-5 disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4" />
                      {selectedRole === "landlord" ? "Đăng ký nhanh với Google (Chủ trọ)" : "Đăng ký nhanh với Google"}
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700">Khu vực</Label>
                      <span className="text-[11px] text-slate-400">Tự do gõ hoặc chọn gợi ý</span>
                    </div>
                    <div className="relative mt-1">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="text"
                        list="register-campus-suggestions"
                        placeholder="Gõ khu vực (quận, phường, địa điểm gần nhất)..."
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="pl-10 pr-8 h-11 rounded-xl text-xs font-medium"
                      />
                      {campus && (
                        <button
                          type="button"
                          onClick={() => setCampus("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          title="Xóa để nhập lại"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <datalist id="register-campus-suggestions">
                      <option value="Ninh Kiều" />
                      <option value="Cái Răng" />
                      <option value="Bình Thủy" />
                      <option value="Phong Điền" />
                      <option value="Ô Môn" />
                      <option value="FPT Cần Thơ" />
                      <option value="ĐH Cần Thơ (Khu 2)" />
                      <option value="ĐH Y Dược Cần Thơ" />
                      <option value="ĐH Nam Cần Thơ" />
                      <option value="ĐH Tây Đô" />
                      <option value="ĐH Kỹ thuật - Công nghệ Cần Thơ" />
                      <option value="Cao đẳng Cần Thơ" />
                    </datalist>

                    {/* Chips gợi ý nhanh */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gợi ý:</span>
                      {[
                        "Ninh Kiều",
                        "Cái Răng",
                        "Bình Thủy",
                        "FPT Cần Thơ",
                        "ĐH Cần Thơ",
                        "ĐH Y Dược"
                      ].map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCampus(item)}
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[11px] transition border cursor-pointer",
                            campus === item || campus?.startsWith(item)
                              ? "bg-orange-100 text-orange-800 border-orange-300 font-bold"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 font-medium"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
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
              <div className="mb-4">
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
                  <strong className="text-slate-900">{email}</strong>.
                </p>
              </div>

              {/* Banner hướng dẫn kiểm tra Thư rác / Spam nổi bật */}
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/95 border border-amber-200 text-amber-950 text-xs shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-950 text-xs">
                        Chưa thấy thư trong Hộp thư đến?
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200/90 text-amber-900">
                        Kiểm tra Thư rác (Spam)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-amber-900/90 leading-relaxed">
                      Do cơ chế bảo mật của Gmail với tài khoản mới, email có thể được tự động chuyển vào mục <strong className="text-amber-950 font-bold underline decoration-amber-400">Thư rác (Spam)</strong> hoặc <strong className="text-amber-950 font-bold">Quảng cáo / Cập nhật</strong>.
                    </p>
                    <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                      👉 Anh/Chị hãy mở ứng dụng Gmail ➔ bấm vào <strong>Menu (3 gạch)</strong> ➔ chọn <strong>Thư rác (Spam)</strong> để lấy mã xác thực nhé!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center mb-6">
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
                <p className="text-[11px] text-muted-foreground mt-2">
                  Mã có hiệu lực trong vòng 1 phút (60 giây)
                </p>
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

          {/* ==================== BƯỚC 3: HỒ SƠ GIẤY TỜ CHỦ TRỌ ==================== */}
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

                  <button
                    type="button"
                    onClick={handleSkipVerification}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                  >
                    <span>Bỏ qua bước này, để sau</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Hồ sơ xác minh Chủ trọ
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Xác minh danh tính giúp phòng trọ của bạn nhận huy hiệu <strong>Safe Listing</strong> – tăng gấp 3 lần lượt liên hệ từ người thuê
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Số CCCD / CMND chủ sở hữu
                  </Label>
                  <Input
                    type="text"
                    placeholder="12 chữ số (VD: 092095001234) - Có thể bổ sung sau"
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

                {/* Giấy tờ chứng minh (CCCD + Hóa đơn điện nước / Hợp đồng ủy quyền / GPKD) */}
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

                {/* Nút hành động kép: Nút phụ Bỏ qua xác minh + Nút chính Gửi hồ sơ */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleSkipVerification}
                    disabled={loading}
                    className="w-full sm:w-1/2 h-11 rounded-xl font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:bg-slate-50 text-xs transition active:scale-[0.98] order-2 sm:order-1"
                  >
                    Bỏ qua xác minh, làm sau
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-1/2 h-11 rounded-xl font-bold text-white text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 order-1 sm:order-2"
                    style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi hồ sơ...
                      </>
                    ) : (
                      <>
                        Gửi hồ sơ xét duyệt
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== BƯỚC 4: THÔNG BÁO HOÀN TẤT ==================== */}
          {currentStep === 4 && (
            <div className="text-center py-4 animate-in zoom-in-95 duration-200">
              {skippedVerification ? (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 mb-2">
                    TRẠNG THÁI: TÀI KHOẢN ĐÃ KÍCH HOẠT (CƠ BẢN)
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Chào mừng bạn đến với Kênh Chủ Trọ SmartStay!
                  </h2>

                  <p className="text-slate-600 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                    Tài khoản của <strong>{fullName}</strong> đã sẵn sàng. Bạn có thể bắt đầu đăng tin và quản lý phòng trọ ngay bây giờ.
                  </p>

                  <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs space-y-2">
                    <div className="flex items-start gap-2.5 text-amber-950 font-semibold leading-relaxed">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Mẹo tăng 3x khách thuê:</strong> Bạn có thể bổ sung ảnh CCCD & Hóa đơn điện nước bất kỳ lúc nào tại mục <strong>Cài đặt</strong> để nhận huy hiệu <strong>Safe Listing</strong> và đưa tin lên Top 1 tìm kiếm.
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5">
                    <Link
                      to="/chu-tro"
                      className="w-full h-11 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-md hover:bg-orange-600 transition"
                    >
                      Vào Kênh Quản Trị Chủ Trọ ngay
                    </Link>
                    <Link
                      to="/"
                      className="w-full h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-50 transition"
                    >
                      Về trang chủ SmartStay
                    </Link>
                  </div>
                </>
              ) : (
                <>
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
                    Cảm ơn <strong>{fullName}</strong>. Hồ sơ đăng ký cơ sở trọ <strong>"{propertyName}"</strong> đã được chuyển đến Ban Quản Trị SmartStay để thẩm định và cấp huy hiệu Safe Listing.
                  </p>

                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Xác thực Gmail hoàn tất ({email})</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Đã gửi giấy tờ xác minh cơ sở trọ</span>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-200 text-slate-600">
                      <Info className="w-4 h-4 mt-0.5 text-orange-600 flex-shrink-0" />
                      <p className="leading-relaxed">
                        Tài khoản của bạn sẽ tự động được kích hoạt quyền Chủ trọ uy tín ngay khi Admin phê duyệt.
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
                </>
              )}
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
