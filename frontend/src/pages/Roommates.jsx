import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
    User,
    ArrowUpDown,
    Home,
    AlertTriangle,
    RotateCcw,
    ChevronDown,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageHero from "@/components/smartstay/PageHero";
import RoommateCard from "@/components/smartstay/RoommateCard";
import ReportModal from "@/components/smartstay/ReportModal";
import RoommatePostWizard from "@/components/smartstay/RoommatePostWizard";
import { Field, EmptyState, Select } from "@/components/smartstay/FormBits";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { formatGender } from "@/utils/genderLabel";
import { calcCompatibility, normalizeGender } from "@/utils/compatibility";
import { roommateApi } from "@/services/roommateApi";

const campuses = ["ĐH Cần Thơ", "ĐH Y Dược", "ĐH Nam Cần Thơ", "ĐH FPT"];
const PAGE_SIZE = 12;

/**
 * Skeleton hiển thị khi đang tải danh sách thẻ
 */
function RoommateCardSkeleton() {
    return (
        <div className="bg-card rounded-3xl border border-border/80 p-5 flex flex-col h-[320px] justify-between shadow-xs animate-pulse">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 bg-slate-200 rounded" />
                        <Skeleton className="h-3 w-24 bg-slate-100 rounded" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full bg-slate-200" />
                </div>
                <Skeleton className="h-8 w-full rounded-xl bg-slate-100 mb-3" />
                <div className="flex flex-wrap gap-1.5 mb-3">
                    <Skeleton className="h-6 w-24 rounded-lg bg-slate-100" />
                    <Skeleton className="h-6 w-20 rounded-lg bg-slate-100" />
                    <Skeleton className="h-6 w-16 rounded-lg bg-slate-100" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <Skeleton className="h-4 w-28 bg-slate-200 rounded" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-xl bg-slate-200" />
                    <Skeleton className="h-8 w-20 rounded-xl bg-slate-200" />
                </div>
            </div>
        </div>
    );
}

