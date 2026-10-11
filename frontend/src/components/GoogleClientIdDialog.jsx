import React, { useState } from "react";
import { X, Key, ExternalLink, Check } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { setGoogleClientId, getGoogleClientId } from "@/lib/googleAuth";

export default function GoogleClientIdDialog({ open, onClose, onSaveAndContinue }) {
  const [clientId, setClientId] = useState(getGoogleClientId());
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId.trim()) {
      setError("Vui lòng nhập Google Client ID của bạn.");
      return;
    }
    setGoogleClientId(clientId.trim());
    onClose();
    onSaveAndContinue?.(clientId.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cấu hình Google OAuth</h3>
              <p className="text-xs text-slate-500">Liên kết trực tiếp tới tài khoản Google thật</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            Để mở cửa sổ popup đăng nhập chính thức từ Google (<strong>accounts.google.com</strong>), ứng dụng cần một <strong>Client ID</strong> từ Google Cloud Console.
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Google OAuth 2.0 Client ID:
            </label>
            <input
              type="text"
              required
              placeholder="ví dụ: 123456789-xxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              autoFocus
            />
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>• Bạn có thể lấy Client ID miễn phí tại:{" "}
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noreferrer"
                className="text-orange-600 hover:underline font-semibold inline-flex items-center gap-1"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p>• Thêm <code>http://localhost:5173</code> vào <em>Authorized JavaScript origins</em>.</p>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" />
            Lưu & Mở cửa sổ Google
          </button>
        </form>
      </div>
    </div>
  );
}
