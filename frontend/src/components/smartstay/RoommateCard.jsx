import React, { useState } from "react";
import {
    MapPin,
    Wallet,
    MessageCircle,
    Moon,
    Sun,
    Dog,
    Ban,
    Sparkles,
    Clock,
    Heart,
    MoreVertical,
    EyeOff,
    Flag,
    CheckCircle2
} from "lucide-react";
import { formatGender, getGenderBadgeClass } from "@/utils/genderLabel";
import { buildTags } from "@/utils/profileTags";
import { CompatibilityBadge, CompatibilitySummaryRow } from "@/components/smartstay/CompatibilityBadge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@/components/ui/popover";

/**
 * Sinh màu nền ổn định dựa trên mã băm của tên
 */
function getAvatarGradient(name = "") {
    const gradients = [
        "from-orange-500 to-amber-600",
        "from-emerald-500 to-teal-600",
        "from-blue-500 to-indigo-600",
        "from-indigo-500 to-purple-600",
        "from-rose-500 to-pink-600",
        "from-teal-500 to-cyan-600"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
}

/**
 * Lấy chữ cái viết tắt đầu của tên
 */
function getInitials(name = "") {
    if (!name) return "SS";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Kiểm tra xem bio có phải câu template mặc định hoặc để trống hay không
 */
function isDefaultOrEmptyBio(bio = "") {
    if (!bio || !bio.trim()) return true;
    const clean = bio.toLowerCase();
    if (
        clean.includes("văn minh, tôn trọng sinh hoạt chung") ||
        clean.includes("van minh, ton trong sinh hoat chung") ||
        clean.includes("mặc định")
    ) {
        return true;
    }
    return false;
}

/**
 * Render icon tương ứng cho tag
 */
function renderTagIcon(iconName) {
    switch (iconName) {
        case "Sun":
            return <Sun className="w-3 h-3 text-teal-600 shrink-0" />;
        case "Moon":
            return <Moon className="w-3 h-3 text-indigo-600 shrink-0" />;
        case "Clock":
            return <Clock className="w-3 h-3 text-indigo-600 shrink-0" />;
        case "Dog":
            return <Dog className="w-3 h-3 text-orange-600 shrink-0" />;
        case "Ban":
            return <Ban className="w-3 h-3 text-emerald-600 shrink-0" />;
        case "Sparkles":
        default:
            return <Sparkles className="w-2.5 h-2.5 text-accent shrink-0" />;
    }
}

export default function RoommateCard({
    item,
    onConnect,
    compat,
    isSaved = false,
    onToggleSave,
    onHide,
    onReport,
    onPromptCreateProfile
}) {
    const [imgError, setImgError] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);

    // Chuẩn hóa nhãn giới tính (Nam, Nữ, Khác hoặc null nếu không rõ)
    const genderLabel = formatGender(item.gender);
    const genderBadgeClass = getGenderBadgeClass(item.gender);

    // Xây dựng danh sách tag đã loại trùng theo ngữ nghĩa và phân nhóm
    const tags = buildTags(item);
    const visibleTags = tags.slice(0, 5);
    const extraTags = tags.slice(5);

    // Xác định trạng thái người ở ghép
    let statusLabel = "Đang tìm bạn ở ghép";
    let statusDotColor = "bg-emerald-500 animate-pulse";

    if (item.type === "has_room" || item.hasRoom) {
        statusLabel = "Đã có phòng, cần thêm người";
        statusDotColor = "bg-blue-500 animate-pulse";
    } else if (item.status === "paused" || item.status === "hidden") {
        statusLabel = "Tạm ngưng";
        statusDotColor = "bg-slate-400";
    } else if (item.statusLabel) {
        statusLabel = item.statusLabel;
    }

    // Avatar
    const avatarUrl = item.avatarUrl || item.avatar;
    const showImage = avatarUrl && !imgError;
    const initials = getInitials(item.name);
    const avatarGradient = getAvatarGradient(item.name || "SmartStay");

    // Bio
    const hasDefaultBio = isDefaultOrEmptyBio(item.description);
    const rawBio = item.description || "";
    const isLongBio = rawBio.length > 120;

    return (
        <div className="bg-card rounded-3xl border border-border/80 shadow-xs hover:shadow-lg transition-all duration-300 p-5 flex flex-col h-full group hover:border-accent/40 relative">
            {/* Thân thẻ (flex-1 để kéo giãn đều các thẻ trong hàng) */}
            <div className="flex-1 flex flex-col">
                {/* Header: Avatar, Tên, Huy hiệu giới tính, Điểm tương thích */}
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-2xl shrink-0 overflow-hidden shadow-xs border border-accent/20 group-hover:scale-105 transition-transform">
                            {showImage ? (
                                <img
                                    src={avatarUrl}
                                    alt={item.name}
                                    onError={() => setImgError(true)}
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                            ) : (
                                <div
                                    className={`w-full h-full rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-inner`}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>

                        {/* Tên, Giới tính, Tuổi, Campus */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-heading font-bold text-foreground text-sm truncate max-w-[140px] sm:max-w-[160px]" title={item.name}>
                                    {item.name}
                                </h3>
                                {item.verified && (
                                    <span
                                        className="inline-flex items-center text-blue-600 shrink-0"
                                        title="Đã xác thực sinh viên"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white" />
                                    </span>
                                )}
                                {genderLabel && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${genderBadgeClass}`}>
                                        {genderLabel}
                                    </span>
                                )}
                            </div>

                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                {item.age && <span>{item.age} tuổi</span>}
                                {item.campus && (
                                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 truncate max-w-[170px]" title={item.campus}>
                                        <MapPin className="w-3 h-3 text-accent shrink-0" />
                                        <span className="truncate">{item.campus}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Badge % Tương thích hoặc Lời mời tạo hồ sơ */}
                    <div className="shrink-0">
                        <CompatibilityBadge
                            compat={compat}
                            onPromptCreateProfile={onPromptCreateProfile}
                        />
                    </div>
                </div>

                {/* Ngân sách phòng dự kiến */}
                {item.budget && (
                    <div className="mt-1 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-amber-600" /> Ngân sách phòng:
                        </span>
                        <strong className="text-amber-900 font-bold">{item.budget} tr/tháng</strong>
                    </div>
                )}

                {/* Danh sách Tag đã khử trùng lặp và phân nhóm */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 min-h-[30px]">
                    {visibleTags.map((tag) => (
                        <span
                            key={tag.key}
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg border font-semibold ${tag.bgClass}`}
                        >
                            {renderTagIcon(tag.iconName)}
                            <span>{tag.label}</span>
                        </span>
                    ))}

                    {/* Chip "+N" nếu có trên 5 tag */}
                    {extraTags.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition cursor-pointer"
                                    title="Xem thêm các thói quen khác"
                                >
                                    +{extraTags.length}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-64 p-3 rounded-2xl shadow-xl bg-white text-xs border border-border">
                                <p className="font-bold text-slate-700 mb-2 text-[11px]">Các thói quen & đặc điểm khác:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {extraTags.map((t) => (
                                        <span
                                            key={t.key}
                                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-semibold ${t.bgClass}`}
                                        >
                                            {renderTagIcon(t.iconName)}
                                            <span>{t.label}</span>
                                        </span>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Dòng tóm tắt Giống / Khác kèm Popover chi tiết */}
                <CompatibilitySummaryRow
                    compat={compat}
                    candidateName={item.name}
                    onPromptCreateProfile={onPromptCreateProfile}
                />

                {/* Khung Bio giới thiệu bản thân */}
                <div className="mt-2.5 flex-1">
                    {hasDefaultBio ? (
                        <p className="text-[11px] text-muted-foreground italic bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                            Chưa có giới thiệu chi tiết
                        </p>
                    ) : (
                        <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                            <p className={bioExpanded ? "" : "line-clamp-3"}>
                                "{rawBio}"
                            </p>
                            {isLongBio && (
                                <button
                                    type="button"
                                    onClick={() => setBioExpanded(!bioExpanded)}
                                    className="mt-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                                >
                                    {bioExpanded ? "Thu gọn" : "Xem thêm"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== FOOTER CỦA THẺ (PIN Ở ĐÁY) ==================== */}
            <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between gap-2">
                {/* Dòng trạng thái động */}
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[150px]" title={statusLabel}>
                    <span className={`w-2 h-2 rounded-full ${statusDotColor} shrink-0`} />
                    <span className="truncate">{statusLabel}</span>
                </span>

                {/* Bộ nút hành động: Lưu, Menu 3 chấm, Nhắn tin */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Nút Tim Lưu */}
                    <button
                        type="button"
                        onClick={() => onToggleSave && onToggleSave(item)}
                        aria-label={isSaved ? "Bỏ lưu hồ sơ" : "Lưu hồ sơ"}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isSaved
                                ? "bg-rose-50 text-rose-600 border-rose-300 shadow-2xs"
                                : "bg-white hover:bg-rose-50/60 text-slate-400 hover:text-rose-500 border-border"
                        }`}
                        title={isSaved ? "Đã lưu hồ sơ này" : "Lưu hồ sơ"}
                    >
                        <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    {/* Menu 3 chấm: Ẩn hồ sơ & Báo cáo */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label="Tùy chọn khác"
                                className="p-2 rounded-xl border border-border bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5 shadow-xl bg-white border border-border text-xs">
                            <DropdownMenuItem
                                onClick={() => onHide && onHide(item)}
                                className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ẩn hồ sơ này</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onReport && onReport(item)}
                                className="flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                                <Flag className="w-3.5 h-3.5 text-rose-500" />
                                <span>Báo cáo hồ sơ</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Nút Nhắn tin kiểu Messenger (Giữ nguyên không đổi) */}
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
        </div>
    );
}