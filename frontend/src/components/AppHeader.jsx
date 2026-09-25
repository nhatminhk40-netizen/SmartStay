import React from "react";
import { ShieldCheck, Bell, UserCircle2, Plus } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-white/50">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 text-lg tracking-tight">SmartStay</div>
            <div className="text-[10px] text-slate-500 font-body uppercase tracking-wider font-semibold">Cần Thơ · Sinh viên</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <span className="px-3 py-2 rounded-lg text-sm font-bold text-slate-900 bg-slate-100">Khám phá</span>
          <span className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">Ghép bạn</span>
          <span className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">Chuyển trọ</span>
          <span className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">Pass phòng</span>
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Đăng tin
          </button>
          <button className="w-9 h-9 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors ring-2 ring-white">
            <UserCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}