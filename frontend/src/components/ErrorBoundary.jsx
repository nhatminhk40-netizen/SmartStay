import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 mb-1.5">
                Đã xảy ra lỗi hiển thị giao diện
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống vừa phát hiện sự cố không mong muốn trong quá trình render. Chúng tôi đã chặn lỗi trắng trang để bảo vệ dữ liệu của bạn.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 bg-slate-100 rounded-xl text-left text-[11px] font-mono text-slate-700 overflow-x-auto max-h-24">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Về trang chủ
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
