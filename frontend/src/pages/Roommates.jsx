import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
    UserPlus,
    Loader2,
    Search,
    SlidersHorizontal,
    Dog,
    Ban,
    Moon,
    Sun,
    MapPin,
    Wallet,
    X,
    MessageCircle,
    Copy,
    Check,
    ExternalLink,
    Send,
    Sparkles,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import RoommateCard from "@/components/smartstay/RoommateCard";
import { Field, EmptyState, Select } from "@/components/smartstay/FormBits";
import { useAuth } from "@/lib/AuthContext";

const campuses = ["ĐH Cần Thơ", "ĐH Y Dược", "ĐH Nam Cần Thơ", "ĐH FPT"];

const emptyForm = {
    name: "",
    gender: "Nam",
    age: "20",
    campus: "ĐH Cần Thơ",
    budget: "2.2",
    hasPet: "no",
    smokingDrinking: "none",
    sleepSchedule: "flexible",
    habits: "",
    description: "",
    contact: "",
};

export default function Roommates() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    // Thanh tùy chỉnh bộ lọc (Filter Bar)
    const [searchKeyword, setSearchKeyword] = useState("");
    const [petFilter, setPetFilter] = useState("all"); // 'all', 'has_pet', 'no_pet'
    const [smokingFilter, setSmokingFilter] = useState("all"); // 'all', 'none'
    const [sleepFilter, setSleepFilter] = useState("all"); // 'all', 'early', 'night_owl'
    const [campusFilter, setCampusFilter] = useState("all");
    const [genderFilter, setGenderFilter] = useState("all");
    const [budgetFilter, setBudgetFilter] = useState("all"); // 'all', 'under_2', '2_to_3', 'over_3'

    // Modal Hộp thoại Nhắn tin Messenger / Zalo
    const [selectedRoommate, setSelectedRoommate] = useState(null);
    const [customMessage, setCustomMessage] = useState("");
    const [copiedMessage, setCopiedMessage] = useState(false);
    const [sentStatus, setSentStatus] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await base44.entities.Roommate.filter(
                {},
                { sort: "-created_date", limit: 50 }
            );
            setItems(res.items || []);
        } catch {
            setItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    // Mở hộp thoại nhắn tin
    const handleOpenConnect = (person) => {
        setSelectedRoommate(person);
        setCustomMessage(
            `Chào bạn ${person.name}, mình thấy bạn đang tìm bạn ở ghép cùng trường ${person.campus} trên SmartStay (ngân sách ~${person.budget}tr/tháng). Thói quen của chúng mình khá tương đồng. Mình muốn kết nối để trao đổi thêm về việc ở ghép cùng bạn nhé!`
        );
        setCopiedMessage(false);
        setSentStatus(false);
    };

    // Sao chép tin nhắn
    const handleCopyMessage = () => {
        navigator.clipboard.writeText(customMessage);
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2200);
    };

    // Mở liên kết nhắn tin Zalo
    const handleOpenZalo = () => {
        if (!selectedRoommate) return;
        const phone = selectedRoommate.rawContact || selectedRoommate.contact || "";
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        if (cleanPhone && cleanPhone.length >= 9) {
            window.open(`https://zalo.me/${cleanPhone}`, "_blank");
        } else {
            handleCopyMessage();
            alert("Đã sao chép tin nhắn! Bạn có thể dán vào Zalo hoặc Messenger của người này.");
        }
    };

    // Gửi tin nhắn qua hệ thống SmartStay & kích hoạt Cửa sổ chatbox
    const handleSendDirect = () => {
        setSentStatus(true);
        window.dispatchEvent(
            new CustomEvent("smartstay:open_chat", {
                detail: {
                    recipient: selectedRoommate,
                    initialMessage: customMessage
                }
            })
        );
        setTimeout(() => {
            setSentStatus(false);
            setSelectedRoommate(null);
        }, 350);
    };

    // Xóa toàn bộ bộ lọc
    const handleResetFilters = () => {
        setSearchKeyword("");
        setPetFilter("all");
        setSmokingFilter("all");
        setSleepFilter("all");
        setCampusFilter("all");
        setGenderFilter("all");
        setBudgetFilter("all");
    };

    const hasActiveFilters =
        searchKeyword !== "" ||
        petFilter !== "all" ||
        smokingFilter !== "all" ||
        sleepFilter !== "all" ||
        campusFilter !== "all" ||
        genderFilter !== "all" ||
        budgetFilter !== "all";

    // Lọc danh sách người ở ghép theo thanh tùy chỉnh
    const filteredItems = useMemo(() => {
        return items.filter((it) => {
            // 1. Lọc từ khóa tìm kiếm
            if (searchKeyword.trim()) {
                const q = searchKeyword.toLowerCase();
                const matchName = it.name?.toLowerCase().includes(q);
                const matchCampus = it.campus?.toLowerCase().includes(q);
                const matchHabits = it.habits?.toLowerCase().includes(q);
                const matchDesc = it.description?.toLowerCase().includes(q);
                if (!matchName && !matchCampus && !matchHabits && !matchDesc) {
                    return false;
                }
            }

            // 2. Lọc Thú cưng
            if (petFilter === "has_pet") {
                const hasPet = it.hasPet || it.habits?.toLowerCase().includes("mèo") || it.habits?.toLowerCase().includes("chó") || it.habits?.toLowerCase().includes("thú cưng");
                if (!hasPet) return false;
            } else if (petFilter === "no_pet") {
                const hasPet = it.hasPet || it.habits?.toLowerCase().includes("mèo") || it.habits?.toLowerCase().includes("chó") || it.habits?.toLowerCase().includes("có nuôi");
                if (hasPet) return false;
            }

            // 3. Lọc Hút thuốc
            if (smokingFilter === "none") {
                const isNoSmoking = it.smokingDrinking === "none" || it.habits?.toLowerCase().includes("không hút");
                if (!isNoSmoking) return false;
            }

            // 4. Lọc Giấc ngủ
            if (sleepFilter === "early") {
                const isEarly = it.sleepSchedule === "early_bird" || it.habits?.toLowerCase().includes("ngủ sớm");
                if (!isEarly) return false;
            } else if (sleepFilter === "night_owl") {
                const isNight = it.sleepSchedule === "night_owl" || it.habits?.toLowerCase().includes("khuya") || it.habits?.toLowerCase().includes("cú đêm");
                if (!isNight) return false;
            }

            // 5. Lọc Campus
            if (campusFilter !== "all" && !it.campus?.includes(campusFilter)) {
                return false;
            }

            // 6. Lọc Giới tính
            if (genderFilter !== "all" && it.gender !== genderFilter) {
                return false;
            }

            // 7. Lọc Ngân sách
            if (budgetFilter === "under_2" && it.budget >= 2.0) return false;
            if (budgetFilter === "2_to_3" && (it.budget < 2.0 || it.budget > 3.0)) return false;
            if (budgetFilter === "over_3" && it.budget <= 3.0) return false;

            return true;
        });
    }, [items, searchKeyword, petFilter, smokingFilter, sleepFilter, campusFilter, genderFilter, budgetFilter]);

    // Submit form đăng tìm bạn
    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const hasPetText = form.hasPet === "yes" ? "Có nuôi thú cưng" : "Không nuôi pet";
            const smokingText = form.smokingDrinking === "none" ? "Không hút thuốc" : "Có hút thuốc";
            const sleepText = form.sleepSchedule === "early_bird" ? "Ngủ sớm" : (form.sleepSchedule === "night_owl" ? "Thức khuya" : "Linh hoạt");
            const combinedHabits = [hasPetText, smokingText, sleepText, form.habits].filter(Boolean).join(", ");

            await base44.entities.Roommate.create({
                name: form.name,
                gender: form.gender,
                age: form.age ? Number(form.age) : 20,
                campus: form.campus,
                budget: form.budget ? Number(form.budget) : 2.0,
                hasPet: form.hasPet === "yes",
                smokingDrinking: form.smokingDrinking,
                sleepSchedule: form.sleepSchedule,
                habits: combinedHabits,
                description: form.description,
                contact: form.contact
            });

            setForm(emptyForm);
            setShowForm(false);
            load();
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHero
                icon={UserPlus}
                title="Ghép bạn cùng phòng"
                subtitle="Tìm bạn cùng phòng văn minh — đồng điệu campus, thói quen sinh hoạt và chi phí minh bạch."
                actionLabel={showForm ? "Đóng form" : "Đăng tìm bạn"}
                onAction={() => {
                    if (user?.role === "transporter") {
                        alert("👋 Tính năng Đăng tìm bạn cùng phòng dành riêng cho Sinh viên. Bác tài vui lòng quản lý cuốc xe tại Cổng Tài Xế (/tai-xe).");
                        return;
                    }
                    if (user?.role === "landlord") {
                        alert("👋 Tính năng Đăng tìm bạn ở ghép dành riêng cho Sinh viên. Bác Chủ trọ vui lòng quản lý phòng tại Kênh Quản Trị Trọ (/chu-tro).");
                        return;
                    }
                    setShowForm((s) => !s);
                }}
            />

            <section className="max-w-7xl mx-auto px-6 py-8">
                {/* Hướng dẫn khi Tài xế hoặc Chủ trọ xem trang ghép bạn */}
                {user?.role === "transporter" && (
                    <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Bác tài {user.fullName || "Tài xế"} đang ở mục Ghép bạn của Sinh viên</p>
                                <p className="text-xs text-teal-700">Mục này chỉ dành cho các bạn sinh viên kết nối tìm bạn ở cùng.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => window.location.href = "/tai-xe"}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm shrink-0"
                        >
                            Vào Cổng Tài Xế (/tai-xe) ➔
                        </Button>
                    </div>
                )}

                {user?.role === "landlord" && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-950 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Bác Chủ trọ {user.fullName || ""} đang ở mục Ghép bạn của Sinh viên</p>
                                <p className="text-xs text-orange-700">Chức năng ghép bạn dành riêng cho các bạn sinh viên tìm bạn cùng phòng.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => window.location.href = "/chu-tro"}
                            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm shrink-0"
                        >
                            Vào Kênh Chủ Trọ (/chu-tro) ➔
                        </Button>
                    </div>
                )}

                {/* Form Đăng tìm bạn ở ghép */}
                {showForm && (
                    <form
                        onSubmit={submit}
                        className="bg-card rounded-3xl border border-accent/30 shadow-xl p-6 md:p-8 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300"
                    >
                        <div className="md:col-span-2 flex items-center justify-between pb-3 border-b border-border">
                            <div>
                                <h2 className="font-heading font-bold text-foreground text-lg">Đăng tìm bạn ở ghép</h2>
                                <p className="text-xs text-muted-foreground">Tìm bạn cùng phòng văn minh, cùng chí hướng nhanh chóng và tiện lợi.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <Field label="Tên hiển thị (*)">
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Ví dụ: Hoàng Nam (K18 FPT)"
                            />
                        </Field>

                        <Field label="Giới tính">
                            <Select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                options={["Nam", "Nữ", "Khác"]}
                            />
                        </Field>

                        <Field label="Tuổi">
                            <Input
                                type="number"
                                value={form.age}
                                onChange={(e) => setForm({ ...form, age: e.target.value })}
                                placeholder="20"
                            />
                        </Field>

                        <Field label="Campus / Trường học (*)">
                            <Select
                                value={form.campus}
                                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                                options={campuses}
                            />
                        </Field>

                        <Field label="Ngân sách dự kiến (triệu/tháng)">
                            <Input
                                type="number"
                                step="0.1"
                                value={form.budget}
                                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                                placeholder="2.5"
                            />
                        </Field>

                        <Field label="Nuôi thú cưng">
                            <Select
                                value={form.hasPet}
                                onChange={(e) => setForm({ ...form, hasPet: e.target.value })}
                                options={[
                                    { label: "Không nuôi thú cưng", value: "no" },
                                    { label: "Có nuôi thú cưng (chó/mèo)", value: "yes" },
                                    { label: "Yêu thích thú cưng", value: "friendly" }
                                ]}
                            />
                        </Field>

                        <Field label="Hút thuốc lá">
                            <Select
                                value={form.smokingDrinking}
                                onChange={(e) => setForm({ ...form, smokingDrinking: e.target.value })}
                                options={[
                                    { label: "Tuyệt đối không hút thuốc", value: "none" },
                                    { label: "Linh hoạt / Thỉnh thoảng", value: "sometimes" }
                                ]}
                            />
                        </Field>

                        <Field label="Giờ giấc sinh hoạt">
                            <Select
                                value={form.sleepSchedule}
                                onChange={(e) => setForm({ ...form, sleepSchedule: e.target.value })}
                                options={[
                                    { label: "Ngủ sớm dậy sớm (Trước 23h)", value: "early_bird" },
                                    { label: "Cú đêm / Học khuya (Sau 23h)", value: "night_owl" },
                                    { label: "Giờ giấc linh hoạt", value: "flexible" }
                                ]}
                            />
                        </Field>

                        <Field label="Thói quen khác (ngăn cách bằng dấu phẩy)">
                            <Input
                                value={form.habits}
                                onChange={(e) => setForm({ ...form, habits: e.target.value })}
                                placeholder="sạch sẽ, nấu ăn tại phòng, thích yên tĩnh"
                            />
                        </Field>

                        <Field label="Số Zalo / Liên hệ">
                            <Input
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                required
                                placeholder="0912 345 678"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Mô tả bản thân & Tiêu chí bạn cùng phòng">
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    placeholder="Mình là sinh viên năm 3, tính tình hòa đồng, giữ vệ sinh chung..."
                                    className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full md:w-auto px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng tin...
                                    </>
                                ) : (
                                    "Xác nhận đăng tin tìm bạn"
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* ==================== THANH TÙY CHỈNH BỘ LỌC (FILTER BAR) ==================== */}
                <div className="bg-card rounded-3xl border border-border/80 p-5 mb-8 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-border/60">
                        {/* Thanh tìm kiếm từ khóa */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Tìm theo tên, sở thích, trường học (FPT, Y Dược, Cần Thơ)..."
                                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-accent/30 outline-none transition"
                            />
                            {searchKeyword && (
                                <button
                                    onClick={() => setSearchKeyword("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Nút Reset bộ lọc */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                className="px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center justify-center gap-1.5 self-end md:self-auto"
                            >
                                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Hàng các nút tùy chỉnh nhanh (Thói quen & Tiêu chí) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                        {/* 1. Tùy chỉnh Thú cưng */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Dog className="w-3 h-3 text-orange-500" /> Thú cưng
                            </label>
                            <select
                                value={petFilter}
                                onChange={(e) => setPetFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    petFilter !== "all" ? "bg-orange-50 text-orange-900 border-orange-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="has_pet">🐾 Có thú cưng</option>
                                <option value="no_pet">🚫 Không nuôi pet</option>
                            </select>
                        </div>

                        {/* 2. Tùy chỉnh Hút thuốc */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Ban className="w-3 h-3 text-emerald-600" /> Khói thuốc
                            </label>
                            <select
                                value={smokingFilter}
                                onChange={(e) => setSmokingFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    smokingFilter !== "all" ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="none">🚭 Không hút thuốc</option>
                            </select>
                        </div>

                        {/* 3. Tùy chỉnh Giờ giấc */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Moon className="w-3 h-3 text-indigo-600" /> Giờ giấc
                            </label>
                            <select
                                value={sleepFilter}
                                onChange={(e) => setSleepFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    sleepFilter !== "all" ? "bg-indigo-50 text-indigo-900 border-indigo-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="early">☀️ Ngủ sớm (&lt; 23h)</option>
                                <option value="night_owl">🌙 Cú đêm (&gt; 23h)</option>
                            </select>
                        </div>

                        {/* 4. Tùy chỉnh Campus */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-accent" /> Campus
                            </label>
                            <select
                                value={campusFilter}
                                onChange={(e) => setCampusFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    campusFilter !== "all" ? "bg-accent/10 text-accent border-accent/40 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả trường</option>
                                <option value="ĐH Cần Thơ">ĐH Cần Thơ</option>
                                <option value="ĐH FPT">ĐH FPT Cần Thơ</option>
                                <option value="ĐH Y Dược">ĐH Y Dược</option>
                                <option value="ĐH Nam Cần Thơ">ĐH Nam Cần Thơ</option>
                            </select>
                        </div>

                        {/* 5. Tùy chỉnh Giới tính */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3 text-blue-500" /> Giới tính
                            </label>
                            <select
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    genderFilter !== "all" ? "bg-blue-50 text-blue-900 border-blue-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>

                        {/* 6. Tùy chỉnh Ngân sách */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Wallet className="w-3 h-3 text-amber-500" /> Ngân sách
                            </label>
                            <select
                                value={budgetFilter}
                                onChange={(e) => setBudgetFilter(e.target.value)}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition ${
                                    budgetFilter !== "all" ? "bg-amber-50 text-amber-900 border-amber-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Mọi mức giá</option>
                                <option value="under_2">&lt; 2 triệu/tháng</option>
                                <option value="2_to_3">2 - 3 triệu/tháng</option>
                                <option value="over_3">&gt; 3 triệu/tháng</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Kết quả tìm kiếm */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-foreground text-lg">
                        Tìm thấy {filteredItems.length} bạn phù hợp
                    </h2>
                    {hasActiveFilters && (
                        <span className="text-xs text-muted-foreground">
                            Đang áp dụng bộ lọc tùy chỉnh
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                        <EmptyState text="Không tìm thấy bạn nào khớp với bộ lọc thói quen này." />
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                className="mt-4 px-4 py-2 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent/90"
                            >
                                Xóa bộ lọc để xem tất cả
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredItems.map((it) => (
                            <RoommateCard key={it.id} item={it} onConnect={handleOpenConnect} />
                        ))}
                    </div>
                )}
            </section>

            {/* ==================== MODAL KẾT NỐI TIN NHẮN (MESSENGER CONNECT) ==================== */}
            {selectedRoommate && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedRoommate(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-orange-100 flex items-center justify-center text-accent">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-base text-foreground">
                                    Nhắn tin kết nối bạn ở ghép
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Kết nối với <strong>{selectedRoommate.name}</strong> ({selectedRoommate.campus})
                                </p>
                            </div>
                        </div>

                        {/* Thẻ tóm tắt thông tin người nhận */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{selectedRoommate.name}</span>
                                <span className="text-accent font-semibold">{selectedRoommate.budget} tr/tháng</span>
                            </div>
                            <p className="text-slate-600 line-clamp-2">
                                <strong>Thói quen:</strong> {selectedRoommate.habits || "Sạch sẽ, văn minh"}
                            </p>
                        </div>

                        {/* Khung tin nhắn mẫu có thể chỉnh sửa */}
                        <div className="mb-4">
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                Nội dung tin nhắn gửi đến bạn ấy:
                            </label>
                            <textarea
                                rows={4}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-2xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none leading-relaxed"
                            />
                        </div>

                        {/* Các hành động kết nối */}
                        <div className="space-y-2.5">
                            <button
                                type="button"
                                onClick={handleOpenZalo}
                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" /> Mở Zalo nhắn tin trực tiếp
                            </button>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyMessage}
                                    className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                                >
                                    {copiedMessage ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Sao chép tin nhắn
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSendDirect}
                                    disabled={sentStatus}
                                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    {sentStatus ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-200" /> Đang mở chat...
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="w-3.5 h-3.5" /> Gửi & Mở Chat SmartStay
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}