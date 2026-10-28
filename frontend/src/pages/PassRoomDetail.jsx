import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  MapPin,
  Heart,
  Share2,
  Calendar,
  AlertTriangle,
  Sparkles,
  Phone,
  MessageCircle,
  CheckCircle2,
  Lock,
  UserCheck,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Flag,
  FileText,
  BadgeAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PassRoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Modal Yêu cầu nhận phòng
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reservePhone, setReservePhone] = useState(user?.phone || "");
  const [reserveMsg, setReserveMsg] = useState("");
  const [submittingReserve, setSubmittingReserve] = useState(false);

  // Modal Báo cáo
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Lừa đảo tiền cọc");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadRoomDetail();
  }, [id]);

  const loadRoomDetail = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.PassRoom.get(id);
      if (res) {
        setRoom(res);
        if (user && Array.isArray(res.savedBy)) {
          setIsSaved(res.savedBy.includes(user._id || user.id));
        }
      }
    } catch (err) {
      console.warn("Lỗi tải chi tiết:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để lưu tin pass phòng");
      navigate("/dang-nhap");
      return;
    }
    try {
      if (isSaved) {
        await base44.entities.PassRoom.unsave(id);
        setIsSaved(false);
        toast.success("Đã bỏ lưu tin");
      } else {
        await base44.entities.PassRoom.save(id);
        setIsSaved(true);
        toast.success("Đã lưu tin vào danh sách yêu thích");
      }
    } catch {
      toast.error("Không thể cập nhật yêu thích");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết phòng vào bộ nhớ tạm!");
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setSubmittingReserve(true);
    try {
      const res = await base44.entities.PassRoom.reserve(id, reserveMsg, reservePhone);
      if (res.success) {
        toast.success("Đã gửi yêu cầu nhận phòng thành công!");
        setReserveModalOpen(false);
        loadRoomDetail();
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu");
      }
    } catch (err) {
      toast.error("Lỗi khi gửi yêu cầu nhận phòng");
    } finally {
      setSubmittingReserve(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setSubmittingReport(true);
    try {
      const res = await base44.entities.PassRoom.report(id, reportReason, reportDesc);
      if (res.success) {
        toast.success("Đã gửi báo cáo vi phạm đến ban quản trị SmartStay.");
        setReportModalOpen(false);
      } else {
        toast.error(res.message || "Gửi báo cáo thất bại");
      }
    } catch {
      toast.error("Lỗi gửi báo cáo");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
        <p className="text-sm font-bold text-slate-500">Đang tải chi tiết phòng pass...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">Không tìm thấy phòng pass</h2>
        <p className="text-sm text-slate-500 mb-6">Phòng có thể đã bị xóa hoặc đã chuyển nhượng thành công.</p>
        <Link to="/pass-phong">
          <Button className="rounded-full bg-slate-900 text-white font-bold px-6">
            Xem danh sách phòng pass khác
          </Button>
        </Link>
      </div>
    );
  }

  const passPrice = Number(room.passPrice || room.price || 0);
  const depositAmount = Number(room.depositAmount || room.deposit || room.remaining_deposit || passPrice);
  const monthlyRent = Number(room.monthlyRent || room.price || passPrice);
  const savings = Math.max(0, depositAmount - passPrice);
  const isVerified = room.status === "verified" || room.status === "landlord_confirmed";
  const isOwner = user && (String(user._id || user.id) === String(room.owner?._id || room.owner) || user.email === room.ownerEmail);

  const images = Array.isArray(room.images) && room.images.length > 0 
    ? room.images 
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"];

  return (
    <div className="bg-[#fdfbf7] min-h-screen pb-20 font-sans">
      {/* 1. Header điều hướng & Nút Chia sẻ */}
      <div className="border-b border-[#f4ebd9] bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/pass-phong"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#f97316]" /> Danh sách pass phòng
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              className="rounded-full h-9 px-3.5 border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Chia sẻ
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleSave}
              className={`rounded-full h-9 px-3.5 border-slate-200 text-xs font-bold flex items-center gap-1.5 ${
                isSaved ? "bg-rose-50 text-rose-600 border-rose-200" : "text-slate-700"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
              {isSaved ? "Đã lưu" : "Lưu tin"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 2. CẢNH BÁO NẾU PHÒNG CHƯA ĐƯỢC CHỦ TRỌ XÁC NHẬN */}
        {!isVerified && (
          <div className="mb-8 bg-amber-500/10 border-2 border-amber-400 rounded-3xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <BadgeAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-black text-amber-900 text-base">
                Cảnh báo an toàn: Phòng này đang chờ chủ trọ xác nhận!
              </h4>
              <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
                Chủ trọ chưa bấm duyệt link xác nhận chuyển nhượng. <strong>TUYỆT ĐỐI KHÔNG CHUYỂN TIỀN CỌC</strong> hoặc đặt cọc giữ chỗ trước khi có sự đồng ý chính thức từ chủ trọ trên hệ thống SmartStay.
              </p>
            </div>
          </div>
        )}

        {/* 3. GALLERY NHIỀU ẢNH (Có Thumbnail & Lightbox) */}
        <div className="mb-8">
          <div className="relative h-[380px] sm:h-[480px] rounded-3xl overflow-hidden bg-slate-900 group shadow-md">
            <img
              src={images[activeImageIdx]}
              alt={room.title}
              className="w-full h-full object-cover transition-all duration-300 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Nút phóng to Lightbox */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-4 h-4" /> Xem toàn màn hình ({images.length} ảnh)
            </button>

            {/* Điều hướng ảnh trước / sau */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Trạng thái xác nhận góc trên */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isVerified ? (
                <span className="px-3.5 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Chủ trọ đã xác nhận
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Chờ chủ trọ duyệt
                </span>
              )}
            </div>
          </div>

          {/* Dải thumbnail xem nhanh */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-3 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImageIdx ? "border-[#f97316] ring-2 ring-[#f97316]/30 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. LAYOUT CHÍNH: CỘT THÔNG TIN & CỘT HÀNH ĐỘNG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI (2/3): Chi tiết phòng, tiện ích, hợp đồng, checklist an toàn */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tiêu đề & Địa chỉ */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#f4ebd9] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-orange-50 text-[#f97316] text-xs font-bold rounded-full border border-orange-200">
                  {room.campus}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {room.room_type || "Phòng trọ khép kín"}
                </span>
              </div>
              <h1 className="font-heading font-black text-slate-900 text-2xl sm:text-3xl leading-snug mb-3">
                {room.title}
              </h1>
              <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-[#f97316] shrink-0" />
                <span>{room.address}</span>
              </p>
            </div>

            {/* Bảng Chi Tiết Tài Chính & Tiết Kiệm */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#f4ebd9] shadow-sm space-y-6">
              <h3 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#f97316]" /> So sánh chi phí sang nhượng cọc
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#fff9f2] border border-[#fdecdb] rounded-2xl p-4">
                  <span className="text-xs font-bold uppercase text-[#ea580c] block mb-1">Giá pass nhượng</span>
                  <span className="text-2xl font-black text-[#f97316] block">{passPrice.toLocaleString()}đ</span>
                  <span className="text-xs text-slate-500 mt-1 block">Bạn trả cho người đang thuê</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Cọc gốc đang gửi chủ</span>
                  <span className="text-2xl font-black text-slate-900 block">{depositAmount.toLocaleString()}đ</span>
                  <span className="text-xs text-slate-500 mt-1 block">Chủ trọ sẽ hoàn trả khi hết HĐ</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Giá thuê mỗi tháng</span>
                  <span className="text-2xl font-black text-slate-900 block">{monthlyRent.toLocaleString()}đ</span>
                  <span className="text-xs text-slate-500 mt-1 block">Đóng hàng tháng cho chủ trọ</span>
                </div>
              </div>

              {savings > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3.5 text-emerald-900">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      Tiết kiệm <strong className="font-black text-emerald-700">{savings.toLocaleString()} VNĐ</strong>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Công thức: <em>Tiền cọc gốc ({depositAmount.toLocaleString()}đ)</em> - <em>Giá pass ({passPrice.toLocaleString()}đ)</em> = Bạn được hưởng lợi trọn vẹn số tiền chênh lệch này khi hết hợp đồng!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin Hợp đồng & Nội quy */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#f4ebd9] shadow-sm space-y-6">
              <h3 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#f97316]" /> Hợp đồng & Thời hạn
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Thời hạn HĐ còn lại:</span>
                  <span className="font-bold text-slate-900">{room.remainingMonths || 3} tháng</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Ngày có thể chuyển vào:</span>
                  <span className="font-bold text-slate-900">
                    {room.moveInDate ? new Date(room.moveInDate).toLocaleDateString('vi-VN') : (room.moveOutDate || 'Linh hoạt')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Diện tích phòng:</span>
                  <span className="font-bold text-slate-900">{room.area_sqm || 20} m²</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Hình thức chuyển nhượng:</span>
                  <span className="font-bold text-slate-900">Ký lại phụ lục cọc với chủ</span>
                </div>
              </div>

              {/* Tiện ích */}
              {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tiện ích có sẵn:</h4>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((am, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-orange-50 text-[#f97316] text-xs font-bold border border-orange-200">
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả */}
              {room.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mô tả từ người pass:</h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-[#fdfbf7] p-4 rounded-2xl border border-slate-100">
                    {room.description}
                  </p>
                </div>
              )}
            </div>

            {/* CHECKLIST AN TOÀN KHI NHẬN PASS PHÒNG */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm space-y-4">
              <h3 className="font-heading font-black text-lg text-blue-950 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" /> Checklist an toàn khi nhận pass cọc
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Để đảm bảo an toàn tuyệt đối cho sinh viên Cần Thơ, hãy tuân thủ 4 nguyên tắc sau:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Kiểm tra huy hiệu <strong>"Chủ trọ đã xác nhận"</strong> trên SmartStay trước khi trao đổi.
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Ký biên bản giao nhận tiền cọc hoặc ký lại phụ lục hợp đồng 3 bên (Chủ trọ - Bạn - Người cũ).
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Đến tận nơi xem phòng, thử máy lạnh, vòi nước, cửa khóa trước khi giao tiền.
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                  <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Chốt chỉ số điện, nước tại thời điểm bàn giao chìa khóa để tránh gánh nợ cũ.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1/3): Hồ sơ người pass & Nút Hành Động */}
          <div className="space-y-6">
            {/* Box Đặt cọc / Yêu cầu nhận phòng */}
            <div className="bg-white rounded-3xl p-6 border border-[#f4ebd9] shadow-md sticky top-24 space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giá pass nhượng lại</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[#f97316]">{passPrice.toLocaleString()}đ</span>
                  <span className="text-xs text-slate-500 font-medium">(Cọc gốc: {depositAmount.toLocaleString()}đ)</span>
                </div>
              </div>

              {isOwner ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 bg-slate-100 p-3 rounded-2xl text-center">
                    Đây là tin đăng của bạn
                  </p>
                  <Link to="/pass-phong/cua-toi" className="block w-full">
                    <Button className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-sm">
                      Vào trang Quản lý tin
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => setReserveModalOpen(true)}
                    className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-12 text-sm shadow-md shadow-[#f97316]/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Yêu cầu nhận phòng
                  </Button>

                  {room.posterPhone && (
                    <a href={`tel:${room.posterPhone}`} className="block w-full">
                      <Button variant="outline" className="w-full rounded-full border-slate-200 text-slate-700 hover:border-[#f97316] hover:text-[#f97316] font-bold h-12 text-sm flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" /> Gọi {room.posterPhone}
                      </Button>
                    </a>
                  )}

                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="w-full text-center text-xs text-slate-400 hover:text-rose-500 font-bold flex items-center justify-center gap-1.5 pt-2 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" /> Báo cáo tin nghi vấn gian lận
                  </button>
                </div>
              )}

              {/* Thông tin người pass */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#f97316] flex items-center justify-center font-black text-base shrink-0">
                  {room.posterName ? room.posterName.charAt(0) : "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{room.posterName || "Sinh viên SmartStay"}</h4>
                  <p className="text-xs text-slate-500">Đã xác minh số điện thoại</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: LIGHTBOX XEM ẢNH TOÀN MÀN HÌNH */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img src={images[activeImageIdx]} alt="Full view" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
          <div className="mt-4 text-white/80 text-xs font-bold">
            Ảnh {activeImageIdx + 1} / {images.length}
          </div>
        </div>
      )}

      {/* MODAL 2: GỬI YÊU CẦU NHẬN PHÒNG */}
      {reserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-heading font-black text-lg text-slate-900">Yêu cầu nhận pass phòng</h3>
              <button onClick={() => setReserveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReserveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Số điện thoại liên hệ *</label>
                <Input
                  required
                  placeholder="0901234567"
                  value={reservePhone}
                  onChange={(e) => setReservePhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Lời nhắn cho người pass</label>
                <textarea
                  rows={3}
                  placeholder="Chào bạn, mình muốn xem phòng và nhận cọc lại trong tuần này..."
                  value={reserveMsg}
                  onChange={(e) => setReserveMsg(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#f97316]"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setReserveModalOpen(false)} className="rounded-full">
                  Hủy
                </Button>
                <Button type="submit" disabled={submittingReserve} className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-6">
                  {submittingReserve ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi yêu cầu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BÁO CÁO VI PHẠM */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-heading font-black text-lg text-rose-600 flex items-center gap-2">
                <Flag className="w-5 h-5" /> Báo cáo tin lừa đảo
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Lý do báo cáo *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none font-medium"
                >
                  <option value="Lừa đảo tiền cọc">Lừa đảo tiền cọc / Giả danh chủ trọ</option>
                  <option value="Phòng không có thật">Phòng không có thật / Địa chỉ ma</option>
                  <option value="Sai giá niêm yết">Báo sai giá pass so với thực tế</option>
                  <option value="Spam / Tin trùng">Spam hoặc tin lặp lại nhiều lần</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Cung cấp bằng chứng hoặc mô tả vụ việc..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setReportModalOpen(false)} className="rounded-full">
                  Hủy
                </Button>
                <Button type="submit" disabled={submittingReport} className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold px-6">
                  {submittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi báo cáo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
