import React, { useState } from "react";
import {
    X,
    ChevronRight,
    ChevronLeft,
    Check,
    User,
    Sparkles,
    Dog,
    Ban,
    Moon,
    Sun,
    Wallet,
    Home,
    Search,
    Heart,
    Info,
    CheckCircle2,
    Loader2,
    Eye,
    MessageSquare,
    Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Field } from "@/components/smartstay/FormBits";
import RoommateCard from "@/components/smartstay/RoommateCard";
import { formatGender } from "@/utils/genderLabel";

const CAMPUSES = [
    "ĐH Cần Thơ",
    "ĐH FPT Cần Thơ",
    "ĐH Y Dược Cần Thơ",
    "ĐH Nam Cần Thơ"
];

const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80"
];

const SUGGESTED_INTERESTS = [
    "Đọc sách",
    "Chơi game",
    "Học code",
    "Tập gym",
    "Tự nấu ăn",
    "Nghe nhạc",
    "Xem phim",
    "Du lịch",
    "Cà phê cuối tuần",
    "Thích yên tĩnh",
    "Chạy bộ",
    "Học ngoại ngữ"
];

const BIO_SAMPLES = [
    "Sinh viên K18 FPT chuyên ngành KTPM, tính tình hòa đồng, giữ vệ sinh chung, tìm bạn cùng trường share tiền phòng.",
    "Mình học ĐH Y Dược, cần không gian yên tĩnh ôn bài buổi tối, không hút thuốc, sống ngăn nắp, mong tìm bạn cùng chí hướng.",
    "Sinh viên ĐH Cần Thơ, có nuôi 1 bé mèo ngoan và sạch sẽ, thích tự nấu ăn cuối tuần, tìm bạn yêu pet để ở ghép lâu dài."
];

