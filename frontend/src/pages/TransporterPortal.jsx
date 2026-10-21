import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck, CheckCircle, Clock, MapPin, Phone, DollarSign, Star,
  ShieldCheck, RefreshCw, AlertCircle, LogOut, Navigation,
  Calendar, Package, User, Check, Power, ChevronRight, Award
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TransporterPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("available"); // available | my-trips | stats | profile
  const [availableRequests, setAvailableRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [availRes, myRes] = await Promise.all([
        base44.logistics.getAvailableRequests(),
        base44.logistics.getMyRequests()
      ]);
      setAvailableRequests(availRes || []);
      setMyRequests(myRes || []);
    } catch (err) {
      console.error("Lỗi tải chuyến xe:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Tự động làm mới danh sách cuốc xe mỗi 30s khi tài xế đang online
    const timer = setInterval(() => {
      if (isOnline) {
        base44.logistics.getAvailableRequests().then(data => setAvailableRequests(data || []));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [isOnline]);

  // Nhận cuốc xe
  const handleAcceptTrip = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await base44.logistics.acceptRequest(id);
      if (res.success) {
        alert("Nhận chuyến thành công! Vui lòng liên hệ sinh viên để sắp xếp thời gian.");
        loadData();
        setActiveTab("my-trips");
      } else {
        alert(res.message || "Không thể nhận chuyến.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cập nhật trạng thái chuyến (in-progress -> completed)
  const handleUpdateStatus = async (id, status) => {
    setActionLoadingId(id);
    try {
      const res = await base44.logistics.updateStatus(id, status);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Không thể cập nhật.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Thống kê nhanh
  const completedTrips = myRequests.filter(r => r.status === "completed");
  const totalEarnings = completedTrips.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  const activeTrips = myRequests.filter(r => r.status === "accepted" || r.status === "in-progress");

  return (
    <div className="min-h-screen bg-[#f0f9f8] text-slate-800 flex flex-col font-sans">
      {/* ── HEADER RIÊNG BIỆT DÀNH CHO TÀI XẾ ── */}
      <header className="bg-slate-900 text-white border-b border-teal-900/40 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-teal-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg tracking-tight text-white">SmartStay</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Cổng Tài Xế
                </span>
              </div>
              <p className="text-[11px] text-teal-200/70 font-medium">Đối tác vận tải Cần Thơ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút bật/tắt nhận chuyến */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm",
                isOnline
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
              <span>{isOnline ? "Đang nhận cuốc" : "Tạm nghỉ"}</span>
            </button>

            {/* Thông tin tài xế & Đăng xuất */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <span className="font-bold text-white truncate max-w-[140px]">{user?.fullName || "Tài xế"}</span>
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {user?.transporterProfile?.rating || "5.0"}
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── THANH ĐIỀU HƯỚNG TÁCH BIỆT ── */}
      <div className="bg-white border-b border-teal-100 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto">
          <nav className="flex gap-2 py-2">
            {[
              { id: "available", label: "Sàn nhận chuyến", count: availableRequests.length, icon: Navigation },
              { id: "my-trips", label: "Chuyến của tôi", count: activeTrips.length, icon: Truck },
              { id: "stats", label: "Doanh thu & Đánh giá", icon: DollarSign },
              { id: "profile", label: "Hồ sơ xe & Bằng lái", icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
                    active
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                      : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                      active ? "bg-white text-teal-900" : "bg-teal-100 text-teal-800"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-teal-700 font-bold text-xs shrink-0"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loading && "animate-spin")} /> Làm mới
          </Button>
        </div>
      </div>

      {/* ── NỘI DUNG CHÍNH ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Banner trạng thái Offline nếu tài xế tắt nhận cuốc */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bạn đang ở chế độ <b>Tạm nghỉ</b>. Sinh viên sẽ không thấy xe của bạn để gửi yêu cầu.</span>
            </div>
            <button
              onClick={() => setIsOnline(true)}
              className="px-3 py-1 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shrink-0"
            >
              Bật nhận cuốc ngay
            </button>
          </div>
        )}

        {/* TAB 1: SÀN NHẬN CHUYẾN (DANH SÁCH CUỐC XE KHẢ DỤNG) */}
        {activeTab === "available" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-teal-600" />
                  Cuốc xe đang chờ quanh Cần Thơ ({availableRequests.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Giá trọn gói niêm yết theo km, cam kết không ép giá sinh viên.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold bg-white rounded-3xl border border-teal-100">
                Đang quét các yêu cầu chuyển trọ mới...
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-teal-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Hiện chưa có cuốc xe mới</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Khi sinh viên đặt xe dọn phòng ở Cần Thơ, yêu cầu sẽ tự động xuất hiện tại đây theo thời gian thực.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {availableRequests.map(req => (
                  <div
                    key={req._id || req.requestCode}
                    className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">#{req.requestCode}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                              {req.vehicleType || "Xe ba gác"}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Hẹn lúc: <span className="text-slate-800 font-bold">{req.scheduledDate || "Hôm nay"} - {req.scheduledTime || "Sớm nhất"}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Cước trọn gói</span>
                          <div className="font-heading font-black text-xl text-teal-700">
                            {Number(req.price).toLocaleString("vi-VN")}đ
                          </div>
                        </div>
                      </div>

                      {/* Tuyến đường lộ trình */}
                      <div className="py-4 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-100" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm đón:</span>
                            <p className="font-bold text-slate-800">{req.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-600 mt-1 shrink-0 ring-4 ring-teal-100" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm đến:</span>
                            <p className="font-bold text-slate-800">{req.dropoffAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết phụ & Ghi chú */}
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Khoảng cách ước tính:</span>
                          <b>{req.estimatedDistanceKm || 5} km</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Hỗ trợ khuân vác:</span>
                          <b className={req.hasPorter ? "text-emerald-700 font-bold" : "text-slate-400"}>
                            {req.hasPorter ? "Có (Đã tính thêm phụ phí)" : "Không cần"}
                          </b>
                        </div>
                        {req.itemsDescription && (
                          <div className="pt-1 text-[11px] text-slate-500 italic">
                            Đồ đạc: "{req.itemsDescription}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động Nhận chuyến */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        Khách: <b>{req.studentName}</b>
                      </div>
                      <Button
                        disabled={actionLoadingId === req._id || !isOnline}
                        onClick={() => handleAcceptTrip(req._id)}
                        className="rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 px-6 shadow-md shadow-teal-600/20"
                      >
                        {actionLoadingId === req._id ? "Đang xử lý..." : "Nhận chuyến xe này"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHUYẾN XE CỦA TÔI (ĐANG CHẠY & LỊCH SỬ) */}
        {activeTab === "my-trips" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                Các chuyến xe bạn đã nhận ({myRequests.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cập nhật trạng thái từng bước để sinh viên an tâm theo dõi lộ trình.
              </p>
            </div>

            {myRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-teal-100 shadow-sm">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700">Bạn chưa nhận chuyến nào</h4>
                <p className="text-xs text-slate-500 mt-1">Chuyển sang tab "Sàn nhận chuyến" để nhận cuốc xe sinh viên.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => {
                  const isAccepted = req.status === "accepted";
                  const isInProgress = req.status === "in-progress";
                  const isCompleted = req.status === "completed";

                  return (
                    <div
                      key={req._id || req.requestCode}
                      className={cn(
                        "bg-white rounded-3xl p-6 border shadow-sm transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between",
                        isInProgress ? "border-amber-300 bg-amber-50/20" : "border-teal-100"
                      )}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">#{req.requestCode}</span>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                            isAccepted ? "bg-blue-100 text-blue-800" :
                            isInProgress ? "bg-amber-100 text-amber-800 animate-pulse" :
                            "bg-emerald-100 text-emerald-800"
                          )}>
                            {isAccepted ? "Đã nhận cuốc" :
                             isInProgress ? "Đang vận chuyển" : "Đã hoàn tất"}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-700">
                          <div>Điểm đón: <b className="text-slate-900">{req.pickupAddress}</b></div>
                          <div>Điểm đến: <b className="text-slate-900">{req.dropoffAddress}</b></div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span>Khách: <b className="text-slate-800">{req.studentName}</b></span>
                          <a href={`tel:${req.studentPhone}`} className="text-teal-700 font-bold flex items-center gap-1 hover:underline">
                            <Phone className="w-3.5 h-3.5" /> {req.studentPhone}
                          </a>
                        </div>
                      </div>

                      {/* Tiền cước & Nút hành động theo trạng thái */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                        <div className="font-heading font-black text-2xl text-teal-700">
                          {Number(req.price).toLocaleString("vi-VN")}đ
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {isAccepted && (
                            <Button
                              disabled={actionLoadingId === req._id}
                              onClick={() => handleUpdateStatus(req._id, "in-progress")}
                              className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-5 shadow-sm"
                            >
                              Đã đến điểm đón / Bốc hàng
                            </Button>
                          )}

                          {isInProgress && (
                            <Button
                              disabled={actionLoadingId === req._id}
                              onClick={() => handleUpdateStatus(req._id, "completed")}
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã giao đến nơi an toàn
                            </Button>
                          )}

                          {isCompleted && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full">
                              <Check className="w-3.5 h-3.5" /> Hoàn thành
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOANH THU & THỐNG KÊ */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              Doanh thu & Đánh giá uy tín
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Tổng thu nhập</span>
                <div className="font-heading font-black text-3xl text-teal-700 mt-2">
                  {totalEarnings.toLocaleString("vi-VN")}đ
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Từ các chuyến đã hoàn tất</p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Chuyến hoàn thành</span>
                <div className="font-heading font-black text-3xl text-slate-900 mt-2">
                  {completedTrips.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Hỗ trợ dọn trọ thành công</p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Đánh giá trung bình</span>
                <div className="font-heading font-black text-3xl text-amber-500 mt-2 flex items-center gap-1">
                  <Star className="w-6 h-6 fill-amber-400" /> {user?.transporterProfile?.rating || "5.0"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Huy hiệu Tài xế tin cậy SmartStay</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HỒ SƠ TÀI XẾ & PHƯƠNG TIỆN */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl p-8 border border-teal-100 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-2xl shadow-sm">
                {(user?.fullName || "T").slice(0, 1)}
              </div>
              <div>
                <h3 className="font-heading font-black text-xl text-slate-900">{user?.fullName || "Chú Bảy Ba Gác"}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-200">
                    Đối tác Vận tải Đã xác minh
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-slate-500 font-medium">Số điện thoại liên hệ:</span>
                <b className="text-slate-800">{user?.phone || "0939556677"}</b>
              </div>
              <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-slate-500 font-medium">Loại phương tiện:</span>
                <b className="text-teal-800">{user?.transporterProfile?.vehicleType || "Xe ba gác chuyển trọ"}</b>
              </div>
              <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-slate-500 font-medium">Biển số đăng ký:</span>
                <b className="text-slate-800">{user?.transporterProfile?.licensePlate || "65B1-888.99"}</b>
              </div>
              <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-slate-500 font-medium">Khu vực nhận cuốc:</span>
                <b className="text-slate-800">{user?.transporterProfile?.operatingArea || "Ninh Kiều / Cái Răng / Bình Thủy, Cần Thơ"}</b>
              </div>
              <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl text-slate-600 space-y-1">
                <div className="font-bold text-teal-900">Cam kết minh bạch của Tài xế:</div>
                <div>• Luôn tính đúng giá theo số km hiển thị trên ứng dụng.</div>
                <div>• Tuyệt đối không tự ý phát sinh phụ phí hẻm sâu hay cầu thang nếu chưa thỏa thuận.</div>
                <div>• Hỗ trợ sinh viên khuân vác cẩn thận, bảo quản đồ đạc an toàn.</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
