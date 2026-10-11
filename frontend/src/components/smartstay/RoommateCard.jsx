import React from "react";
import {
    MapPin,
    Wallet,
    User,
    Sparkles,
    ShieldCheck,
    MessageCircle,
    Moon,
    Sun,
    Dog,
    Ban
} from "lucide-react";

export default function RoommateCard({ item, onConnect }) {
    const habits = (item.habits || "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

    // Xác định các đặc điểm nổi bật để gắn huy hiệu trực quan
    const isNoSmoking = item.smokingDrinking === 'none' || item.habits?.toLowerCase().includes("không hút");
    const hasPet = item.hasPet || item.habits?.toLowerCase().includes("mèo") || item.habits?.toLowerCase().includes("chó") || item.habits?.toLowerCase().includes("thú cưng");
    const isNightOwl = item.sleepSchedule === 'night_owl' || item.habits?.toLowerCase().includes("khuya") || item.habits?.toLowerCase().includes("cú đêm");
    const isEarlyBird = item.sleepSchedule === 'early_bird' || item.habits?.toLowerCase().includes("ngủ sớm");

    return (
        <div className="bg-card rounded-3xl border border-border/70 shadow-xs hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between group hover:border-accent/40">
            <div>
                {/* Header: Avatar, Tên, Giới tính, Campus */}
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-orange-100 flex items-center justify-center shrink-0 border border-accent/20 shadow-xs group-hover:scale-105 transition-transform">
                        <User className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-bold text-foreground text-sm truncate">{item.name}</h3>
                            {item.gender && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    item.gender === 'Nữ' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                }`}>
                                    {item.gender}
                                </span>
                            )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                            {item.age && <span>{item.age} tuổi</span>}
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <MapPin className="w-3 h-3 text-accent" /> {item.campus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ngân sách dự kiến */}
                {item.budget && (
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-amber-600" /> Ngân sách phòng:
                        </span>
                        <strong className="text-amber-900 font-bold">{item.budget} tr/tháng</strong>
                    </div>
                )}

                {/* Các huy hiệu thói quen trực quan */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {hasPet && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200/60 font-semibold">
                            <Dog className="w-3 h-3 text-orange-600" /> Có thú cưng / Yêu pet
                        </span>
                    )}

                    {isNoSmoking && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold">
                            <Ban className="w-3 h-3 text-emerald-600" /> Không hút thuốc
                        </span>
                    )}

                    {isNightOwl && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold">
                            <Moon className="w-3 h-3 text-indigo-600" /> Cú đêm / Học khuya
                        </span>
                    )}

                    {isEarlyBird && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 font-semibold">
                            <Sun className="w-3 h-3 text-teal-600" /> Ngủ sớm dậy sớm
                        </span>
                    )}

                    {/* Các tag thói quen tự do còn lại */}
                    {habits.slice(0, 2).map((h) => (
                        <span
                            key={h}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60"
                        >
                            <Sparkles className="w-2.5 h-2.5 text-accent" />
                            {h}
                        </span>
                    ))}
                </div>

                {/* Mô tả bản thân */}
                {item.description && (
                    <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded-xl">
                        "{item.description}"
                    </p>
                )}
            </div>

            {/* Footer: Bảo vệ quyền riêng tư (Không để lộ SĐT thô) + Nút Nhắn tin kiểu Messenger */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="SmartStay bảo mật số liên lạc của sinh viên để tránh spam">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>SĐT ẩn bảo mật</span>
                </div>

                <button
                    type="button"
                    onClick={() => onConnect && onConnect(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white text-xs font-bold shadow-xs hover:shadow-md hover:opacity-95 transition-all active:scale-95 cursor-pointer"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Nhắn tin</span>
                </button>
            </div>
        </div>
    );
}