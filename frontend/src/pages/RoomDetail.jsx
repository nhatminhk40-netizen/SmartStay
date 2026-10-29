import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import CheckinVerificationDialog from "@/components/stay/CheckinVerificationDialog";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
    MapPin,
    ArrowLeft,
    ShieldCheck,
    BadgeCheck,
    CheckCircle2,
    XCircle,
    X,
    AlertTriangle,
    Flame,
    Clock,
    Home,
    Dog,
    Phone,
    Share2,
    Calendar,
    Star,
    Send,
    DollarSign,
    Zap,
    Droplets,
    Wifi,
    Trash2,
    Info,
    Check,
    FileText,
    ClipboardCheck,
    AlertOctagon,
    Columns,
    Download,
    Printer,
    UserCheck,
    DoorOpen
} from "lucide-react";

export default function RoomDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const [room, setRoom] = useState(null);
    const [selectedSubRoom, setSelectedSubRoom] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [copied, setCopied] = useState(false);

    // Tab thời hạn dự toán (1, 3, 6, 12 tháng)
    const [durationMonths, setDurationMonths] = useState(6);

    // Modals
    const [showContractModal, setShowContractModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

    // Form đặt lịch xem phòng
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("09:00");
    const [bookingPhone, setBookingPhone] = useState("");
    const [bookingNote, setBookingNote] = useState("");
    const [bookingResult, setBookingResult] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Form khiếu nại báo cáo
    const [reportReason, setReportReason] = useState("fake_price");
    const [reportContact, setReportContact] = useState("");
    const [reportDesc, setReportDesc] = useState("");
    const [reportResult, setReportResult] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Checklist xem phòng tương tác
    const [checklistState, setChecklistState] = useState({
        meterChecked: false,
        lockChecked: false,
        waterPressureChecked: false,
        fireSafetyChecked: false,
        appliancesChecked: false,
        curfewChecked: false,
        photoTaken: false,
        idChecked: false
    });

    // Form gửi đánh giá
    const [rating, setRating] = useState(5);
    const [isCostAccurate, setIsCostAccurate] = useState(true);
    const [actualMonthlyCost, setActualMonthlyCost] = useState("");
    const [comment, setComment] = useState("");
    const [proofUrl, setProofUrl] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [hasStayed, setHasStayed] = useState(true);
    const [stayedPeriod, setStayedPeriod] = useState("Đã ở 6 tháng");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewEligibility, setReviewEligibility] = useState(null);
    const [checkingEligibility, setCheckingEligibility] = useState(false);
    const [showCheckinDialog, setShowCheckinDialog] = useState(false);
    const navigate = useNavigate();
    const [reviewMessage, setReviewMessage] = useState({ text: "", type: "" });

    // Tải thông tin phòng và đánh giá
    const fetchRoomData = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Room.get(id);
            setRoom(data);

            if (data && data.price) {
                setActualMonthlyCost(data.price + 320000);
            }

            // Lấy đánh giá
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/reviews/room/${id}`);
            const json = await res.json();
            if (json.success) {
                setReviews(json.data || []);
                setReviewStats(json.stats || null);
            }
        } catch (error) {
            console.error("Lỗi khi tải chi tiết phòng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomData();
    }, [id]);

        const fetchReviewEligibility = async () => {
        const token = base44.auth.getToken() || localStorage.getItem("smartstay_token") || localStorage.getItem("token");
        if (!token) {
            setReviewEligibility({ eligible: false, code: 'NOT_LOGGED_IN', message: 'Vui lòng đăng nhập để gửi đánh giá trải nghiệm thực tế.' });
            return;
        }
        setCheckingEligibility(true);
        try {
            const res = await base44.entities.ReviewEligibility.check(id);
            if (res && res.data) {
                setReviewEligibility(res.data);
            } else {
                setReviewEligibility(res || { eligible: false, code: 'NO_VERIFIED_STAY', message: 'Chưa có thông tin lưu trú.' });
            }
        } catch (err) {
            console.warn('Lỗi kiểm tra review eligibility:', err);
        } finally {
            setCheckingEligibility(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Đặt lịch xem phòng
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: room._id || room.id,
                    roomTitle: selectedSubRoom ? `${room.property_name || room.title} (${selectedSubRoom.room_number})` : room.title,
                    studentName: user?.name || "Người thuê SmartStay",
                    studentPhone: bookingPhone,
                    landlordPhone: room.contactPhone,
                    visitDate: bookingDate,
                    visitTime: bookingTime,
                    notes: `${selectedSubRoom ? `[Phòng quan tâm: ${selectedSubRoom.room_number} - Giá: ${Number(selectedSubRoom.price).toLocaleString('vi-VN')}đ] ` : ''}${bookingNote}`
                })
            });
            const json = await res.json();
            if (json.success) {
                setBookingResult(json);
            } else {
                alert(json.message || "Không thể đặt lịch");
            }
        } catch (err) {
            alert("Lỗi kết nối khi đặt lịch xem phòng.");
        } finally {
            setBookingLoading(false);
        }
    };

    // Gửi báo cáo khiếu nại
    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setReportLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: room._id || room.id,
                    roomTitle: room.title,
                    reporterName: user?.name || "Người thuê SmartStay",
                    reporterContact: reportContact,
                    reason: reportReason,
                    description: reportDesc
                })
            });
            const json = await res.json();
            if (json.success) {
                setReportResult(json);
            } else {
                alert(json.message || "Không thể gửi báo cáo");
            }
        } catch (err) {
            alert("Lỗi kết nối máy chủ khi gửi báo cáo.");
        } finally {
            setReportLoading(false);
        }
    };

    // Gửi đánh giá thực tế
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const token = base44.auth.getToken() || localStorage.getItem("smartstay_token") || localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            setReviewMessage({
                text: "Vui lòng đăng nhập tài khoản để gửi đánh giá.",
                type: "error"
            });
            return;
        }

        setSubmittingReview(true);
        setReviewMessage({ text: "", type: "" });

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/rooms/${room._id || room.id}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    actualMonthlyCost: Number(actualMonthlyCost),
                    comment,
                    isAnonymous
                })
            });

            const json = await res.json();
            if (json.success) {
                setReviewMessage({
                    text: "Gửi đánh giá thành công! Đánh giá đã được gắn huy hiệu ✓ Đã ở thật.",
                    type: "success"
                });
                setComment("");
                fetchRoomData();
                fetchReviewEligibility();
            } else {
                setReviewMessage({
                    text: json.message || json.error || "Không thể gửi đánh giá, vui lòng thử lại.",
                    type: "error"
                });
            }
        } catch (err) {
            setReviewMessage({
                text: "Lỗi kết nối máy chủ khi gửi đánh giá.",
                type: "error"
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-muted-foreground font-medium">Đang tải thông tin chi tiết phòng trọ...</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">Không tìm thấy thông tin phòng</h2>
                <p className="text-muted-foreground text-sm mt-2 mb-6">Phòng có thể đã bị gỡ hoặc không tồn tại trên hệ thống.</p>
                <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm">
                    <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
                </Link>
            </div>
        );
    }

    // Các thông số chi phí
    const basePrice = Number(room.price) || 0;
    const estElectric = 250000; // ~80 kWh
    const estWater = 70000;     // ~1 người
    const wifiFee = Number(room.extraFees?.wifi) || 0;
    const trashFee = Number(room.extraFees?.trash) || 0;
    const parkingFee = Number(room.extraFees?.parking) || 0;
    const monthlyConsumables = basePrice + estElectric + estWater + wifiFee + trashFee + parkingFee;
    const depositMonths = room.depositMonths || 1;
    const totalDeposit = basePrice * depositMonths;

    // Dự toán dài hạn
    const totalConsumableOverTime = monthlyConsumables * durationMonths;
    const initialCashNeeded = basePrice + totalDeposit + (wifiFee + trashFee);

    const images = room.images && room.images.length > 0 ? room.images : [room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000"];

    return (
        <div className="bg-slate-50/50 min-h-screen pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-border/80 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-accent transition">
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            to={`/so-sanh?ids=${room._id || room.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-slate-700 hover:text-accent hover:border-accent/40 bg-white transition"
                        >
                            <Columns className="w-3.5 h-3.5 text-accent" /> So sánh phòng này
                        </Link>
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-slate-600 hover:text-foreground hover:bg-slate-50 transition"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                            {copied ? "Đã copy link" : "Chia sẻ"}
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 pt-6">
                {/* Banner Dữ liệu minh họa nếu có */}
                {room.isDemo && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-sm">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="text-xs leading-relaxed">
                            <span className="font-bold">Chế độ Dữ liệu minh họa SmartStay:</span> Tin đăng này được dùng cho mục đích trải nghiệm và minh họa cấu trúc dữ liệu chuẩn, chưa được khảo sát thực tế tại địa chỉ.
                        </div>
                    </div>
                )}

                {/* Tiêu đề & Badges */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-border shadow-sm mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {room.verificationStatus === 'verified' && !room.isDemo ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                Đã xác minh thực địa SmartStay
                            </span>
                        ) : room.verificationStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Đang chờ kiểm duyệt hồ sơ
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                                Tin tự do (Chưa kiểm duyệt)
                            </span>
                        )}

                        {room.has_pass && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-bold">
                                <ShieldCheck className="w-4 h-4" />
                                SmartStay Pass: Sang nhượng an toàn
                            </span>
                        )}

                        {room.property_name && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 border border-orange-200 text-xs font-bold">
                                🏠 {room.property_name}
                            </span>
                        )}

                        {room.available_rooms !== undefined && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Còn {room.available_rooms} phòng trống
                            </span>
                        )}
                    </div>

                    <h1 className="text-xl md:text-2xl font-heading font-black text-foreground leading-snug">
                        {room.property_name ? `${room.property_name}${room.room_number ? ` - ${room.room_number}` : ''}: ${room.title}` : room.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-accent" /> {room.address || room.location}
                        </span>
                        <span>•</span>
                        <span>Campus: <strong className="text-foreground">{room.campus}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Xác nhận còn phòng: {new Date(room.lastAvailabilityConfirmedAt || room.updatedAt || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                    </div>

                    {/* Image Gallery */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 rounded-2xl overflow-hidden h-[320px] md:h-[400px] bg-slate-100 border border-border relative group">
                            <img
                                src={images[activeImage]}
                                alt={room.title}
                                className="w-full h-full object-cover transition-all duration-300"
                            />
                            {images.length > 1 && (
                                <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-bold shadow">
                                    {activeImage + 1} / {images.length}
                                </div>
                            )}
                        </div>
                        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[400px] pr-1">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`relative rounded-xl overflow-hidden h-16 md:h-[72px] w-20 md:w-full flex-shrink-0 border-2 transition-all ${
                                        activeImage === idx ? "border-accent shadow-md ring-2 ring-accent/20 scale-[0.98]" : "border-transparent opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <img src={img} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/60 px-1 py-0.2 rounded">
                                        {idx + 1}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Cột trái (7 cols): Chi tiết phòng & Tiêu chí khắt khe */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 0. DANH SÁCH CÁC PHÒNG THUỘC KHU TRỌ NÀY */}
                        {room.rooms_list && room.rooms_list.length > 0 && (
                            <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100/70 flex items-center justify-center text-[#ea580c]">
                                            <DoorOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-heading font-bold text-base text-foreground">
                                                Danh sách các phòng thuộc khu trọ ({room.rooms_list.length} phòng)
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Cùng khuôn viên, an ninh và cổng trọ nhưng diện tích, tầng & giá thuê khác nhau
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Còn {room.rooms_list.filter(r => r.status === "available" || r.status === "Trống").length} phòng trống
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {room.rooms_list.map((subRoom, idx) => {
                                        const isAvail = subRoom.status === "available" || subRoom.status === "Trống";
                                        const isSelected = selectedSubRoom?.room_number === subRoom.room_number;

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    isSelected 
                                                        ? "border-[#f97316] bg-orange-50/50 ring-2 ring-[#f97316]/20 shadow-sm" 
                                                        : isAvail 
                                                            ? "border-slate-200/90 bg-slate-50/60 hover:border-orange-300 hover:bg-white" 
                                                            : "border-slate-200 bg-slate-100/70 opacity-75"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5">
                                                        <DoorOpen className="w-3.5 h-3.5 text-[#f97316]" />
                                                        {subRoom.room_number}
                                                    </span>
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                        isAvail 
                                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                                            : "bg-slate-200 text-slate-600"
                                                    }`}>
                                                        {isAvail ? "● Còn trống" : "● Đã thuê"}
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline justify-between gap-1 mb-2">
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {subRoom.floor ? `Tầng ${subRoom.floor}` : "Tầng trệt"} • {subRoom.area_sqm || room.area_sqm || 20}m²
                                                    </span>
                                                    <span className="font-heading font-black text-[#f97316] text-base">
                                                        {Number(subRoom.price || room.price).toLocaleString("vi-VN")} đ
                                                        <span className="text-[10px] text-slate-400 font-normal">/th</span>
                                                    </span>
                                                </div>

                                                {subRoom.amenities && subRoom.amenities.length > 0 && (
                                                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-3">
                                                        {subRoom.amenities.join(" • ")}
                                                    </div>
                                                )}

                                                {isAvail ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSubRoom(subRoom);
                                                            setShowBookingModal(true);
                                                        }}
                                                        className="w-full py-2 px-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5" /> Chọn phòng này & Đặt hẹn
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 px-3 rounded-xl bg-slate-200/80 text-slate-500 font-bold text-xs text-center">
                                                        Phòng đã có người ở
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 1. BẢNG KIỂM KÊ TỔNG CHI PHÍ THỰC TẾ HÀNG THÁNG */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-heading font-bold text-base text-foreground">Bảng kiểm kê chi phí thực tế hàng tháng</h2>
                                    <p className="text-xs text-muted-foreground">Chi phí rõ ràng, nói KHÔNG với phát sinh ẩn</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                                <div className="flex justify-between items-center text-sm py-1 border-b border-border/60">
                                    <span className="text-foreground font-semibold">Giá thuê niêm yết:</span>
                                    <span className="font-bold text-foreground text-base">
                                        {basePrice.toLocaleString('vi-VN')} đ/tháng
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Tiền điện (dự tính ~80 kWh):
                                    </span>
                                    <span className="font-medium text-foreground">
                                        ~{estElectric.toLocaleString('vi-VN')} đ ({!room.electricityCostType || room.electricityCostType === 'nha_nuoc' || String(room.electricityCostType).includes('nhà nước') ? 'Giá nhà nước' : room.electricityCostType})
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Droplets className="w-3.5 h-3.5 text-blue-500" /> Tiền nước (dự tính 1 người):
                                    </span>
                                    <span className="font-medium text-foreground">
                                        ~{estWater.toLocaleString('vi-VN')} đ ({room.waterCost || 'Theo giá nhà nước'})
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Wi-Fi Internet:
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {wifiFee > 0 ? `${wifiFee.toLocaleString('vi-VN')} đ/tháng` : 'Miễn phí'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Rác & Vệ sinh:
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {trashFee > 0 ? `${trashFee.toLocaleString('vi-VN')} đ/tháng` : 'Miễn phí'}
                                    </span>
                                </div>

                                <div className="pt-3 mt-2 border-t-2 border-dashed border-border flex justify-between items-center">
                                    <div>
                                        <span className="text-xs uppercase tracking-wider font-bold text-accent">Tổng chi phí dự kiến / tháng:</span>
                                        <p className="text-[11px] text-muted-foreground">Thực tế người thuê phải chi trả</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-heading font-black text-xl text-accent">
                                            ~{monthlyConsumables.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tiền cọc */}
                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white rounded-xl border border-border">
                                    <span className="text-muted-foreground block">Tiền đặt cọc:</span>
                                    <strong className="text-sm font-bold text-foreground">
                                        {totalDeposit.toLocaleString('vi-VN')} đ ({depositMonths} tháng)
                                    </strong>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-border">
                                    <span className="text-muted-foreground block">Đồng hồ riêng:</span>
                                    <strong className="text-sm font-bold text-emerald-600">
                                        {room.hasSeparateMeter ? "Có đồng hồ riêng" : "Dùng chung / Khoán"}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. DỰ TOÁN CHI PHÍ THEO THỜI GIAN THUÊ (Tiêu chí 5.2) */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-heading font-bold text-base text-foreground">Dự toán dòng tiền theo thời hạn thuê</h2>
                                    <p className="text-xs text-muted-foreground">Tách bạch rõ chi phí tiêu hao và khoản cọc được hoàn lại</p>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                                    {[3, 6, 12].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setDurationMonths(m)}
                                            className={`px-3 py-1 rounded-lg transition ${
                                                durationMonths === m ? "bg-accent text-white shadow-sm" : "text-slate-600 hover:text-foreground"
                                            }`}
                                        >
                                            {m} tháng
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-border">
                                    <span className="text-muted-foreground block">Chi phí sinh hoạt {durationMonths} tháng:</span>
                                    <strong className="text-sm font-black text-slate-800 block mt-1">
                                        {totalConsumableOverTime.toLocaleString('vi-VN')} đ
                                    </strong>
                                    <span className="text-[10px] text-muted-foreground">Khoản chi tiêu hao hàng tháng</span>
                                </div>
                                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                                    <span className="text-emerald-800 font-semibold block">Tiền cọc bảo đảm:</span>
                                    <strong className="text-sm font-black text-emerald-700 block mt-1">
                                        {totalDeposit.toLocaleString('vi-VN')} đ
                                    </strong>
                                    <span className="text-[10px] text-emerald-600">Được hoàn lại khi kết thúc hợp đồng</span>
                                </div>
                                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                                    <span className="text-amber-800 font-semibold block">Cần chuẩn bị ngày ký HĐ:</span>
                                    <strong className="text-sm font-black text-amber-700 block mt-1">
                                        ~{initialCashNeeded.toLocaleString('vi-VN')} đ
                                    </strong>
                                    <span className="text-[10px] text-amber-600">Gồm cọc + tháng đầu tiên</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. DIỄN GIẢI ĐIỂM TIN CẬY (Tiêu chí 5.1) */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-heading font-bold text-base text-foreground">Diễn giải Điểm tin cậy (Trust Score)</h2>
                                    <p className="text-xs text-muted-foreground">Không chấp nhận mua điểm hay dùng quảng cáo để thay thế xác minh</p>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-sm rounded-xl border border-emerald-200">
                                    {room.safe_badge && !room.isDemo ? "88 / 100" : "55 / 100"}
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600" /> Xác minh quyền cho thuê & danh tính người đăng
                                    </span>
                                    <span className="font-bold text-emerald-600">{room.safe_badge ? "+25đ (Đã duyệt)" : "0đ (Chờ duyệt)"}</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <span className="flex items-center gap-2">
                                        {room.fireSafetyCertified ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
                                        Kiểm định trang bị PCCC & Lối thoát hiểm
                                    </span>
                                    <span className="font-bold text-emerald-600">{room.fireSafetyCertified ? "+25đ (Đạt chuẩn)" : "0đ"}</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600" /> Biểu phí chi tiết (Điện, nước, cọc niêm yết rõ)
                                    </span>
                                    <span className="font-bold text-emerald-600">+20đ</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600" /> Xác nhận tình trạng còn phòng trong 7 ngày
                                    </span>
                                    <span className="font-bold text-emerald-600">+10đ</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. ĐIỀU KIỆN SỐNG & AN TOÀN PCCC */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <h2 className="font-heading font-bold text-base text-foreground mb-4">
                                Quy định sinh hoạt & Tiêu chuẩn an toàn
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground">Giờ giấc ra vào</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {room.curfewType === 'tu_do' ? 'Tự do 24/7 (Có khóa vân tay/chìa riêng)' : 'Có giờ giới nghiêm buổi tối'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <Home className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground">Chung chủ</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {room.isWithLandlord ? 'Chung chủ nhà' : 'Không chung chủ, tự quản an ninh'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <Flame className={`w-5 h-5 flex-shrink-0 mt-0.5 ${room.fireSafetyCertified ? 'text-emerald-600' : 'text-amber-500'}`} />
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground">An toàn cháy nổ (PCCC)</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {room.fireSafetyCertified ? (room.fireSafetyDetails || 'Đạt chuẩn PCCC, có lối thoát hiểm thứ 2') : 'Chưa cập nhật biên bản kiểm định PCCC'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                    <Dog className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground">Nuôi thú cưng</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {room.petAllowed ? 'Cho phép nuôi thú cưng sạch sẽ' : 'Không cho phép nuôi thú cưng'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tiện nghi phòng */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <h2 className="font-heading font-bold text-base text-foreground mb-4">Tiện nghi có sẵn</h2>
                            <div className="flex flex-wrap gap-2">
                                {(room.amenities || []).map((amenity, idx) => (
                                    <span key={idx} className="px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                                        ✓ {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Mô tả chi tiết */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <h2 className="font-heading font-bold text-base text-foreground mb-3">Mô tả phòng</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {room.description || "Chưa có mô tả chi tiết từ người đăng."}
                            </p>
                        </div>
                    </div>

                    {/* Cột phải (5 cols): Nút hành động, Đặt lịch, Hợp đồng & Đánh giá */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Hộp hành động ghim */}
                        <div className="bg-white rounded-3xl p-6 border-2 border-accent/20 shadow-lg shadow-accent/5 ">
                            {room.price_min && room.price_max && room.price_min !== room.price_max ? (
                                <>
                                    <div className="text-xs text-muted-foreground mb-1">Khoảng giá các phòng trong khu trọ</div>
                                    <div className="flex flex-wrap items-baseline gap-1.5 mb-1.5">
                                        <span className="font-heading font-black text-2xl text-accent">
                                            {Number(room.price_min).toLocaleString('vi-VN')} - {Number(room.price_max).toLocaleString('vi-VN')} đ
                                        </span>
                                        <span className="text-xs text-muted-foreground">/ tháng</span>
                                    </div>
                                    {room.available_rooms !== undefined && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Còn {room.available_rooms} phòng trống
                                            {room.total_rooms && <span className="font-normal text-slate-500">• Tổng {room.total_rooms} phòng</span>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-xs text-muted-foreground mb-1">Giá thuê niêm yết</div>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="font-heading font-black text-3xl text-accent">
                                            {basePrice.toLocaleString('vi-VN')} đ
                                        </span>
                                        <span className="text-xs text-muted-foreground">/ tháng</span>
                                    </div>
                                </>
                            )}

                            {/* 3 Nút hành động lớn */}
                            <div className="space-y-2.5 mb-4">
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/20 hover:bg-accent/90 transition"
                                >
                                    <Calendar className="w-4 h-4" /> Đặt lịch xem phòng trực tiếp
                                </button>

                                <a
                                    href={`tel:${room.contactPhone}`}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                                >
                                    <Phone className="w-4 h-4" /> Gọi chủ trọ: {room.contactPhone || "0901234567"}
                                </a>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowContractModal(true)}
                                        className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-[11px] hover:border-accent hover:text-accent transition flex items-center justify-center gap-1.5"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Hợp đồng mẫu
                                    </button>
                                    <button
                                        onClick={() => setShowChecklistModal(true)}
                                        className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-[11px] hover:border-accent hover:text-accent transition flex items-center justify-center gap-1.5"
                                    >
                                        <ClipboardCheck className="w-3.5 h-3.5" /> Checklist xem trọ
                                    </button>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" /> SmartStay cọc an toàn
                                </span>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="text-rose-600 font-semibold hover:underline flex items-center gap-1"
                                >
                                    <AlertOctagon className="w-3 h-3" /> Báo cáo tin sai
                                </button>
                            </div>
                        </div>

                        {/* Phần Đánh giá từ người từng ở thật */}
                        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-heading font-bold text-base text-foreground">Đánh giá người thuê</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Độ chuẩn xác chi phí: <strong className="text-emerald-600">{reviewStats?.costAccuracyRate || "Chưa có dữ liệu"}</strong>
                                    </p>
                                </div>
                                {reviewStats && (
                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {reviewStats.avgRating}
                                    </div>
                                )}
                            </div>

                            {/* Danh sách review */}
                            <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-1">
                                {reviews.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">
                                        Chưa có đánh giá nào cho phòng này. Hãy là người đầu tiên đánh giá!
                                    </p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev._id || rev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">{rev.anonymous_name || rev.studentName}</span>
                                                    {rev.has_stayed ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300/60 shadow-xs">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã ở thật {rev.stayed_period ? `• ${rev.stayed_period}` : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px]">
                                                            {rev.stayed_period || "Người quan tâm"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex text-amber-400">
                                                    {[...Array(rev.rating || 5)].map((_, i) => (
                                                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 mb-2">{rev.comment || rev.content}</p>
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                                                <span>Chi phí thực tế: <strong>{(rev.actualMonthlyCost || 0).toLocaleString('vi-VN')} đ</strong></span>
                                                <span className={rev.isCostAccurate ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                                    {rev.isCostAccurate ? "✓ Đúng giá niêm yết" : "⚠️ Có phát sinh bất thường"}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Form Gửi Đánh Giá Trải Nghiệm Thực Tế */}
                            <div className="pt-4 border-t border-border space-y-3">
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                                    <span>Gửi đánh giá trải nghiệm thực tế</span>
                                    {reviewEligibility?.eligible && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            ✓ Đủ điều kiện
                                        </span>
                                    )}
                                </h3>

                                {reviewMessage.text && (
                                    <div className={`p-3 rounded-xl text-xs font-medium ${
                                        reviewMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}>
                                        {reviewMessage.text}
                                    </div>
                                )}

                                {/* CASE 1: Chưa đăng nhập */}
                                {(!user || reviewEligibility?.code === 'NOT_LOGGED_IN') && (
                                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-2.5">
                                        <p className="text-xs text-amber-900 font-medium">
                                            Chỉ người thuê đã thực sự sinh sống tại phòng này qua SmartStay mới có thể gửi đánh giá.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                                        >
                                            Đăng nhập ngay
                                        </button>
                                    </div>
                                )}

                                {/* CASE 2: Chưa có Stay xác thực */}
                                {user && reviewEligibility?.code === 'NO_VERIFIED_STAY' && (
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                            Chỉ tài khoản đã thực sự sinh sống tại phòng này qua SmartStay mới đánh giá được.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowCheckinDialog(true)}
                                            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 mx-auto"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Tôi đã ở phòng này</span>
                                        </button>
                                    </div>
                                )}

                                {/* CASE 3: Stay đang chờ duyệt */}
                                {user && reviewEligibility?.code === 'STAY_PENDING_CONFIRMATION' && (
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                                        <div className="font-bold flex items-center gap-1.5 text-blue-800">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            Đang chờ chủ trọ xác nhận nhận phòng
                                        </div>
                                        <p className="text-blue-700 leading-relaxed">
                                            Yêu cầu nhận phòng của bạn đã được gửi tới chủ trọ. Sau khi chủ trọ xác nhận và bạn lưu trú tối thiểu 14 ngày, bạn sẽ có thể gửi đánh giá.
                                        </p>
                                    </div>
                                )}

                                {/* CASE 4: Stay chưa đủ 14 ngày */}
                                {user && reviewEligibility?.code === 'STAY_TOO_SHORT' && (
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                                        <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                                            Đã xác nhận đang ở ({reviewEligibility.daysStayed || 0}/14 ngày)
                                        </div>
                                        <p className="text-amber-800 leading-relaxed">
                                            Để đảm bảo tính khách quan và trải nghiệm thực tế, bạn sẽ có thể gửi đánh giá sau <strong>{reviewEligibility.availableDate ? new Date(reviewEligibility.availableDate).toLocaleDateString('vi-VN') : '14 ngày'}</strong> (còn <strong>{reviewEligibility.daysLeft || 14} ngày</strong> nữa).
                                        </p>
                                    </div>
                                )}

                                {/* CASE 5: Đã review rồi */}
                                {user && reviewEligibility?.code === 'ALREADY_REVIEWED' && (
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <span>Bạn đã gửi đánh giá trải nghiệm thực tế cho đợt lưu trú này. Cảm ơn đóng góp của bạn!</span>
                                    </div>
                                )}

                                {/* CASE 6: Quá hạn review 90 ngày */}
                                {user && reviewEligibility?.code === 'REVIEW_WINDOW_EXPIRED' && (
                                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                        <span>Thời hạn gửi đánh giá đã kết thúc (&gt; 90 ngày kể từ ngày kết thúc lưu trú).</span>
                                    </div>
                                )}

                                {/* CASE 7: Chủ trọ của phòng */}
                                {user && reviewEligibility?.code === 'LANDLORD_CANNOT_REVIEW' && (
                                    <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span>Bạn là chủ trọ của phòng này. Chủ nhà trọ không thể tự gửi đánh giá phòng của chính mình.</span>
                                    </div>
                                )}

                                {/* CASE 8: Đủ điều kiện -> HIỆN FORM ĐÁNH GIÁ */}
                                {user && reviewEligibility?.eligible === true && (
                                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>
                                                Xác minh: <strong>Đã ở {reviewEligibility.stayDurationMonths || 1} tháng</strong> • Đánh giá của bạn sẽ được gắn huy hiệu <strong>✓ Đã ở thật</strong>.
                                            </span>
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">Mức độ hài lòng (1 - 5 sao)</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        type="button"
                                                        key={num}
                                                        onClick={() => setRating(num)}
                                                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                                                            rating >= num ? "bg-amber-400 text-white border-amber-400" : "bg-white border-border text-slate-400"
                                                        }`}
                                                    >
                                                        ★ {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">
                                                Tổng chi phí thực tế bạn phải trả mỗi tháng (VNĐ)
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={actualMonthlyCost}
                                                onChange={(e) => setActualMonthlyCost(e.target.value)}
                                                placeholder="Ví dụ: 2850000"
                                                className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Hệ thống sẽ tự động đối chiếu với giá niêm yết ({room?.price ? (room.price).toLocaleString('vi-VN') + ' đ' : ''}) để đánh giá độ chuẩn xác chi phí.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">Nhận xét trải nghiệm thực tế</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Chia sẻ chân thật về phòng trọ: an ninh, giờ giấc, thái độ chủ trọ, thiết bị..."
                                                className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                                className="rounded text-orange-500 focus:ring-orange-400"
                                            />
                                            <span>Đăng ẩn danh (Ẩn tên và ảnh đại diện trên đánh giá)</span>
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            <Send className="w-3.5 h-3.5" /> {submittingReview ? "Đang gửi..." : "Gửi đánh giá xác minh (✓ Đã ở thật)"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ==================== MODAL XÁC MINH NGƯỜI THUÊ THẬT ==================== */}
            <CheckinVerificationDialog
                isOpen={showCheckinDialog}
                onClose={() => setShowCheckinDialog(false)}
                room={room}
                onVerificationSuccess={() => {
                    fetchReviewEligibility();
                    fetchRoomData();
                }}
            />

            {/* ==================== MODAL 1: ĐẶT LỊCH XEM PHÒNG 2 CHIỀU ==================== */}
            {showBookingModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => { setShowBookingModal(false); setBookingResult(null); }}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-base text-foreground">Đặt lịch xem phòng trực tiếp</h3>
                                <p className="text-xs text-muted-foreground">{room.title.slice(0, 40)}...</p>
                            </div>
                        </div>

                        {bookingResult ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                <h4 className="font-bold text-base text-foreground">Đặt lịch hẹn thành công!</h4>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                    Mã lịch hẹn của bạn: <strong className="text-accent text-sm">{bookingResult.appointmentCode}</strong>
                                </p>
                                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-left text-slate-600 mb-6 space-y-1">
                                    <p>• Trạng thái: <strong className="text-blue-600">Chờ chủ trọ xác nhận</strong></p>
                                    <p>• Ngày hẹn: <strong>{bookingDate}</strong> lúc <strong>{bookingTime}</strong></p>
                                    <p>• Hệ thống sẽ gửi tin nhắn SMS/Zalo nhắc trước 2 giờ.</p>
                                </div>
                                <button
                                    onClick={() => { setShowBookingModal(false); setBookingResult(null); }}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                >
                                    Đã hiểu & Đóng
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
                                {room.rooms_list && room.rooms_list.length > 0 && (
                                    <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200">
                                        <label className="text-slate-800 font-bold block mb-1">
                                            Phòng bạn quan tâm / muốn xem:
                                        </label>
                                        <select
                                            value={selectedSubRoom?.room_number || ""}
                                            onChange={(e) => {
                                                const found = (room.rooms_list || []).find(r => r.room_number === e.target.value);
                                                setSelectedSubRoom(found || null);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-orange-300 outline-none bg-white font-bold text-slate-800"
                                        >
                                            <option value="">-- Bất kỳ phòng nào còn trống --</option>
                                            {room.rooms_list.map((r, i) => (
                                                <option key={i} value={r.room_number}>
                                                    {r.room_number} - {Number(r.price).toLocaleString('vi-VN')} đ/tháng ({r.status === 'available' || r.status === 'Trống' ? 'Còn trống' : 'Đã thuê'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-muted-foreground block mb-1">Ngày muốn xem phòng (*)</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split("T")[0]}
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-muted-foreground block mb-1">Khung giờ dự kiến (*)</label>
                                    <select
                                        value={bookingTime}
                                        onChange={(e) => setBookingTime(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none bg-white"
                                    >
                                        <option value="08:30">08:30 Sáng</option>
                                        <option value="09:30">09:30 Sáng</option>
                                        <option value="11:30">11:30 Trưa</option>
                                        <option value="14:30">14:30 Chiều</option>
                                        <option value="17:30">17:30 Chiều (Sau giờ học)</option>
                                        <option value="19:00">19:00 Buổi tối</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-muted-foreground block mb-1">Số điện thoại của bạn (*)</label>
                                    <input
                                        type="tel"
                                        required
                                        value={bookingPhone}
                                        onChange={(e) => setBookingPhone(e.target.value)}
                                        placeholder="0912 345 678"
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-muted-foreground block mb-1">Ghi chú cho chủ trọ</label>
                                    <textarea
                                        rows={2}
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                        placeholder="Em muốn xem trước nhà vệ sinh và chỗ để xe máy..."
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="w-full py-3 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent/90 transition shadow-md shadow-accent/20"
                                >
                                    {bookingLoading ? "Đang gửi yêu cầu..." : "Xác nhận gửi lịch hẹn"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ==================== MODAL 2: MẪU HỢP ĐỒNG THUÊ CHUẨN PHÁP LÝ ==================== */}
            {showContractModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div>
                                <h3 className="font-heading font-black text-lg text-foreground">
                                    Hợp đồng thuê nhà trọ chuẩn pháp luật Việt Nam
                                </h3>
                                <p className="text-xs text-muted-foreground">Phân định rõ trách nhiệm hao mòn thiết bị, hoàn cọc và cam kết điện nước</p>
                            </div>
                            <button
                                onClick={() => setShowContractModal(false)}
                                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-4 text-xs text-slate-700 space-y-4 leading-relaxed pr-2">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-900 border border-blue-200">
                                <strong>SmartStay lưu ý:</strong> Hợp đồng này được thiết kế theo Bộ luật Dân sự 2015 và Luật Nhà ở, bảo vệ quyền lợi người thuê trước các rủi ro trừ cọc vô lý hoặc tự ý tăng giá.
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">ĐIỀU 1: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ</h4>
                                <p>• Căn phòng: <strong>{room.title}</strong> tại địa chỉ: {room.address || room.location}.</p>
                                <p>• Diện tích sử dụng: {room.area_sqm} m². Trang bị nội thất có biên bản bàn giao kèm theo.</p>
                                <p>• Thời hạn hợp đồng: {durationMonths} tháng kể từ ngày ký.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">ĐIỀU 2: TIỀN THUÊ VÀ CHI PHÍ ĐIỆN NƯỚC</h4>
                                <p>• Giá thuê cố định: <strong>{basePrice.toLocaleString('vi-VN')} VNĐ/tháng</strong> (Không được tự ý tăng giá trong suốt thời hạn hợp đồng).</p>
                                <p>• Tiền điện: Thu theo chỉ số công tơ riêng ({!room.electricityCostType || room.electricityCostType === 'nha_nuoc' || String(room.electricityCostType).includes('nhà nước') ? 'Giá theo biểu giá nhà nước' : room.electricityCostType}).</p>
                                <p>• Tiền nước: {room.waterCost || 'Theo giá quy định nhà nước'}.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">ĐIỀU 3: BẢO VỆ TIỀN CỌC & ĐIỀU KIỆN HOÀN TRẢ</h4>
                                <p>• Tiền cọc: <strong>{totalDeposit.toLocaleString('vi-VN')} VNĐ</strong> ({depositMonths} tháng).</p>
                                <p>• <strong>Cam kết hoàn cọc:</strong> Bên cho thuê có trách nhiệm hoàn lại 100% tiền cọc cho Bên thuê trong vòng <strong>03 ngày làm việc</strong> sau khi thanh lý hợp đồng và bàn giao phòng sạch sẽ.</p>
                                <p>• Thông báo chấm dứt trước hạn: Phải thông báo bằng văn bản hoặc tin nhắn trước ít nhất <strong>30 ngày</strong>.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">ĐIỀU 4: PHÂN ĐỊNH TRÁCH NHIỆM BẢO TRÌ & SỬA CHỮA (RẤT QUAN TRỌNG)</h4>
                                <p>• <strong>Hao mòn tự nhiên:</strong> Thiết bị hư hỏng do quá trình sử dụng thông thường theo thời gian (máy lạnh hết ga, block máy nén cũ, quạt cháy, rò rỉ đường ống nước âm tường) do <strong>Bên cho thuê (Chủ trọ) chịu toàn bộ chi phí sửa chữa</strong>.</p>
                                <p>• <strong>Hư hỏng do lỗi:</strong> Người thuê chỉ chịu trách nhiệm bồi thường khi làm bể vỡ thiết bị do tác động vật lý hoặc cố ý sử dụng sai quy định kỹ thuật.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">ĐIỀU 5: AN NINH & ĐĂNG KÝ TẠM TRÚ</h4>
                                <p>• Bên cho thuê có trách nhiệm hỗ trợ làm thủ tục đăng ký tạm trú cho người thuê tại Công an phường sở tại theo Luật Cư trú.</p>
                                <p>• Đảm bảo lối thoát hiểm PCCC thông thoáng và trang bị bình chữa cháy định kỳ.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Có thể in hoặc tải về để đối chiếu trước khi ký</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" /> In hợp đồng
                                </button>
                                <button
                                    onClick={() => setShowContractModal(false)}
                                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL 3: CHECKLIST XEM PHÒNG THỰC ĐỊA ==================== */}
            {showChecklistModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowChecklistModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ClipboardCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-base text-foreground">Checklist bỏ túi khi đi xem phòng</h3>
                                <p className="text-xs text-muted-foreground">Tích chọn trực tiếp để tự kiểm tra chất lượng thực tế</p>
                            </div>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-700 my-4 max-h-[60vh] overflow-y-auto pr-1">
                            {[
                                { key: "meterChecked", text: "Kiểm tra đồng hồ điện & nước: Có riêng biệt không, số đếm có nhảy bình thường?" },
                                { key: "lockChecked", text: "Thử khóa cửa, then cài và kiểm tra camera an ninh lối đi chung" },
                                { key: "waterPressureChecked", text: "Mở vòi sen, xả nước bồn cầu kiểm tra áp lực nước và mùi cống" },
                                { key: "fireSafetyChecked", text: "Hỏi rõ lối thoát hiểm thứ 2 ở đâu và vị trí bình chữa cháy PCCC" },
                                { key: "appliancesChecked", text: "Bật thử máy lạnh, máy giặt, quạt xem có kêu to hoặc rò rỉ nước không" },
                                { key: "curfewChecked", text: "Xác nhận lại giờ giấc có giới nghiêm không, có cho bạn bè đến chơi không" },
                                { key: "photoTaken", text: "Chụp ảnh lại toàn bộ hiện trạng trầy xước của phòng trước khi dọn vào" },
                                { key: "idChecked", text: "Đối chiếu CCCD người ký hợp đồng với quyền cho thuê phòng" },
                            ].map((item) => (
                                <label
                                    key={item.key}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                                        checklistState[item.key] ? "bg-emerald-50/80 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checklistState[item.key]}
                                        onChange={(e) => setChecklistState({ ...checklistState, [item.key]: e.target.checked })}
                                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="leading-snug">{item.text}</span>
                                </label>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-700">
                                Đã kiểm tra: {Object.values(checklistState).filter(Boolean).length}/8 tiêu chí
                            </span>
                            <button
                                onClick={() => setShowChecklistModal(false)}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                            >
                                Lưu kết quả kiểm tra
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL 4: BÁO CÁO KHIẾU NẠI (CẤP TICKET ID) ==================== */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => { setShowReportModal(false); setReportResult(null); }}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <AlertOctagon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-base text-foreground">Báo cáo tin đăng sai lệch / Lừa đảo</h3>
                                <p className="text-xs text-muted-foreground">SmartStay sẽ cấp Ticket ID để bạn theo dõi tiến độ</p>
                            </div>
                        </div>

                        {reportResult ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                <h4 className="font-bold text-base text-foreground">Đã tiếp nhận khiếu nại!</h4>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                    Mã Ticket theo dõi vụ việc: <strong className="text-rose-600 text-sm">{reportResult.ticketCode}</strong>
                                </p>
                                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-left text-slate-600 mb-6 space-y-1">
                                    <p>• Trạng thái: <strong>Đang thẩm định</strong></p>
                                    <p>• Thời hạn phản hồi: <strong>24 giờ làm việc</strong>.</p>
                                    <p>• Nếu xác minh có vi phạm, tin đăng sẽ bị tạm ẩn ngay lập tức.</p>
                                </div>
                                <button
                                    onClick={() => { setShowReportModal(false); setReportResult(null); }}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                >
                                    Đã hiểu & Đóng
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="text-muted-foreground block mb-1">Lý do báo cáo (*)</label>
                                    <select
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none bg-white font-medium"
                                    >
                                        <option value="fake_price">Giá thuê thực tế cao hơn giá niêm yết (Phí ẩn)</option>
                                        <option value="fake_address">Địa chỉ hoặc ghim vị trí sai lệch thực tế</option>
                                        <option value="fake_photos">Ảnh trên web là ảnh mạng / Khác phòng thật</option>
                                        <option value="deposit_fraud">Yêu cầu chuyển cọc trước khi xem phòng / Chiếm đoạt cọc</option>
                                        <option value="unauthorized_poster">Người đăng không có quyền cho thuê (Cò môi giới)</option>
                                        <option value="curfew_issue">Khai gian giờ giấc / Không có lối thoát PCCC</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-muted-foreground block mb-1">Số điện thoại hoặc Zalo liên hệ của bạn (*)</label>
                                    <input
                                        type="tel"
                                        required
                                        value={reportContact}
                                        onChange={(e) => setReportContact(e.target.value)}
                                        placeholder="Để đội ngũ SmartStay đối chiếu thông tin"
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>

                                <div>
                                    <label className="text-muted-foreground block mb-1">Mô tả cụ thể sự việc (*)</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={reportDesc}
                                        onChange={(e) => setReportDesc(e.target.value)}
                                        placeholder="Ví dụ: Em đến xem thì chủ trọ báo tiền điện 5.000đ/số và bắt đóng thêm phí quản lý 200k không có trên web..."
                                        className="w-full px-3 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={reportLoading}
                                    className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-md shadow-rose-200"
                                >
                                    {reportLoading ? "Đang gửi báo cáo..." : "Gửi khiếu nại & Cấp Ticket ID"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
