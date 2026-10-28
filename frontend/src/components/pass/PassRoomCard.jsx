import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Clock,
  MapPin,
  Heart,
  Calendar,
  Sparkles,
  HelpCircle,
  Eye,
  MessageCircle,
  Settings,
  Lock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PassRoomCard({ room, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const id = room._id || room.id;
  const isOwner = user && (String(user._id || user.id) === String(room.owner?._id || room.owner) || user.email === room.ownerEmail);
  const isAdmin = user && user.role === 'admin';

  // State lưu tin yêu thích
  const [isSaved, setIsSaved] = useState(
    Array.isArray(room.savedBy) && user ? room.savedBy.includes(user._id || user.id) : false
  );
  const [savingHeart, setSavingHeart] = useState(false);

  const passPrice = Number(room.passPrice || room.price || 0);
  const depositAmount = Number(room.depositAmount || room.deposit || room.remaining_deposit || passPrice);
  const monthlyRent = Number(room.monthlyRent || room.price || passPrice);
  const savings = Math.max(0, depositAmount - passPrice);

  const images = Array.isArray(room.images) && room.images.length > 0 
    ? room.images 
    : [room.image || room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"];
  
  const displayImage = images[0];

  // Xử lý lưu / bỏ lưu tin
  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Vui lòng đăng nhập để lưu tin pass phòng này vào danh sách yêu thích.");
      navigate("/dang-nhap");
      return;
    }

    try {
      setSavingHeart(true);
      if (isSaved) {
        await base44.entities.PassRoom.unsave(id);
        setIsSaved(false);
        toast.success("Đã bỏ lưu tin pass phòng");
      } else {
        await base44.entities.PassRoom.save(id);
        setIsSaved(true);
        toast.success("Đã lưu tin pass phòng vào mục yêu thích");
      }
    } catch (err) {
      toast.error("Không thể cập nhật yêu thích");
    } finally {
      setSavingHeart(false);
    }
  };

  // Render Badge trạng thái
  const renderStatusBadge = () => {
    switch (room.status) {
      case "verified":
      case "landlord_confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Chủ trọ đã xác nhận
          </span>
        );
      case "pending_landlord":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[11px] font-bold rounded-full shadow-sm">
            <Clock className="w-3.5 h-3.5" /> Chờ chủ trọ duyệt
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-full shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Đã có người giữ chỗ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 text-white text-[11px] font-bold rounded-full shadow-sm">
            ✓ Đã chuyển nhượng xong
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-full shadow-sm">
            ✕ Chủ trọ từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500 text-white text-[11px] font-bold rounded-full shadow-sm">
            {room.status || "Chờ duyệt"}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#f4ebd9] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group overflow-hidden relative">
      {/* 1. Phần ảnh & Badges */}
      <div className="h-52 bg-slate-100 relative overflow-hidden">
        <Link to={`/pass-phong/${id}`} className="block w-full h-full">
          <img
            src={displayImage}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Trạng thái ở góc trên bên trái */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {renderStatusBadge()}
          {room.campus && (
            <span className="inline-flex items-center px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-full">
              {room.campus}
            </span>
          )}
        </div>

        {/* Nút tim lưu tin góc trên bên phải */}
        <button
          onClick={handleToggleSave}
          disabled={savingHeart}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-md ${
            isSaved
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
              : "bg-white/80 hover:bg-white text-slate-700 hover:text-rose-500"
          }`}
          title={isSaved ? "Bỏ lưu tin" : "Lưu tin vào danh sách yêu thích"}
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-white" : ""}`} />
        </button>

        {/* Số ảnh & Lượt xem góc dưới */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-medium pointer-events-none z-10">
          <span className="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {images.length} ảnh
          </span>
          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3" /> {room.viewCount || 0} xem
          </span>
        </div>
      </div>

      {/* 2. Nội dung thông tin */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Tiêu đề & Địa chỉ */}
        <Link to={`/pass-phong/${id}`}>
          <h3 className="font-heading font-black text-slate-900 text-base leading-snug line-clamp-2 hover:text-[#f97316] transition-colors mb-1.5">
            {room.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#f97316]" />
          <span>{room.address || room.campus}</span>
        </p>

        {/* Khối Tài chính so sánh (Giá Pass vs Tiền Cọc Đã Đóng) */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Cột 1: Giá Pass */}
            <div className="bg-[#fff9f2] border border-[#fdecdb] rounded-2xl p-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ea580c]">
                  Giá pass nhượng
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] bg-slate-900 text-white p-2.5 text-xs">
                    Số tiền bạn trả cho người đang thuê để nhận lại phòng và quyền thụ hưởng số cọc cũ.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-lg font-black text-[#f97316] mt-0.5">
                {passPrice.toLocaleString()}đ
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Thuê: {monthlyRent.toLocaleString()}đ/th</p>
            </div>

            {/* Cột 2: Cọc đã đóng */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Cọc chủ trọ giữ
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] bg-slate-900 text-white p-2.5 text-xs">
                    Tiền cọc gốc mà người thuê trước đã đóng cho chủ trọ ghi trong hợp đồng gốc.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-lg font-black text-slate-800 mt-0.5">
                {depositAmount.toLocaleString()}đ
              </p>
              <p className="text-[10px] text-slate-500 font-medium">HĐ gốc</p>
            </div>
          </div>
        </TooltipProvider>

        {/* Dòng Tiết Kiệm (Điểm nhấn ăn khách) */}
        {savings > 0 ? (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Bạn tiết kiệm được <strong className="font-black text-emerald-700">{savings.toLocaleString()}đ</strong> so với cọc mới!
            </span>
          </div>
        ) : (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span>Chuyển nhượng ngang giá cọc hợp đồng gốc</span>
          </div>
        )}

        {/* Chi tiết Hợp đồng còn lại & Ngày chuyển */}
        <div className="space-y-1.5 text-xs text-slate-600 font-medium mb-5">
          <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1.5">
            <span className="text-slate-500">Thời hạn HĐ còn lại:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {room.remainingMonths || room.pass_months_left || 3} tháng
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1.5">
            <span className="text-slate-500">Ngày có thể chuyển:</span>
            <span className="font-bold text-slate-900">
              {room.moveInDate ? new Date(room.moveInDate).toLocaleDateString('vi-VN') : (room.moveOutDate || 'Linh hoạt')}
            </span>
          </div>
          <div className="flex justify-between items-center pb-0.5">
            <span className="text-slate-500">Người đăng tin:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[150px]">
              {room.posterName || 'Sinh viên'}
            </span>
          </div>
        </div>

        {/* 3. Nút hành động theo vai trò */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          {isOwner ? (
            <Link to="/pass-phong/cua-toi" className="w-full">
              <Button className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 text-xs flex items-center justify-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Quản lý tin của tôi
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={`/pass-phong/${id}`} className="flex-1">
                <Button className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-10 text-xs shadow-sm shadow-[#f97316]/20 flex items-center justify-center gap-1">
                  Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              {room.posterPhone && (
                <a
                  href={`tel:${room.posterPhone}`}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-[#f97316] flex items-center justify-center text-slate-600 hover:text-[#f97316] hover:bg-orange-50 transition-colors"
                  title="Gọi trực tiếp cho người pass"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
