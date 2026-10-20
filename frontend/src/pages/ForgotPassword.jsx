import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import EmailOtpVerification from "@/components/EmailOtpVerification";

export default function ForgotPassword() {
  const navigate = useNavigate();
  // flowStep: 1 = Email OTP verification, 2 = Set new password, 3 = Success
  const [flowStep, setFlowStep] = useState(1);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Callback khi xác thực OTP email thành công
  const handleOtpVerified = ({ email, resetToken }) => {
    setVerifiedEmail(email);
    setResetToken(resetToken);
    setFlowStep(2);
  };

  // Callback khi submit đổi mật khẩu mới
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword({
        email: verifiedEmail,
        resetToken,
        newPassword
      });
      setFlowStep(3);
    } catch (err) {
      setError(err.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bước 1: Xác thực OTP qua Email (Gmail SMTP) */}
        {flowStep === 1 && (
          <div className="space-y-4">
            <EmailOtpVerification
              purpose="RESET_PASSWORD"
              title="Khôi phục mật khẩu"
              subtitle="Nhập email tài khoản SmartStay để nhận mã xác thực OTP qua Gmail."
              onSuccess={handleOtpVerified}
              onCancel={() => navigate("/login")}
            />
            <div className="text-center">
              <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-orange-600 transition inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {/* Bước 2: Thiết lập mật khẩu mới */}
        {flowStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Đặt lại mật khẩu mới
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản: <strong className="text-slate-800">{verifiedEmail}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Mật khẩu mới *</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới *</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Lưu mật khẩu mới"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Bước 3: Đổi mật khẩu thành công */}
        {flowStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Đổi mật khẩu thành công!
            </h3>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              Mật khẩu cho tài khoản <strong>{verifiedEmail}</strong> đã được cập nhật thành công. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition"
            >
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