export default function Roommates() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const formSectionRef = useRef(null);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Phân trang "Tải thêm" 12 hồ sơ
    const [page, setPage] = useState(1);

    // Thu gọn bộ lọc trên Mobile (Drawer/Collapse)
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Hồ sơ của người dùng hiện tại & Tương tác Lưu / Ẩn / Báo cáo
    const [myProfile, setMyProfile] = useState(() => roommateApi.getMyProfile());
    const [savedIds, setSavedIds] = useState(() => roommateApi.getSavedIds());
    const [hiddenIds, setHiddenIds] = useState(() => roommateApi.getHiddenIds());
    const [reportingProfile, setReportingProfile] = useState(null);

    // Đọc trạng thái ban đầu từ URL query string
    const urlQuery = searchParams.get("q") || "";
    const urlPet = searchParams.get("pet") || "all";
    const urlSmoking = searchParams.get("smoking") || "all";
    const urlSleep = searchParams.get("sleep") || "all";
    const urlCampus = searchParams.get("campus") || "all";
    const urlGender = searchParams.get("gender") || "all";
    const urlBudget = searchParams.get("budget") || "all";
    const urlType = searchParams.get("type") || "all";
    const hasProfile = Boolean(roommateApi.getMyProfile());
    const rawSort = searchParams.get("sort");
    const urlSort = (rawSort === "compat" && !hasProfile) ? "newest" : (rawSort || (hasProfile ? "compat" : "newest"));
    const urlStrictList = (searchParams.get("strict") || "").split(",").filter(Boolean);

    // Sắp xếp danh sách
    const [sortBy, setSortBy] = useState(urlSort);

    // Thanh tìm kiếm từ khóa kèm Debounce 400ms
    const [searchKeyword, setSearchKeyword] = useState(urlQuery);
    const [debouncedKeyword, setDebouncedKeyword] = useState(urlQuery);

    // Bộ lọc Loại hình phòng
    const [roomTypeFilter, setRoomTypeFilter] = useState(urlType); // 'all', 'has_room', 'need_room'

    // 6 Bộ lọc tiêu chí hiện có
    const [petFilter, setPetFilter] = useState(urlPet);
    const [smokingFilter, setSmokingFilter] = useState(urlSmoking);
    const [sleepFilter, setSleepFilter] = useState(urlSleep);
    const [campusFilter, setCampusFilter] = useState(urlCampus);
    const [genderFilter, setGenderFilter] = useState(urlGender);
    const [budgetFilter, setBudgetFilter] = useState(urlBudget);

    // Công tắc "Bắt buộc" cho từng bộ lọc (bắt buộc = loại hẳn; không bật = cộng điểm ưu tiên)
    const [strictFilters, setStrictFilters] = useState({
        pet: urlStrictList.includes("pet"),
        smoking: urlStrictList.includes("smoking"),
        sleep: urlStrictList.includes("sleep"),
        campus: urlStrictList.includes("campus"),
        gender: urlStrictList.includes("gender"),
        budget: urlStrictList.includes("budget")
    });

    // Modal Hộp thoại Nhắn tin Messenger / Zalo
    const [selectedRoommate, setSelectedRoommate] = useState(null);
    const [customMessage, setCustomMessage] = useState("");
    const [copiedMessage, setCopiedMessage] = useState(false);
    const [sentStatus, setSentStatus] = useState(false);

    // Debounce tìm kiếm 400ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    // Đồng bộ các bộ lọc lên URL query string
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedKeyword.trim()) params.set("q", debouncedKeyword.trim());
        if (petFilter !== "all") params.set("pet", petFilter);
        if (smokingFilter !== "all") params.set("smoking", smokingFilter);
        if (sleepFilter !== "all") params.set("sleep", sleepFilter);
        if (campusFilter !== "all") params.set("campus", campusFilter);
        if (genderFilter !== "all") params.set("gender", genderFilter);
        if (budgetFilter !== "all") params.set("budget", budgetFilter);
        if (roomTypeFilter !== "all") params.set("type", roomTypeFilter);
        if (sortBy !== "newest") params.set("sort", sortBy);

        const activeStrict = Object.keys(strictFilters).filter((k) => strictFilters[k]);
        if (activeStrict.length > 0) {
            params.set("strict", activeStrict.join(","));
        }

        setSearchParams(params, { replace: true });
    }, [
        debouncedKeyword,
        petFilter,
        smokingFilter,
        sleepFilter,
        campusFilter,
        genderFilter,
        budgetFilter,
        roomTypeFilter,
        sortBy,
        strictFilters,
        setSearchParams
    ]);

    const load = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const currentProfile = roommateApi.getMyProfile();
            const res = await base44.entities.Roommate.filter(
                {
                    viewerId: currentProfile?.id || currentProfile?._id || undefined,
                    viewerGender: currentProfile?.gender || undefined,
                    allowCrossGender: currentProfile?.allowCrossGender !== undefined ? currentProfile.allowCrossGender : false
                },
                { sort: "-created_date", limit: 50 }
            );
            setItems(res.items || []);
        } catch (err) {
            console.error("Lỗi tải danh sách ở ghép:", err);
            setItems([]);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [myProfile?.gender, myProfile?.allowCrossGender]);

    // Lắng nghe sự kiện cập nhật hồ sơ cá nhân và danh sách lưu
    useEffect(() => {
        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setMyProfile(e.detail);
                setSortBy("compat");
            }
        };
        const handleSavedUpdate = (e) => {
            if (e.detail) setSavedIds(e.detail);
        };
        const handleHiddenUpdate = (e) => {
            if (e.detail) setHiddenIds(e.detail);
        };

        window.addEventListener("smartstay:my_profile_updated", handleProfileUpdate);
        window.addEventListener("smartstay:saved_roommates_updated", handleSavedUpdate);
        window.addEventListener("smartstay:hidden_roommates_updated", handleHiddenUpdate);

        return () => {
            window.removeEventListener("smartstay:my_profile_updated", handleProfileUpdate);
            window.removeEventListener("smartstay:saved_roommates_updated", handleSavedUpdate);
            window.removeEventListener("smartstay:hidden_roommates_updated", handleHiddenUpdate);
        };
    }, []);

    // Bật/tắt trạng thái Bắt buộc cho từng tiêu chí
    const toggleStrict = (key) => {
        setStrictFilters((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
        setPage(1);
    };

    // Kiểm tra xem hồ sơ có phải là của chính người dùng hay không (để không tự ghép với bản thân)
    const isOwnProfile = (it) => {
        if (!it) return false;
        // 1. So khớp với hồ sơ lưu trong myProfile
        if (myProfile) {
            const pId = String(myProfile.id || myProfile._id || "");
            const itId = String(it.id || it._id || "");
            if (pId && itId && pId === itId) return true;

            if (myProfile.name && it.name && it.name.trim().toLowerCase() === myProfile.name.trim().toLowerCase()) {
                return true;
            }
            if (myProfile.contact && (it.contact === myProfile.contact || it.rawContact === myProfile.contact)) {
                return true;
            }
        }
        // 2. So khớp với tài khoản đăng nhập (user)
        if (user) {
            const uid = String(user._id || user.id || "");
            if (uid && (String(it.owner || "") === uid || String(it.userId || "") === uid || String(it.user || "") === uid)) {
                return true;
            }
            if (user.phone && (it.contact === user.phone || it.rawContact === user.phone)) {
                return true;
            }
            if (user.fullName && it.name && it.name.trim().toLowerCase() === user.fullName.trim().toLowerCase()) {
                return true;
            }
            if (user.name && it.name && it.name.trim().toLowerCase() === user.name.trim().toLowerCase()) {
                return true;
            }
        }
        return false;
    };

    // 1. Tính toán điểm tương thích cho từng người ở ghép (ưu tiên compatibility từ backend SSOT)
    const itemsWithCompat = useMemo(() => {
        return items.map((it) => {
            const compat = (it.compatibility && typeof it.compatibility.score === 'number')
                ? it.compatibility
                : calcCompatibility(myProfile, it);
            return {
                ...it,
                compat
            };
        });
    }, [items, myProfile]);

    // 2. Lọc bỏ các hồ sơ đã bị ẩn, là chính mình, hoặc khác giới khi chưa có sự đồng ý của cả 2 bên
    const visibleItems = useMemo(() => {
        return itemsWithCompat.filter((it) => {
            if (hiddenIds.includes(String(it.id || it._id))) return false;
            if (isOwnProfile(it)) return false;

            // Kiểm tra ràng buộc giới tính nếu người dùng hiện tại đã có hồ sơ
            if (myProfile?.gender) {
                const myGenderNorm = normalizeGender(myProfile.gender);
                const otherGenderNorm = normalizeGender(it.gender);

                // Nếu khác giới tính: chỉ hiển thị khi CẢ HAI BÊN đều bật allowCrossGender
                if (myGenderNorm && otherGenderNorm && myGenderNorm !== otherGenderNorm) {
                    const bothAllow = Boolean(myProfile.allowCrossGender) && Boolean(it.allowCrossGender);
                    if (!bothAllow) return false;
                }
            }

            return true;
        });
    }, [itemsWithCompat, hiddenIds, myProfile, user]);

    // 3. Lọc danh sách theo thanh tùy chỉnh nâng cao (hỗ trợ Bắt buộc vs Ưu tiên)
    const filteredItems = useMemo(() => {
        return visibleItems
            .map((it) => {
                let preferenceScore = 0;

                // A. Lọc từ khóa tìm kiếm (Debounced)
                if (debouncedKeyword.trim()) {
                    const q = debouncedKeyword.toLowerCase();
                    const matchName = it.name?.toLowerCase().includes(q);
                    const matchCampus = it.campus?.toLowerCase().includes(q);
                    const matchHabits = it.habits?.toLowerCase().includes(q);
                    const matchDesc = it.description?.toLowerCase().includes(q);
                    if (!matchName && !matchCampus && !matchHabits && !matchDesc) {
                        return null;
                    }
                }

                // B. Lọc Loại hình phòng (Tôi có phòng / Tôi tìm phòng)
                if (roomTypeFilter === "has_room") {
                    const hasRoom = it.type === "has_room" || it.hasRoom;
                    if (!hasRoom) return null;
                } else if (roomTypeFilter === "need_room") {
                    const hasRoom = it.type === "has_room" || it.hasRoom;
                    if (hasRoom) return null;
                }

                // C. Lọc Thú cưng
                let matchPet = true;
                if (petFilter === "has_pet") {
                    matchPet = Boolean(
                        it.hasPet ||
                        it.habits?.toLowerCase().includes("mèo") ||
                        it.habits?.toLowerCase().includes("chó") ||
                        it.habits?.toLowerCase().includes("thú cưng")
                    );
                } else if (petFilter === "no_pet") {
                    const hasPet = Boolean(
                        it.hasPet ||
                        it.habits?.toLowerCase().includes("mèo") ||
                        it.habits?.toLowerCase().includes("chó") ||
                        it.habits?.toLowerCase().includes("có nuôi")
                    );
                    matchPet = !hasPet;
                }
                if (petFilter !== "all") {
                    if (strictFilters.pet) {
                        if (!matchPet) return null;
                    } else if (matchPet) {
                        preferenceScore += 10;
                    }
                }

                // D. Lọc Hút thuốc
                let matchSmoking = true;
                if (smokingFilter === "none") {
                    matchSmoking = Boolean(
                        it.smokingDrinking === "none" ||
                        it.habits?.toLowerCase().includes("không hút")
                    );
                }
                if (smokingFilter !== "all") {
                    if (strictFilters.smoking) {
                        if (!matchSmoking) return null;
                    } else if (matchSmoking) {
                        preferenceScore += 25;
                    }
                }

                // E. Lọc Giờ giấc
                let matchSleep = true;
                if (sleepFilter === "early") {
                    matchSleep = Boolean(
                        it.sleepSchedule === "early_bird" ||
                        it.sleepSchedule === "early" ||
                        it.habits?.toLowerCase().includes("ngủ sớm")
                    );
                } else if (sleepFilter === "night_owl") {
                    matchSleep = Boolean(
                        it.sleepSchedule === "night_owl" ||
                        it.habits?.toLowerCase().includes("khuya") ||
                        it.habits?.toLowerCase().includes("cú đêm")
                    );
                }
                if (sleepFilter !== "all") {
                    if (strictFilters.sleep) {
                        if (!matchSleep) return null;
                    } else if (matchSleep) {
                        preferenceScore += 25;
                    }
                }

                // F. Lọc Campus
                let matchCampus = true;
                if (campusFilter !== "all") {
                    matchCampus = Boolean(it.campus?.includes(campusFilter));
                }
                if (campusFilter !== "all") {
                    if (strictFilters.campus) {
                        if (!matchCampus) return null;
                    } else if (matchCampus) {
                        preferenceScore += 15;
                    }
                }

                // G. Lọc Giới tính
                let matchGender = true;
                if (genderFilter !== "all") {
                    const normGender = formatGender(it.gender);
                    matchGender = normGender === genderFilter;
                }
                if (genderFilter !== "all") {
                    if (strictFilters.gender) {
                        if (!matchGender) return null;
                    } else if (matchGender) {
                        preferenceScore += 20;
                    }
                }

                // H. Lọc Ngân sách
                let matchBudget = true;
                const b = Number(it.budget);
                if (budgetFilter === "under_2") matchBudget = b < 2.0;
                else if (budgetFilter === "2_to_3") matchBudget = b >= 2.0 && b <= 3.0;
                else if (budgetFilter === "over_3") matchBudget = b > 3.0;
                if (budgetFilter !== "all") {
                    if (strictFilters.budget) {
                        if (!matchBudget) return null;
                    } else if (matchBudget) {
                        preferenceScore += 20;
                    }
                }

                return {
                    ...it,
                    preferenceScore
                };
            })
            .filter(Boolean);
    }, [
        visibleItems,
        debouncedKeyword,
        roomTypeFilter,
        petFilter,
        smokingFilter,
        sleepFilter,
        campusFilter,
        genderFilter,
        budgetFilter,
        strictFilters
    ]);

    // 4. Sắp xếp danh sách người ở ghép (kết hợp điểm ưu tiên và độ tương thích)
    const sortedItems = useMemo(() => {
        const list = [...filteredItems];
        if (sortBy === "compat") {
            list.sort((a, b) => {
                const totalScoreA = (a.compat?.score ?? 0) + (a.preferenceScore || 0) * 0.15;
                const totalScoreB = (b.compat?.score ?? 0) + (b.preferenceScore || 0) * 0.15;
                return totalScoreB - totalScoreA;
            });
        } else if (sortBy === "budget_asc") {
            list.sort((a, b) => (Number(a.budget) || 999) - (Number(b.budget) || 999));
        } else if (sortBy === "budget_desc") {
            list.sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0));
        } else {
            // "newest" - đưa các bạn khớp ưu tiên lên trước
            list.sort((a, b) => (b.preferenceScore || 0) - (a.preferenceScore || 0));
        }
        return list;
    }, [filteredItems, sortBy]);

    // Danh sách hồ sơ hiển thị sau phân trang
    const displayedItems = useMemo(() => {
        return sortedItems.slice(0, page * PAGE_SIZE);
    }, [sortedItems, page]);

    // Hành động: Bật / Tắt lưu hồ sơ
    const handleToggleSave = (person) => {
        const pId = person.id || person._id;
        const isNowSaved = roommateApi.toggleSave(pId);
        setSavedIds(roommateApi.getSavedIds());
        toast({
            title: isNowSaved ? "Đã lưu hồ sơ" : "Đã bỏ lưu",
            description: isNowSaved
                ? `Đã lưu hồ sơ của ${person.name} vào danh sách quan tâm.`
                : `Đã xóa hồ sơ của ${person.name} khỏi danh sách quan tâm.`
        });
    };

    // Hành động: Ẩn hồ sơ với Toast Hoàn tác trong 5 giây (Optimistic)
    const handleHideProfile = (person) => {
        const pId = String(person.id || person._id);
        roommateApi.hideProfile(pId);
        setHiddenIds(roommateApi.getHiddenIds());

        toast({
            title: "Đã ẩn hồ sơ",
            description: `Hồ sơ của ${person.name} đã được tạm ẩn khỏi kết quả tìm kiếm.`,
            action: (
                <ToastAction
                    altText="Hoàn tác"
                    onClick={() => {
                        roommateApi.unhideProfile(pId);
                        setHiddenIds(roommateApi.getHiddenIds());
                        toast({
                            title: "Đã hoàn tác",
                            description: `Hồ sơ của ${person.name} đã được hiển thị trở lại.`
                        });
                    }}
                >
                    Hoàn tác (5s)
                </ToastAction>
            ),
            duration: 5000
        });
    };

    // Hành động: Mở modal Báo cáo
    const handleOpenReport = (person) => {
        setReportingProfile(person);
    };

    // Hành động: Xác nhận gửi Báo cáo
    const handleSubmitReport = async (reportData) => {
        await roommateApi.reportProfile({
            reporterId: user?.id || user?._id || "guest",
            profileId: reportData.profileId,
            reason: reportData.reason,
            detail: reportData.detail
        });
        toast({
            title: "Đã gửi báo cáo thành công",
            description: "Cảm ơn bạn đã đóng góp phản hồi để giữ môi trường SmartStay văn minh, an toàn!"
        });
    };

    // Mở form đăng tìm bạn hoặc cuộn đến form
    const handlePromptCreateProfile = () => {
        setShowForm(true);
        if (formSectionRef.current) {
            formSectionRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo({ top: 280, behavior: "smooth" });
        }
    };

    // Tạo tin nhắn kết nối được cá nhân hóa dựa trên các điểm tương đồng
    const generateConnectMessage = (person) => {
        const rawName = person.name || "bạn";
        const nameParts = rawName.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1];

        const matched = person.compat?.matched || [];
        if (matched.length > 0) {
            const formattedPoints = matched
                .slice(0, 2)
                .map((m) => {
                    let clean = m.trim();
                    if (clean.toLowerCase().startsWith("cùng ")) {
                        clean = clean.slice(5);
                    }
                    return clean.charAt(0).toLowerCase() + clean.slice(1);
                })
                .join(" và ");

            return `Chào ${firstName}, mình thấy hai đứa cùng ${formattedPoints} (ngân sách ~${person.budget}tr/tháng). Mình muốn trao đổi thêm về việc ở ghép nhé!`;
        }

        return `Chào ${firstName}, mình thấy bạn đang tìm bạn ở ghép cùng trường ${person.campus || "Cần Thơ"} (ngân sách ~${person.budget}tr/tháng). Mình muốn trao đổi thêm về việc ở ghép nhé!`;
    };

    // Mở hộp thoại nhắn tin
    const handleOpenConnect = (person) => {
        setSelectedRoommate(person);
        const msg = generateConnectMessage(person);
        setCustomMessage(msg.slice(0, 300));
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
        setDebouncedKeyword("");
        setRoomTypeFilter("all");
        setPetFilter("all");
        setSmokingFilter("all");
        setSleepFilter("all");
        setCampusFilter("all");
        setGenderFilter("all");
        setBudgetFilter("all");
        setStrictFilters({
            pet: false,
            smoking: false,
            sleep: false,
            campus: false,
            gender: false,
            budget: false
        });
        setPage(1);
    };

    const hasActiveFilters =
        searchKeyword !== "" ||
        roomTypeFilter !== "all" ||
        petFilter !== "all" ||
        smokingFilter !== "all" ||
        sleepFilter !== "all" ||
        campusFilter !== "all" ||
        genderFilter !== "all" ||
        budgetFilter !== "all" ||
        Object.values(strictFilters).some(Boolean);

    // Đếm số lượng bộ lọc đang kích hoạt
    const activeFilterCount = [
        searchKeyword !== "",
        roomTypeFilter !== "all",
        petFilter !== "all",
        smokingFilter !== "all",
        sleepFilter !== "all",
        campusFilter !== "all",
        genderFilter !== "all",
        budgetFilter !== "all"
    ].filter(Boolean).length;

    return (
        <>
            <PageHero
                icon={UserPlus}
                title="Ghép bạn cùng phòng"
                subtitle="Tìm bạn cùng phòng văn minh — đồng điệu campus, thói quen sinh hoạt và chi phí minh bạch."
                actionLabel={showForm ? "Đóng form" : "Đăng tìm bạn"}
                onAction={() => {
                    if (user?.role === "transporter") {
                        alert("👋 Tính năng Đăng tìm bạn cùng phòng dành riêng cho Người thuê phòng. Bác tài vui lòng quản lý cuốc xe tại Cổng Tài Xế (/tai-xe).");
                        return;
                    }
                    if (user?.role === "landlord") {
                        alert("👋 Tính năng Đăng tìm bạn ở ghép dành riêng cho Người thuê phòng. Bác Chủ trọ vui lòng quản lý phòng tại Kênh Quản Trị Trọ (/chu-tro).");
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
                                <p className="font-bold text-sm">Bác tài {user.fullName || "Tài xế"} đang ở mục Ghép bạn của Người thuê</p>
                                <p className="text-xs text-teal-700">Mục này dành cho người thuê kết nối tìm bạn ở cùng.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => (window.location.href = "/tai-xe")}
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
                                <p className="font-bold text-sm">Bác Chủ trọ {user.fullName || ""} đang ở mục Ghép bạn của Người thuê</p>
                                <p className="text-xs text-orange-700">Chức năng ghép bạn dành riêng cho người thuê tìm bạn cùng phòng.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => (window.location.href = "/chu-tro")}
                            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm shrink-0"
                        >
                            Vào Kênh Chủ Trọ (/chu-tro) ➔
                        </Button>
                    </div>
                )}

                {/* Form Đăng tìm bạn ở ghép (Step-by-Step Wizard 5 Bước) */}
                {showForm && (
                    <div ref={formSectionRef}>
                        <RoommatePostWizard
                            initialUser={user}
                            initialData={myProfile}
                            onClose={() => setShowForm(false)}
                            onSubmit={async (newProfileData) => {
                                const profileToSave = {
                                    ...newProfileData,
                                    id: myProfile?.id || myProfile?._id || `profile_${Date.now()}`
                                };

                                try {
                                    const res = await base44.entities.Roommate.create(profileToSave);
                                    if (res?.data?._id || res?.data?.id) {
                                        profileToSave.id = res.data._id || res.data.id;
                                        profileToSave._id = res.data._id || res.data.id;
                                    }
                                } catch (err) {
                                    console.warn("Lỗi đồng bộ hồ sơ lên server:", err);
                                }

                                // Lưu vào hồ sơ của tôi để tự động tính độ tương thích
                                roommateApi.saveMyProfile(profileToSave);
                                setMyProfile(profileToSave);
                                setSortBy("compat");

                                toast({
                                    title: "Đã lưu hồ sơ thành công!",
                                    description: "Hồ sơ của bạn đã được cập nhật và hệ thống đã tính độ hòa hợp với các bạn khác."
                                });

                                setShowForm(false);
                                load();
                            }}
                        />
                    </div>
                )}

                {/* Thẻ hiển thị hồ sơ cá nhân của người dùng */}
                {myProfile ? (
                    <div className="mb-8 p-5 md:p-6 rounded-3xl bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white border-2 border-orange-200/90 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-orange-200/60">
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                                    {myProfile.avatarUrl ? (
                                        <img src={myProfile.avatarUrl} alt={myProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        (myProfile.name || "Tôi").slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-heading font-extrabold text-foreground text-lg">
                                            {myProfile.name}
                                        </h3>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                            {formatGender(myProfile.gender) || "Người thuê"} • {myProfile.age || 20} tuổi
                                        </span>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Hồ sơ của bạn (Đang tìm bạn)
                                        </span>
                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                            myProfile.allowCrossGender
                                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                                : "bg-blue-50 text-blue-800 border-blue-200"
                                        }`}>
                                            {myProfile.allowCrossGender ? "👫 Cho phép ghép khác giới" : "🛡️ Chỉ ghép cùng giới"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                            {myProfile.campus || "Cần Thơ"}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 font-semibold text-foreground">
                                            <Wallet className="w-3.5 h-3.5 text-amber-500" />
                                            Ngân sách: ~{myProfile.budget || 2} tr/tháng
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium text-slate-700 bg-orange-100/70 px-2 py-0.5 rounded-md">
                                            {myProfile.type === "has_room" ? "Đã có phòng" : "Cần tìm phòng"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Nút tác vụ nhanh: Chỉnh sửa & Gỡ bài */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowForm(true)}
                                    className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-900 font-bold text-xs shadow-2xs"
                                >
                                    ✏️ Chỉnh sửa hồ sơ
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (window.confirm("Bạn có chắc chắn muốn gỡ hồ sơ tìm bạn ở ghép không? Hệ thống sẽ ngừng tính độ tương thích với những người thuê khác.")) {
                                            roommateApi.saveMyProfile(null);
                                            setMyProfile(null);
                                            toast({
                                                title: "Đã gỡ hồ sơ",
                                                description: "Hồ sơ của bạn đã được ẩn khỏi danh sách tìm bạn ở ghép."
                                            });
                                        }
                                    }}
                                    className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium text-xs"
                                >
                                    Gỡ hồ sơ
                                </Button>
                            </div>
                        </div>

                        {/* Thông tin thói quen & Mô tả vắn tắt */}
                        <div className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-700">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Thói quen của bạn:</span>
                                {myProfile.habits ? (
                                    myProfile.habits.split(",").slice(0, 4).map((h, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs">
                                            {h.trim()}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-400 italic">Chưa cập nhật thói quen chi tiết</span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 italic max-w-md truncate">
                                "{myProfile.description || "Đang tìm bạn ở ghép văn minh, cùng chí hướng."}"
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Banner gợi ý tạo hồ sơ khi chưa có */
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">Bạn chưa tạo hồ sơ thói quen ở ghép</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5">Tạo hồ sơ trong 1 phút để hệ thống tự động tính điểm tương thích (%) theo đúng thói quen thật của bạn.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePromptCreateProfile}
                            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
                        >
                            + Tạo hồ sơ tính độ hợp
                        </button>
                    </div>
                )}

                {/* ==================== THANH TÙY CHỈNH BỘ LỌC NÂNG CAO (FILTER BAR) ==================== */}
                <div className="bg-card rounded-3xl border border-border/80 p-5 mb-8 shadow-xs space-y-4">
                    {/* Hàng 1: Bộ lọc Loại hình phòng + Ô tìm kiếm + Nút Xóa bộ lọc */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-border/60">
                        {/* Tab chọn loại hình phòng */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl shrink-0 overflow-x-auto text-xs">
                            <button
                                type="button"
                                onClick={() => { setRoomTypeFilter("all"); setPage(1); }}
                                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                                    roomTypeFilter === "all"
                                        ? "bg-white text-foreground shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Tất cả loại hình
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRoomTypeFilter("has_room"); setPage(1); }}
                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    roomTypeFilter === "has_room"
                                        ? "bg-blue-600 text-white shadow-2xs"
                                        : "text-slate-600 hover:text-blue-700"
                                }`}
                            >
                                <Home className="w-3.5 h-3.5" />
                                <span>Đã có phòng, cần thêm người</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRoomTypeFilter("need_room"); setPage(1); }}
                                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    roomTypeFilter === "need_room"
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "text-slate-600 hover:text-emerald-700"
                                }`}
                            >
                                <span>Chưa có phòng, tìm bạn thuê chung</span>
                            </button>
                        </div>

                        {/* Thanh tìm kiếm từ khóa kèm debounce */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Tìm theo tên, sở thích, trường học (FPT, Y Dược, Cần Thơ)..."
                                className="w-full pl-10 pr-8 py-2 rounded-2xl border border-border bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-accent/30 outline-none transition"
                            />
                            {searchKeyword && (
                                <button
                                    onClick={() => { setSearchKeyword(""); setDebouncedKeyword(""); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Nút đóng/mở trên mobile & Nút Xóa bộ lọc */}
                        <div className="flex items-center gap-2 self-end lg:self-auto">
                            <button
                                type="button"
                                onClick={() => setShowMobileFilter(!showMobileFilter)}
                                className="lg:hidden px-3.5 py-2 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                            >
                                <Filter className="w-3.5 h-3.5 text-slate-500" />
                                <span>Bộ lọc ({activeFilterCount})</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMobileFilter ? "rotate-180" : ""}`} />
                            </button>

                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    className="px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Hàng 2: Các nút tùy chỉnh nhanh (Thói quen & Tiêu chí) kèm công tắc "Bắt buộc" */}
                    <div className={`${showMobileFilter ? "grid" : "hidden"} lg:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-1`}>
                        {/* 1. Tùy chỉnh Thú cưng */}
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <Dog className="w-3.5 h-3.5 text-orange-500" /> Thú cưng
                                </label>
                                {petFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("pet")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.pet
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.pet ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.pet ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={petFilter}
                                onChange={(e) => { setPetFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
                                    petFilter !== "all" ? "bg-orange-50 text-orange-950 border-orange-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="has_pet">🐾 Có thú cưng</option>
                                <option value="no_pet">🚫 Không nuôi pet</option>
                            </select>
                        </div>

                        {/* 2. Tùy chỉnh Hút thuốc */}
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <Ban className="w-3.5 h-3.5 text-emerald-600" /> Khói thuốc
                                </label>
                                {smokingFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("smoking")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.smoking
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.smoking ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.smoking ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={smokingFilter}
                                onChange={(e) => { setSmokingFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
                                    smokingFilter !== "all" ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="none">🚭 Không hút thuốc</option>
                            </select>
                        </div>

                        {/* 3. Tùy chỉnh Giờ giấc */}
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <Moon className="w-3.5 h-3.5 text-indigo-600" /> Giờ giấc
                                </label>
                                {sleepFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("sleep")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.sleep
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.sleep ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.sleep ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={sleepFilter}
                                onChange={(e) => { setSleepFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
                                    sleepFilter !== "all" ? "bg-indigo-50 text-indigo-950 border-indigo-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="early">☀️ Ngủ sớm (&lt; 23h)</option>
                                <option value="night_owl">🌙 Cú đêm (&gt; 23h)</option>
                            </select>
                        </div>

                        {/* 4. Tùy chỉnh Khu vực Campus */}
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-accent" /> Campus
                                </label>
                                {campusFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("campus")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.campus
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.campus ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.campus ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={campusFilter}
                                onChange={(e) => { setCampusFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
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
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-blue-500" /> Giới tính
                                </label>
                                {genderFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("gender")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.gender
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.gender ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.gender ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={genderFilter}
                                onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
                                    genderFilter !== "all" ? "bg-blue-50 text-blue-950 border-blue-300 font-bold" : "bg-white border-border"
                                }`}
                            >
                                <option value="all">Tất cả</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        {/* 6. Tùy chỉnh Ngân sách */}
                        <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-border/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <Wallet className="w-3.5 h-3.5 text-amber-500" /> Ngân sách
                                </label>
                                {budgetFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => toggleStrict("budget")}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                                            strictFilters.budget
                                                ? "bg-rose-600 text-white shadow-2xs"
                                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        }`}
                                        title={strictFilters.budget ? "Đang Bắt buộc: Loại hẳn người không khớp" : "Đang Ưu tiên: Xếp các bạn khớp lên đầu"}
                                    >
                                        {strictFilters.budget ? "Bắt buộc" : "Ưu tiên"}
                                    </button>
                                )}
                            </div>
                            <select
                                value={budgetFilter}
                                onChange={(e) => { setBudgetFilter(e.target.value); setPage(1); }}
                                className={`w-full py-1.5 px-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
                                    budgetFilter !== "all" ? "bg-amber-50 text-amber-950 border-amber-300 font-bold" : "bg-white border-border"
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

                {/* ==================== TIÊU ĐỀ KẾT QUẢ ĐỘNG & DROPDOWN SẮP XẾP ==================== */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="font-heading font-bold text-foreground text-lg flex items-center gap-2 flex-wrap">
                            <span>
                                Tìm thấy {sortedItems.length} bạn phù hợp
                                {sortedItems.length > PAGE_SIZE && (
                                    <span className="text-xs text-muted-foreground font-normal ml-1">
                                        (đang hiển thị {displayedItems.length})
                                    </span>
                                )}
                            </span>
                            {myProfile && (
                                <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    Đã kích hoạt tính độ hòa hợp
                                </span>
                            )}
                        </h2>
                        {hasActiveFilters && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Đang áp dụng {activeFilterCount} bộ lọc tùy chỉnh
                                {Object.values(strictFilters).some(Boolean) && " (có bộ lọc Bắt buộc)"}
                            </p>
                        )}
                    </div>

                    {/* Dropdown sắp xếp theo tiêu chí */}
                    <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                        <label className="text-slate-500 font-medium flex items-center gap-1">
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            <span>Sắp xếp:</span>
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="py-1.5 px-3 rounded-xl border border-border bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-accent/30 shadow-2xs cursor-pointer"
                        >
                            <option value="compat" disabled={!myProfile}>
                                {myProfile ? "✨ Phù hợp nhất (% hợp)" : "✨ Phù hợp nhất (cần hồ sơ)"}
                            </option>
                            <option value="newest">Mới nhất / Ưu tiên</option>
                            <option value="budget_asc">Ngân sách tăng dần</option>
                            <option value="budget_desc">Ngân sách giảm dần</option>
                        </select>
                    </div>
                </div>

                {/* Danh sách thẻ hồ sơ / Skeleton / Empty / Error */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <RoommateCardSkeleton key={idx} />
                        ))}
                    </div>
                ) : loadError ? (
                    <div className="p-12 text-center bg-card rounded-3xl border border-rose-200 bg-rose-50/40">
                        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                        <h3 className="font-heading font-bold text-rose-950 text-base mb-1">
                            Không thể tải danh sách hồ sơ ở ghép
                        </h3>
                        <p className="text-xs text-rose-700 mb-4 max-w-sm mx-auto">
                            Có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại.
                        </p>
                        <Button
                            onClick={load}
                            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 shadow-sm cursor-pointer"
                        >
                            Thử lại
                        </Button>
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                        <EmptyState text="Chưa có bạn phù hợp, thử bỏ bớt bộ lọc" />
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                className="mt-4 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-xs transition cursor-pointer"
                            >
                                Xóa bộ lọc để xem tất cả
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                            {displayedItems.map((it) => (
                                <RoommateCard
                                    key={it.id || it._id}
                                    item={it}
                                    compat={it.compat}
                                    isSaved={savedIds.includes(String(it.id || it._id))}
                                    onToggleSave={handleToggleSave}
                                    onHide={handleHideProfile}
                                    onReport={handleOpenReport}
                                    onPromptCreateProfile={handlePromptCreateProfile}
                                    onConnect={handleOpenConnect}
                                />
                            ))}
                        </div>

                        {/* Nút "Tải thêm 12 hồ sơ" */}
                        {displayedItems.length < sortedItems.length && (
                            <div className="flex justify-center mt-10">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-accent hover:text-white text-slate-700 font-bold text-xs border border-border shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer"
                                >
                                    <span>Tải thêm 12 hồ sơ</span>
                                    <span className="text-[11px] opacity-75">
                                        (còn lại {sortedItems.length - displayedItems.length})
                                    </span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Modal Báo cáo hồ sơ vi phạm */}
            <ReportModal
                open={Boolean(reportingProfile)}
                profile={reportingProfile}
                onClose={() => setReportingProfile(null)}
                onSubmit={handleSubmitReport}
            />

            {/* ==================== MODAL KẾT NỐI TIN NHẮN (GIỮ NGUYÊN) ==================== */}
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

                        {/* Khung tin nhắn mẫu có thể chỉnh sửa kèm giới hạn 300 ký tự */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700">
                                    Nội dung tin nhắn gửi đến bạn ấy:
                                </label>
                                <span
                                    className={`text-[10px] font-semibold ${
                                        customMessage.length >= 300 ? "text-rose-600 font-bold" : "text-muted-foreground"
                                    }`}
                                >
                                    {customMessage.length}/300 ký tự
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                maxLength={300}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value.slice(0, 300))}
                                placeholder="Nhập lời nhắn kết nối..."
                                className="w-full px-3 py-2.5 rounded-2xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none leading-relaxed resize-none"
                            />
                        </div>

                        {/* Các hành động kết nối */}
                        <div className="space-y-2.5">
                            {/* Nút Zalo: Chỉ hiển thị hoạt động khi người nhận bật cho phép hoặc đã phản hồi */}
                            {selectedRoommate.allowZalo || selectedRoommate.allowShareContact || selectedRoommate.hasRepliedInChat ? (
                                <button
                                    type="button"
                                    onClick={handleOpenZalo}
                                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <ExternalLink className="w-4 h-4" /> Mở Zalo nhắn tin trực tiếp
                                </button>
                            ) : (
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed opacity-80"
                                    >
                                        <ExternalLink className="w-4 h-4 text-slate-300" /> Mở Zalo nhắn tin trực tiếp
                                    </button>
                                    <p className="text-[10px] text-center text-slate-400 italic">
                                        🔒 Hiện sau khi bạn ấy phản hồi trong Chat SmartStay
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyMessage}
                                    className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
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