export default function RoommatePostWizard({ onClose, onSubmit, initialUser, initialData }) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Dữ liệu Form chuẩn hóa
    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                name: initialData.name || initialUser?.fullName || initialUser?.name || "",
                age: initialData.age || 20,
                gender: initialData.gender || "Nam",
                campus: initialData.campus || "ĐH Cần Thơ",
                area: initialData.area || "Ninh Kiều, Cần Thơ",
                avatarUrl: initialData.avatarUrl || "",
                contact: initialData.contact || initialData.rawContact || initialUser?.phone || "",
                allowZalo: initialData.allowZalo !== undefined ? initialData.allowZalo : true,
                lifestyle: {
                    smoking: initialData.lifestyle?.smoking || (initialData.smokingDrinking === "none" ? "no" : (initialData.smokingDrinking === "smoker_friendly" ? "yes" : "tolerate")),
                    sleep: initialData.lifestyle?.sleep || (initialData.sleepSchedule === "early_bird" ? "early" : (initialData.sleepSchedule === "night_owl" ? "night" : "normal")),
                    tidiness: initialData.lifestyle?.tidiness || 4,
                    cooking: initialData.lifestyle?.cooking !== undefined ? initialData.lifestyle.cooking : true,
                    guests: initialData.lifestyle?.guests || "sometimes",
                    pet: initialData.lifestyle?.pet || (initialData.hasPet ? "has" : "no"),
                    noise: initialData.lifestyle?.noise || 2
                },
                type: initialData.type || (initialData.hasRoom ? "has_room" : "need_room"),
                budget: initialData.budget || 2.2,
                roomAddress: initialData.roomAddress || "",
                bio: initialData.bio || initialData.description || "",
                interests: Array.isArray(initialData.interests) && initialData.interests.length > 0
                    ? initialData.interests
                    : ["Học code", "Tự nấu ăn"]
            };
        }
        return {
            name: initialUser?.fullName || initialUser?.name || "",
            age: 20,
            gender: "Nam",
            campus: "ĐH Cần Thơ",
            area: "Ninh Kiều, Cần Thơ",
            avatarUrl: "",
            contact: initialUser?.phone || "",
            allowZalo: true,
            lifestyle: {
                smoking: "no",
                sleep: "early",
                tidiness: 4,
                cooking: true,
                guests: "sometimes",
                pet: "no",
                noise: 2
            },
            type: "need_room",
            budget: 2.2,
            roomAddress: "",
            bio: "",
            interests: ["Học code", "Tự nấu ăn"]
        };
    });

    const [errorMsg, setErrorMsg] = useState("");

    // Validate theo từng bước
    const validateStep = (currentStep) => {
        setErrorMsg("");
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setErrorMsg("Vui lòng nhập tên hiển thị.");
                return false;
            }
            if (!formData.age || formData.age < 16 || formData.age > 45) {
                setErrorMsg("Vui lòng nhập tuổi hợp lệ (từ 16 đến 45).");
                return false;
            }
            if (!formData.contact.trim() || formData.contact.replace(/\D/g, "").length < 9) {
                setErrorMsg("Vui lòng nhập số Zalo hoặc SĐT liên hệ hợp lệ (ít nhất 9 số).");
                return false;
            }
            return true;
        }

        if (currentStep === 3) {
            if (formData.budget <= 0) {
                setErrorMsg("Vui lòng chọn ngân sách phòng dự kiến hợp lệ.");
                return false;
            }
            return true;
        }

        if (currentStep === 4) {
            if (formData.bio.length > 300) {
                setErrorMsg("Giới thiệu bản thân không được vượt quá 300 ký tự.");
                return false;
            }
            return true;
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((s) => Math.min(5, s + 1));
        }
    };

    const handleBack = () => {
        setErrorMsg("");
        setStep((s) => Math.max(1, s - 1));
    };

    // Toggle sở thích (tối đa 5 tag)
    const handleToggleInterest = (tag) => {
        const current = formData.interests;
        if (current.includes(tag)) {
            setFormData({
                ...formData,
                interests: current.filter((t) => t !== tag)
            });
        } else {
            if (current.length >= 5) {
                setErrorMsg("Bạn chỉ có thể chọn tối đa 5 sở thích.");
                return;
            }
            setErrorMsg("");
            setFormData({
                ...formData,
                interests: [...current, tag]
            });
        }
    };

    // Lắp ráp dữ liệu chuẩn hóa gửi lên API
    const buildFinalPayload = () => {
        const { smoking, sleep, pet, cooking, tidiness, noise, guests } = formData.lifestyle;

        // Xây dựng chuỗi habits tương thích ngược với hệ thống
        const habitTokens = [];
        if (smoking === "no") habitTokens.push("Không hút thuốc");
        else if (smoking === "tolerate") habitTokens.push("Chấp nhận người hút thuốc");
        else habitTokens.push("Có hút thuốc");

        if (sleep === "early") habitTokens.push("Ngủ sớm dậy sớm");
        else if (sleep === "night") habitTokens.push("Cú đêm / Học khuya");
        else habitTokens.push("Giờ giấc linh hoạt");

        if (pet === "has") habitTokens.push("Có nuôi thú cưng");
        else if (pet === "no") habitTokens.push("Không nuôi pet");
        else habitTokens.push("Yêu thích thú cưng");

        if (cooking) habitTokens.push("Tự nấu ăn tại phòng");
        if (tidiness >= 4) habitTokens.push("Gọn gàng sạch sẽ");
        if (noise <= 2) habitTokens.push("Thích yên tĩnh");

        habitTokens.push(...formData.interests);

        return {
            name: formData.name.trim(),
            gender: formatGender(formData.gender) || "Nam",
            age: Number(formData.age),
            campus: formData.campus,
            budget: Number(formData.budget),
            type: formData.type,
            hasRoom: formData.type === "has_room",
            avatarUrl: formData.avatarUrl || null,
            contact: formData.contact.trim(),
            rawContact: formData.contact.trim(),
            allowZalo: formData.allowZalo,
            allowShareContact: formData.allowZalo,
            lifestyle: formData.lifestyle,
            smokingDrinking: smoking === "no" ? "none" : (smoking === "yes" ? "smoker_friendly" : "sometimes"),
            sleepSchedule: sleep === "early" ? "early_bird" : (sleep === "night" ? "night_owl" : "flexible"),
            hasPet: pet === "has",
            petPolicy: pet === "has" ? "pet_friendly" : (pet === "no" ? "no_pet" : "friendly"),
            cleanliness: tidiness >= 3 ? "daily" : "weekly",
            guestPolicy: guests === "rare" ? "strict" : (guests === "often" ? "open" : "ask_first"),
            habits: habitTokens.filter(Boolean).join(", "),
            description: formData.bio.trim() || `Sinh viên ${formData.campus}, tìm bạn cùng phòng văn minh, cùng chí hướng.`,
            interests: formData.interests,
            verified: false,
            createdAt: new Date().toISOString()
        };
    };

    const handleFormSubmit = async () => {
        if (!validateStep(4)) return;
        setSubmitting(true);
        try {
            const payload = buildFinalPayload();
            if (onSubmit) {
                await onSubmit(payload);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Dữ liệu mock preview cho Step 5
    const previewProfile = buildFinalPayload();

    return (
        <div className="bg-card rounded-3xl border border-accent/40 shadow-2xl p-6 md:p-8 mb-8 animate-in fade-in duration-300 relative overflow-hidden">
            {/* Header: Tiêu đề + Tiến độ + Nút Đóng */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/20 to-orange-100 flex items-center justify-center text-accent shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-foreground text-lg">
                            Đăng tìm bạn ở ghép (4 Bước)
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {step === 1 && "Bước 1: Thông tin cơ bản & Trường học"}
                            {step === 2 && "Bước 2: Lối sống & Thói quen sinh hoạt"}
                            {step === 3 && "Bước 3: Ngân sách & Loại hình phòng"}
                            {step === 4 && "Bước 4: Giới thiệu bản thân & Sở thích"}
                            {step === 5 && "Bước 5: Xem trước thẻ hồ sơ trước khi đăng"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Thanh tiến trình Stepper */}
            <div className="my-5">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-accent">Bước {step} / 5</span>
                    <span className="text-muted-foreground">{step * 20}% hoàn thành</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-accent to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${step * 20}%` }}
                    />
                </div>
            </div>

            {/* Báo lỗi nếu có */}
            {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* ==================== BƯỚC 1: THÔNG TIN CƠ BẢN ==================== */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <Field label="Tên hiển thị (*)">
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Hoàng Nam (K18 FPT)"
                            required
                        />
                    </Field>

                    <Field label="Tuổi (*)">
                        <Input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            min={16}
                            max={45}
                        />
                    </Field>

                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Giới tính (*)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {["Nam", "Nữ", "Khác"].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                        formData.gender === g
                                            ? "bg-accent text-accent-foreground border-accent shadow-xs"
                                            : "bg-white border-border text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    {g === "Nam" && "👦 Nam"}
                                    {g === "Nữ" && "👧 Nữ"}
                                    {g === "Khác" && "✨ Khác"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Field label="Campus / Trường học (*)">
                        <select
                            value={formData.campus}
                            onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                            className="w-full py-2 px-3 rounded-2xl border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-accent/30"
                        >
                            {CAMPUSES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Số Zalo / Liên hệ (*)">
                        <Input
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            placeholder="0912 345 678"
                            required
                        />
                    </Field>

                    <div className="flex items-center gap-2 pt-6">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.allowZalo}
                                onChange={(e) => setFormData({ ...formData, allowZalo: e.target.checked })}
                                className="w-4 h-4 rounded text-accent accent-accent"
                            />
                            <span>Cho phép người xem mở Zalo nhắn tin trực tiếp</span>
                        </label>
                    </div>

                    {/* Chọn Avatar mẫu nhanh */}
                    <div className="md:col-span-2 pt-2">
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                            Chọn ảnh đại diện sinh viên (hoặc để trống để sinh chữ cái đầu):
                        </label>
                        <div className="flex items-center gap-3 overflow-x-auto pb-1">
                            {PRESET_AVATARS.map((url, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatarUrl: url })}
                                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                                        formData.avatarUrl === url
                                            ? "border-accent ring-2 ring-accent/30 scale-105"
                                            : "border-transparent opacity-75 hover:opacity-100"
                                    }`}
                                >
                                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                                </button>
                            ))}
                            {formData.avatarUrl && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatarUrl: "" })}
                                    className="text-xs text-rose-600 hover:underline px-2"
                                >
                                    Bỏ ảnh
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BƯỚC 2: LỐI SỐNG & THÓI QUEN ==================== */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    {/* Hút thuốc */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                        <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <Ban className="w-4 h-4 text-emerald-600" />
                            <span>1. Khói thuốc lá:</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                { id: "no", label: "🚭 Tuyệt đối không hút" },
                                { id: "tolerate", label: "🤝 Không hút, nhưng chấp nhận" },
                                { id: "yes", label: "🚬 Có hút thuốc" }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: { ...formData.lifestyle, smoking: opt.id }
                                        })
                                    }
                                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                                        formData.lifestyle.smoking === opt.id
                                            ? "bg-emerald-50 text-emerald-950 border-emerald-400 shadow-2xs"
                                            : "bg-white border-border text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Giờ ngủ */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                        <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <Moon className="w-4 h-4 text-indigo-600" />
                            <span>2. Giờ giấc đi ngủ:</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                { id: "early", label: "☀️ Ngủ sớm dậy sớm (< 23h)" },
                                { id: "normal", label: "⏰ Bình thường (23h - 0h)" },
                                { id: "night", label: "🌙 Cú đêm / Học khuya (> 0h)" }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: { ...formData.lifestyle, sleep: opt.id }
                                        })
                                    }
                                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                                        formData.lifestyle.sleep === opt.id
                                            ? "bg-indigo-50 text-indigo-950 border-indigo-400 shadow-2xs"
                                            : "bg-white border-border text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Thú cưng */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                        <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <Dog className="w-4 h-4 text-orange-500" />
                            <span>3. Thú cưng (chó/mèo):</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                { id: "no", label: "🚫 Không nuôi pet" },
                                { id: "tolerate", label: "🐾 Thích pet / Chấp nhận bạn nuôi" },
                                { id: "has", label: "🐱 Đang nuôi thú cưng" }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: { ...formData.lifestyle, pet: opt.id }
                                        })
                                    }
                                    className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                                        formData.lifestyle.pet === opt.id
                                            ? "bg-orange-50 text-orange-950 border-orange-400 shadow-2xs"
                                            : "bg-white border-border text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gọn gàng (1 - 5) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <label className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>4. Mức độ ngăn nắp / dọn dẹp vệ sinh:</span>
                            </label>
                            <span className="font-bold text-accent">
                                {formData.lifestyle.tidiness}/5 (
                                {formData.lifestyle.tidiness <= 2 ? "Thoải mái" : (formData.lifestyle.tidiness >= 4 ? "Rất ngăn nắp" : "Gọn gàng")}
                                )
                            </span>
                        </div>
                        <Slider
                            value={[formData.lifestyle.tidiness]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={(val) =>
                                setFormData({
                                    ...formData,
                                    lifestyle: { ...formData.lifestyle, tidiness: val[0] }
                                })
                            }
                        />
                    </div>

                    {/* Nấu ăn & Khách về phòng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                            <label className="font-bold text-slate-800 block mb-2">
                                5. Nấu ăn tại phòng:
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { val: true, label: "🍳 Thường nấu ăn" },
                                    { val: false, label: "🍜 Ít nấu / Ăn ngoài" }
                                ].map((opt) => (
                                    <button
                                        key={String(opt.val)}
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                lifestyle: { ...formData.lifestyle, cooking: opt.val }
                                            })
                                        }
                                        className={`flex-1 py-2 rounded-xl border text-center font-semibold transition cursor-pointer ${
                                            formData.lifestyle.cooking === opt.val
                                                ? "bg-accent text-accent-foreground border-accent shadow-2xs"
                                                : "bg-white border-border text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-border">
                            <label className="font-bold text-slate-800 block mb-2">
                                6. Dẫn bạn / người thân về phòng:
                            </label>
                            <div className="flex gap-1.5">
                                {[
                                    { id: "rare", label: "Hiếm khi" },
                                    { id: "sometimes", label: "Hỏi trước" },
                                    { id: "often", label: "Thoải mái" }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                lifestyle: { ...formData.lifestyle, guests: opt.id }
                                            })
                                        }
                                        className={`flex-1 py-2 rounded-xl border text-center font-semibold transition text-[11px] cursor-pointer ${
                                            formData.lifestyle.guests === opt.id
                                                ? "bg-accent text-accent-foreground border-accent shadow-2xs"
                                                : "bg-white border-border text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BƯỚC 3: NGÂN SÁCH & PHÒNG ==================== */}
            {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                            Bạn đã có phòng trọ hay đang tìm thuê chung? (*)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: "need_room" })}
                                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                                    formData.type === "need_room"
                                        ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs"
                                        : "bg-white border-border text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <Search className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm">Chưa có phòng, tìm bạn thuê chung</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Tìm người có cùng ngân sách và trường học để cùng đi tìm phòng thuê.
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: "has_room" })}
                                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                                    formData.type === "has_room"
                                        ? "bg-blue-50 border-blue-400 text-blue-950 shadow-xs"
                                        : "bg-white border-border text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <Home className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm">Tôi đã có phòng, cần thêm người</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Phòng trọ đang ở còn trống chỗ, muốn tìm bạn dọn vào ở cùng share tiền.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Ngân sách phòng dự kiến */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Wallet className="w-4 h-4 text-amber-600" />
                                <span>Ngân sách bạn sẵn sàng chi trả:</span>
                            </label>
                            <span className="font-heading font-bold text-amber-950 text-base">
                                {formData.budget} triệu/tháng
                            </span>
                        </div>
                        <Slider
                            value={[formData.budget]}
                            min={1.0}
                            max={5.0}
                            step={0.1}
                            onValueChange={(val) => setFormData({ ...formData, budget: val[0] })}
                        />
                        <div className="flex justify-between text-[11px] text-amber-800/80 mt-2 font-medium">
                            <span>1.0 tr</span>
                            <span>2.5 tr (Phổ biến)</span>
                            <span>5.0 tr</span>
                        </div>
                    </div>

                    {formData.type === "has_room" && (
                        <Field label="Địa chỉ phòng trọ hiện tại (tùy chọn):">
                            <Input
                                value={formData.roomAddress}
                                onChange={(e) => setFormData({ ...formData, roomAddress: e.target.value })}
                                placeholder="Ví dụ: Hẻm 51 đường 3 Tháng 2, Xuân Khánh, Ninh Kiều"
                            />
                        </Field>
                    )}
                </div>
            )}

            {/* ==================== BƯỚC 4: GIỚI THIỆU & SỞ THÍCH ==================== */}
            {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">
                                Giới thiệu ngắn về bản thân & Tiêu chí bạn cùng phòng:
                            </label>
                            <span
                                className={`text-[10px] font-semibold ${
                                    formData.bio.length >= 300 ? "text-rose-600 font-bold" : "text-muted-foreground"
                                }`}
                            >
                                {formData.bio.length}/300 ký tự
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            maxLength={300}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 300) })}
                            placeholder="Chia sẻ đôi nét về tính cách, thói quen học tập của bạn..."
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-input text-xs focus:ring-2 focus:ring-accent/30 outline-none leading-relaxed"
                        />

                        {/* Gợi ý câu mẫu nhanh */}
                        <div className="mt-2">
                            <span className="text-[11px] text-slate-500 font-medium block mb-1">
                                Gợi ý câu mẫu (bấm để chọn nhanh):
                            </span>
                            <div className="space-y-1">
                                {BIO_SAMPLES.map((sample, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, bio: sample })}
                                        className="text-left w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-[11px] text-slate-600 transition block truncate"
                                    >
                                        💡 "{sample}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sở thích (Interests) tối đa 5 tag */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">
                                Sở thích cá nhân (chọn tối đa 5 tag):
                            </label>
                            <span className="text-[11px] text-accent font-bold">
                                {formData.interests.length}/5 tag
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_INTERESTS.map((tag) => {
                                const selected = formData.interests.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleToggleInterest(tag)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                                            selected
                                                ? "bg-accent text-accent-foreground border-accent shadow-2xs"
                                                : "bg-white text-slate-700 border-border hover:bg-slate-50"
                                        }`}
                                    >
                                        {selected ? "✓ " : "+ "}
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BƯỚC 5: XEM TRƯỚC THẺ HỒ SƠ (PREVIEW) ==================== */}
            {step === 5 && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            Dưới đây là hình ảnh thẻ hồ sơ của bạn khi hiển thị với tất cả các bạn sinh viên khác trên SmartStay:
                        </span>
                    </div>

                    <div className="max-w-sm mx-auto shadow-lg rounded-3xl overflow-hidden border border-accent/30">
                        <RoommateCard
                            item={previewProfile}
                            compat={{ score: 100, matched: ["Chính là hồ sơ của bạn"], different: [] }}
                            isSaved={false}
                        />
                    </div>
                </div>
            )}

            {/* ==================== FOOTER ĐIỀU HƯỚNG WIZARD ==================== */}
            <div className="flex items-center justify-between pt-5 mt-6 border-t border-border">
                {step > 1 ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="rounded-full text-xs font-bold px-5 h-9"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-full text-xs font-semibold text-slate-500 h-9"
                    >
                        Hủy bỏ
                    </Button>
                )}

                {step < 5 ? (
                    <Button
                        type="button"
                        onClick={handleNext}
                        className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-bold px-6 h-9"
                    >
                        Tiếp tục <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={handleFormSubmit}
                        className="rounded-full bg-gradient-to-r from-accent to-orange-500 hover:opacity-95 text-white text-xs font-bold px-8 h-10 shadow-md active:scale-95 transition"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng tin...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-1.5" /> Xác nhận & Đăng tìm bạn
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
