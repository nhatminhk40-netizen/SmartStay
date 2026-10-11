import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
    MapPin,
    ArrowLeft,
    ShieldCheck,
    BadgeCheck,
    CheckCircle2,
    XCircle,
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
    Check
} from "lucide-react";

export default function RoomDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const [room, setRoom] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [copied, setCopied] = useState(false);

    // Form gửi đánh giá
    const [rating, setRating] = useState(5);
    const [isCostAccurate, setIsCostAccurate] = useState(true);
    const [actualMonthlyCost, setActualMonthlyCost] = useState("");
    const [comment, setComment] = useState("");
    const [proofUrl, setProofUrl] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ text: "", type: "" });

    // Tải thông tin phòng và đánh giá
    const fetchRoomData = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Room.get(id);
            setRoom(data);

            if (data && data.price) {
                setActualMonthlyCost(data.price + 350000); // Ước lượng mẫu
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

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            setReviewMessage({
                text: "Vui lòng đăng nhập tài khoản để gửi đánh giá và nhận điểm uy tín.",
                type: "error"
            });
            return;
        }

        setSubmittingReview(true);
        setReviewMessage({ text: "", type: "" });

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    room: room._id || room.id,
                    rating,
                    isCostAccurate,
                    actualMonthlyCost: Number(actualMonthlyCost),
                    comment,
                    verificationProofUrl: proofUrl,
                    isAnonymous
                })
            });

            const json = await res.json();
            if (json.success) {
                setReviewMessage({
                    text: "Gửi đánh giá thành công! Đánh giá của bạn đã được ghi nhận.",
                    type: "success"
                });
                setComment("");
                setProofUrl("");
                fetchRoomData();
            } else {
                setReviewMessage({
                    text: json.message || "Không thể gửi đánh giá, vui lòng thử lại.",
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
            <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-muted-foreground font-medium">Đang tải thông tin phòng trọ...</p>
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

    // Tính toán ước tính chi phí thực tế hàng tháng
    const basePrice = Number(room.price) || 0;
    const estElectric = 250000; // Ước tính 80-100 kWh
    const estWater = 70000;     // Ước tính 1 người
    const wifiFee = Number(room.extraFees?.wifi) || 0;
    const trashFee = Number(room.extraFees?.trash) || 0;
    const parkingFee = Number(room.extraFees?.parking) || 0;
    const totalEstMonthly = basePrice + estElectric + estWater + wifiFee + trashFee + parkingFee;
    const depositMonths = room.depositMonths || 1;
    const totalDeposit = basePrice * depositMonths;

    const images = room.images && room.images.length > 0 ? room.images : [room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000"];

    return (
        <div className="bg-slate-50/50 min-h-screen pb-16">
            {/* Top Navigation */}
            <div className="bg-white border-b border-border/80 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-accent transition">
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 transition"
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
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="text-xs">
                            <span className="font-bold">Dữ liệu minh họa SmartStay:</span> Tin đăng này được dùng cho mục đích trải nghiệm và minh họa cấu trúc dữ liệu minh bạch, chưa được khảo sát thực tế tại địa chỉ.
                        </div>
                    </div>
                )}

                {/* Tiêu đề & Badges */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-border shadow-sm mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {room.verificationStatus === 'verified' ? (
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

                        {room.seeking_roommate && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                                Tìm bạn ở ghép
                            </span>
                        )}
                    </div>

                    <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground leading-snug">
                        {room.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-accent" /> {room.address || room.location}
                        </span>
                        <span>•</span>
                        <span>Campus: <strong className="text-foreground">{room.campus}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Cập nhật còn phòng: {new Date(room.lastAvailabilityConfirmedAt || room.updatedAt || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                    </div>

                    {/* Image Gallery */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 rounded-2xl overflow-hidden h-[340px] md:h-[420px] bg-slate-100 border border-border">
                            <img
                                src={images[activeImage]}
                                alt={room.title}
                                className="w-full h-full object-cover transition-all duration-300"
                            />
                        </div>
                        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`relative rounded-xl overflow-hidden h-20 md:h-[95px] w-24 md:w-full flex-shrink-0 border-2 transition-all ${
                                        activeImage === idx ? "border-accent shadow-md ring-2 ring-accent/20 scale-[0.98]" : "border-transparent opacity-75 hover:opacity-100"
                                    }`}
                                >
                                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Cột trái: Chi tiết & Minh bạch */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. BẢNG KIỂM KÊ TỔNG CHI PHÍ THỰC TẾ (P1 Trọng tâm) */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-heading font-bold text-base text-foreground">Bảng kiểm kê tổng chi phí thực tế hàng tháng</h2>
                                    <p className="text-xs text-muted-foreground">Minh bạch rõ ràng, nói KHÔNG với phát sinh ẩn</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                                <div className="flex justify-between items-center text-sm py-1 border-b border-border/60">
                                    <span className="text-foreground font-medium">Giá thuê niêm yết:</span>
                                    <span className="font-bold text-foreground text-base">
                                        {basePrice.toLocaleString('vi-VN')} đ/tháng
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs py-1 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Tiền điện (dự tính ~80 kWh):
                                    </span>
                                    <span className="font-medium text-foreground">
                                        ~{estElectric.toLocaleString('vi-VN')} đ ({room.electricityCostType === 'nha_nuoc' ? 'Giá nhà nước' : 'Kinh doanh / Cố định'})
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
                                        <p className="text-[11px] text-muted-foreground">Thực tế sinh viên phải chi trả</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-heading font-black text-xl text-accent">
                                            ~{totalEstMonthly.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tiền cọc & Hợp đồng */}
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
                                        {room.hasSeparateMeter ? "Có đồng hồ riêng" : "Dùng chung"}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. ĐIỀU KIỆN SỐNG & AN TOÀN PCCC (P1 Trọng tâm) */}
                        <div className="bg-white rounded-3xl p-6 md:p-7 border border-border shadow-sm">
                            <h2 className="font-heading font-bold text-base text-foreground mb-4">
                                Quy định sinh hoạt & Tiêu chuẩn An toàn
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
                                            {room.isWithLandlord ? 'Có chung chủ' : 'Không chung chủ, tự quản an ninh'}
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

                    {/* Cột phải: Liên hệ & Đánh giá xác minh */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Thẻ hành động nhanh */}
                        <div className="bg-white rounded-3xl p-6 border-2 border-accent/20 shadow-lg shadow-accent/5 sticky top-20">
                            <div className="text-xs text-muted-foreground mb-1">Giá thuê niêm yết</div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="font-heading font-black text-3xl text-accent">
                                    {basePrice.toLocaleString('vi-VN')} đ
                                </span>
                                <span className="text-xs text-muted-foreground">/ tháng</span>
                            </div>

                            <a
                                href={`tel:${room.contactPhone}`}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:bg-accent/90 transition mb-3"
                            >
                                <Phone className="w-4 h-4" /> Liên hệ chủ trọ: {room.contactPhone || "0901234567"}
                            </a>

                            <div className="text-center">
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    SmartStay cam kết bảo vệ sinh viên trước cọc ảo
                                </span>
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
                            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
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
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã ở thật
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

                            {/* Form Gửi Đánh Giá Minh Bạch */}
                            <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-border space-y-3">
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                    Gửi đánh giá trải nghiệm thực tế
                                </h3>

                                {reviewMessage.text && (
                                    <div className={`p-3 rounded-xl text-xs font-medium ${
                                        reviewMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}>
                                        {reviewMessage.text}
                                    </div>
                                )}

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
                                    <label className="text-[11px] text-muted-foreground block mb-1">Tổng chi phí thực tế bạn phải trả mỗi tháng (VNĐ)</label>
                                    <input
                                        type="number"
                                        required
                                        value={actualMonthlyCost}
                                        onChange={(e) => setActualMonthlyCost(e.target.value)}
                                        placeholder="Ví dụ: 2850000"
                                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={isCostAccurate}
                                        onChange={(e) => setIsCostAccurate(e.target.checked)}
                                        className="rounded text-accent focus:ring-accent"
                                    />
                                    <span>Chi phí thanh toán thực tế đúng với cam kết ban đầu</span>
                                </label>

                                <div>
                                    <label className="text-[11px] text-muted-foreground block mb-1">Nhận xét chi tiết</label>
                                    <textarea
                                        required
                                        rows={2}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Chủ trọ có thân thiện không? Nước nôi, an ninh, wifi thế nào?..."
                                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] text-muted-foreground block mb-1">Link ảnh minh chứng đã ở (hóa đơn tiền phòng / hợp đồng)</label>
                                    <input
                                        type="url"
                                        value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                        placeholder="https://... (để được gắn nhãn Đã ở thật)"
                                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-accent/30 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" /> {submittingReview ? "Đang gửi..." : "Gửi đánh giá xác minh"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
