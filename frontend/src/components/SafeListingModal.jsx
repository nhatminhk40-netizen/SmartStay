import React, { useState, useEffect, useRef } from "react";
import { X, ShieldCheck, Phone, KeyRound, CreditCard, Check, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["phone", "otp", "pay", "done"];

export default function SafeListingModal({ open, onClose, onSafe }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sentOtp, setSentOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [paying, setPaying] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!open) return null;

  const sendOtp = () => {
    if (phone.length < 8) return;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setCountdown(60);
    setStep("otp");
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const verifyOtp = () => {
    const entered = otp.join("");
    if (entered.length < 6) return;
    if (entered !== sentOtp) {
      // demo: accept any 6 digits but show the sent one as hint
    }
    setStep("pay");
  };

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setStep("done");
      onSafe?.();
    }, 1800);
  };

  const reset = () => {
    setStep("phone"); setPhone(""); setOtp(["", "", "", "", "", ""]); setSentOtp(""); setCountdown(0);
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base">Safe Listing</div>
              <div className="text-[11px] text-emerald-100">Xác thực OTP + thanh toán tự động</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-5 pt-4 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-full transition-colors", i <= stepIndex ? "bg-emerald-500" : "bg-slate-200")} />
            </div>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step === "phone" && (
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Đăng tin Safe Listing</h3>
              <p className="text-sm text-slate-500 mb-4">Nhập số điện thoại để nhận mã OTP xác thực.</p>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <Phone className="w-3.5 h-3.5" /> Số điện thoại
              </label>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm">+84</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9xx xxx xxx"
                  className="flex-1 px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-semibold"
                />
              </div>
              <button
                onClick={sendOtp}
                disabled={phone.length < 8}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Gửi mã OTP
              </button>
            </div>
          )}

          {step === "otp" && (
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Nhập mã OTP</h3>
              <p className="text-sm text-slate-500 mb-1">Mã 6 số đã gửi tới <span className="font-semibold text-slate-700">+84 {phone}</span></p>
              <p className="text-[11px] text-emerald-600 font-semibold mb-4">Demo · mã của bạn: <span className="font-mono tracking-widest">{sentOtp}</span></p>
              <div className="flex gap-1.5 justify-between mb-4">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus(); }}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-slate-500">
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : <button onClick={sendOtp} className="text-emerald-600 font-semibold">Gửi lại mã</button>}
                </span>
                <span className="text-slate-400">OTP xác thực số điện thoại</span>
              </div>
              <button
                onClick={verifyOtp}
                disabled={otp.join("").length < 6}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Xác nhận OTP
              </button>
            </div>
          )}

          {step === "pay" && (
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Cổng thanh toán</h3>
              <p className="text-sm text-slate-500 mb-4">Phí đăng tin Safe: <span className="font-bold text-slate-900">25.000đ</span> · webhook tự động xác nhận.</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: "vnpay", name: "VNPay", color: "bg-blue-600" },
                  { id: "momo", name: "MoMo", color: "bg-pink-500" },
                  { id: "zalopay", name: "ZaloPay", color: "bg-indigo-600" },
                ].map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 hover:border-emerald-400 cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm", p.color)}>
                      {p.name[0]}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">{p.name}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  <span className="font-bold">Minh · Backend:</span> webhook từ cổng thanh toán tự động xác nhận giao dịch → hệ thống gắn <code className="font-mono">safe_badge = true</code> — không cần admin duyệt tay.
                </p>
              </div>
              <button
                onClick={pay}
                disabled={paying}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý thanh toán…</> : <><CreditCard className="w-4 h-4" /> Thanh toán 25.000đ</>}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <BadgeCheck className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-xl mb-1">Đã đăng tin – gắn nhãn Safe</h3>
              <p className="text-sm text-slate-500 mb-5">Tin của bạn đã được xác thực và tự động gắn badge Safe Listing.</p>
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold mb-5">
                <ShieldCheck className="w-4 h-4" /> Safe Listing
              </div>
              <button onClick={() => { reset(); onClose(); }} className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}