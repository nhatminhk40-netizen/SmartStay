import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit3,
  UserCheck,
  Plus,
  Loader2,
  Calendar,
  Phone,
  MessageCircle,
  AlertCircle,
  Lock,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import CreatePassModal from "@/components/pass/CreatePassModal";

export default function MyPassRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'verified' | 'reserved' | 'completed'
  const [copiedId, setCopiedId] = useState(null);
  const [generatingLinkId, setGeneratingLinkId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    loadMyListings();
  }, [user]);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.PassRoom.myListings();
      if (res && res.success && Array.isArray(res.data)) {
        setMyRooms(res.data);
      } else {
        // Fallback local
        const local = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
        setMyRooms(local);
      }
    } catch (err) {
      console.warn("Lỗi tải tin của tôi:", err);
      const local = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
      setMyRooms(local);
    } finally {
      setLoading(false);
    }
  };

  // Tạo hoặc gửi lại link xác nhận cho chủ trọ
  const handleRegenerateLink = async (roomId) => {
    setGeneratingLinkId(roomId);
    try {
      const res = await base44.entities.PassRoom.generateLandlordLink(roomId);
      if (res && res.success) {
        toast.success("Đã tạo link xác nhận mới (token cũ đã bị hủy)!");
        navigator.clipboard.writeText(res.confirmationLink);
        setCopiedId(roomId);
        setTimeout(() => setCopiedId(null), 3000);
        loadMyListings();
      } else {
        toast.error(res.message || "Không thể tạo lại link");
      }
    } catch {
      toast.error("Lỗi khi tạo lại link xác nhận");
    } finally {
      setGeneratingLinkId(null);
    }
  };

  // Sao chép link xác nhận nhanh
  const handleCopyLink = async (roomId) => {
    try {
      const res = await base44.entities.PassRoom.generateLandlordLink(roomId);
      if (res && res.confirmationLink) {
        navigator.clipboard.writeText(res.confirmationLink);
        setCopiedId(roomId);
        toast.success("Đã sao chép link xác nhận gửi chủ trọ!");
        setTimeout(() => setCopiedId(null), 3000);
      }
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  // Phản hồi yêu cầu giữ chỗ (accept / reject / complete)
  const handleRespondReservation = async (roomId, action) => {
    try {
      const res = await base44.entities.PassRoom.respondReservation(roomId, action);
      if (res && res.success) {
        toast.success(action === "accept" ? "Đã chấp nhận giữ chỗ" : (action === "complete" ? "Đã hoàn tất sang nhượng thành công!" : "Đã từ chối giữ chỗ"));
        loadMyListings();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch {
      toast.error("Lỗi cập nhật yêu cầu");
    }
  };

  // Xóa tin
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin pass phòng này?")) return;
    try {
      const res = await base44.entities.PassRoom.delete(roomId);
      if (res.success) {
        toast.success("Đã xóa tin thành công");
        loadMyListings();
      }
    } catch {
      toast.error("Lỗi khi xóa tin");
    }
  };

  // Lọc theo tab
  const filteredRooms = myRooms.filter((r) => {
    if (activeTab === "pending") return r.status === "pending_landlord";
    if (activeTab === "verified") return r.status === "verified";
    if (activeTab === "reserved") return r.status === "reserved";
    if (activeTab === "completed") return r.status === "completed";
    return true;
  });

  return (
    <div className="bg-[#fdfbf7] min-h-screen pb-20 font-sans">
      {/* 1. Header Quản lý tin */}
      <div className="bg-white border-b border-[#f4ebd9] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/pass-phong"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách pass phòng
            </Link>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              Quản lý tin Pass phòng của tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Theo dõi tiến trình duyệt từ chủ trọ, lấy link xác nhận bảo mật và phản hồi yêu cầu nhận phòng.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-11 px-6 text-xs shadow-md shadow-[#f97316]/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Đăng thêm tin pass
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 2. Tabs phân loại trạng thái */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {[
            { id: "all", label: "Tất cả tin", count: myRooms.length },
            { id: "pending", label: "Chờ chủ duyệt", count: myRooms.filter(r => r.status === "pending_landlord").length },
            { id: "verified", label: "Đã duyệt công khai", count: myRooms.filter(r => r.status === "verified").length },
            { id: "reserved", label: "Đang giữ chỗ", count: myRooms.filter(r => r.status === "reserved").length },
            { id: "completed", label: "Đã hoàn thành", count: myRooms.filter(r => r.status === "completed").length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Danh sách tin quản lý */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#f97316] mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">Đang tải danh sách tin của bạn...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#f4ebd9] shadow-sm max-w-md mx-auto my-8">
            <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 mb-1">Chưa có tin pass phòng nào</h3>
            <p className="text-xs text-slate-500 mb-5">Bạn chưa có bài đăng nào trong mục này.</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-6 h-10 text-xs"
            >
              Đăng tin pass phòng ngay
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRooms.map((room) => {
              const roomId = room._id || room.id;
              const isVerified = room.status === "verified";
              const isPending = room.status === "pending_landlord";
              const isReserved = room.status === "reserved";
              const isCompleted = room.status === "completed";

              return (
                <div
                  key={roomId}
                  className="bg-white rounded-3xl border border-[#f4ebd9] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
                    {/* Thông tin phòng */}
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={(room.images && room.images[0]) || room.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                        alt={room.title}
                        className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-100"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isVerified && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Chủ trọ đã xác nhận
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Chờ chủ trọ duyệt
                            </span>
                          )}
                          {isReserved && (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Đã có người giữ chỗ
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                              ✓ Đã pass xong
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">{room.campus}</span>
                        </div>

                        <Link to={`/pass-phong/${roomId}`}>
                          <h3 className="font-heading font-black text-slate-900 text-lg hover:text-[#f97316] transition-colors truncate">
                            {room.title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
                          <span>Giá pass: <strong className="text-[#f97316] font-black">{Number(room.passPrice || room.price || 0).toLocaleString()}đ</strong></span>
                          <span>Cọc gốc: <strong>{Number(room.depositAmount || room.deposit || 0).toLocaleString()}đ</strong></span>
                          <span>HĐ còn lại: <strong>{room.remainingMonths || 3} tháng</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Nút thao tác nhanh */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/pass-phong/${roomId}`}>
                        <Button variant="outline" className="rounded-full h-9 px-3.5 text-xs font-bold border-slate-200">
                          Xem chi tiết
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteRoom(roomId)}
                        className="rounded-full h-9 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa
                      </Button>
                    </div>
                  </div>

                  {/* 4. TIMELINE TRẠNG THÁI */}
                  <div className="py-5 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Tiến trình chuyển nhượng:
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-700">1. Đã đăng tin</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isVerified || isReserved || isCompleted ? "bg-emerald-500" : (isPending ? "bg-amber-400 animate-pulse" : "bg-slate-200")}`} />
                        <span className={`text-[11px] font-bold ${isVerified || isReserved || isCompleted ? "text-emerald-700" : (isPending ? "text-amber-600" : "text-slate-400")}`}>
                          2. Chủ trọ xác nhận
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isReserved || isCompleted ? "bg-indigo-500" : "bg-slate-200"}`} />
                        <span className={`text-[11px] font-bold ${isReserved || isCompleted ? "text-indigo-700" : "text-slate-400"}`}>
                          3. Giữ chỗ cọc
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isCompleted ? "bg-slate-800" : "bg-slate-200"}`} />
                        <span className={`text-[11px] font-bold ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                          4. Hoàn tất
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. KHỐI LINK DUYỆT BẢO MẬT CHO CHỦ TRỌ (CHỈ Ở ĐÂY MỚI CÓ) */}
                  <div className="pt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#fdfbf7] p-4 rounded-2xl border border-slate-200/80 mt-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#f97316]" /> Link xác nhận bảo mật gửi Chủ trọ ({room.landlordName || "Chủ trọ"} - {room.landlordPhone || ""}):
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Link mã hóa hạn dùng 72 giờ, dùng một lần. Bấm sao chép để gửi qua Zalo hoặc tin nhắn cho chủ trọ.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleCopyLink(roomId)}
                        className="rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold h-9 px-4 text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        {copiedId === roomId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        {copiedId === roomId ? "Đã sao chép link" : "Sao chép link"}
                      </Button>

                      <Button
                        variant="outline"
                        disabled={generatingLinkId === roomId}
                        onClick={() => handleRegenerateLink(roomId)}
                        className="rounded-full bg-white border-slate-300 text-slate-700 text-xs font-bold h-9 px-3 flex items-center gap-1.5"
                        title="Tạo link mới (vô hiệu hóa link cũ)"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generatingLinkId === roomId ? "animate-spin" : ""}`} />
                        Tạo link mới
                      </Button>
                    </div>
                  </div>

                  {/* 6. YÊU CẦU GIỮ CHỖ TỪ NGƯỜI NHẬN (NẾU CÓ) */}
                  {room.reservation && room.reservation.status !== "none" && (
                    <div className="mt-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-indigo-600" /> Có yêu cầu nhận phòng từ: {room.reservation.requesterName} ({room.reservation.requesterPhone})
                          </span>
                          <p className="text-xs text-indigo-700 italic">
                            "{room.reservation.message || "Tôi quan tâm đến phòng này"}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {room.reservation.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleRespondReservation(roomId, "accept")}
                                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-3 text-xs"
                              >
                                Đồng ý giữ chỗ
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRespondReservation(roomId, "reject")}
                                className="rounded-full border-slate-300 text-slate-600 hover:bg-white h-8 px-3 text-xs font-bold"
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          {room.reservation.status === "accepted" && (
                            <Button
                              onClick={() => handleRespondReservation(roomId, "complete")}
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 text-xs"
                            >
                              ✓ Đánh dấu đã pass xong
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Đăng Pass */}
      <CreatePassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadMyListings()}
      />
    </div>
  );
}
