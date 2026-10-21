import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Home as HomeIcon, Users, FileText, Receipt,
  MessageSquare, Star, Settings, Plus, Search, MapPin, CheckCircle,
  Clock, Edit2, Trash2, X, Eye, EyeOff, FileCheck, Info, Building2, ArrowLeft,
  Calendar, Phone, RefreshCw, AlertCircle, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ContractsManager from "@/components/contracts/ContractsManager";
import InvoiceManager from "@/components/contracts/InvoiceManager";
import { base44 } from "@/api/base44Client";

// ── MOCK DATA ──
const mockRooms = [
  { id: 1, title: "Phòng trọ ban công thoáng mát", address: "Hẻm 51, 3 Tháng 2, Ninh Kiều", campus: "ĐH Cần Thơ", price: 2500000, area: 25, status: "Đang thuê", views: 120, saves: 15, safe: true },
  { id: 2, title: "Mini house cao cấp An Bình", address: "KDC Hồng Phát, An Bình, Ninh Kiều", campus: "ĐH FPT", price: 3800000, area: 35, status: "Trống", views: 340, saves: 45, safe: true },
  { id: 3, title: "Trọ sinh viên giá rẻ", address: "Nguyễn Văn Linh, Hưng Lợi, Ninh Kiều", campus: "ĐH Y Dược", price: 1500000, area: 18, status: "Đang sửa", views: 50, saves: 2, safe: false },
];

const mockTenants = [
  { id: 1, name: "Nguyễn Văn A", phone: "0912345678", room: "Phòng 101", startDate: "01/08/2026", endDate: "01/08/2027", status: "Đã thu" },
  { id: 2, name: "Trần Thị B", phone: "0987654321", room: "Phòng 102", startDate: "15/09/2026", endDate: "15/09/2027", status: "Chưa thu" },
];

const mockTodos = [
  { id: 1, text: "Hóa đơn phòng 102 quá hạn 3 ngày", type: "warning" },
  { id: 2, text: "Hợp đồng phòng 101 sắp hết hạn (30 ngày)", type: "info" },
  { id: 3, text: "Có 2 yêu cầu xem phòng mới", type: "action" },
];

// ── SUBCOMPONENTS ──

const StatCard = ({ icon: Icon, title, value, sub, colorClass }) => (
  <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="font-heading font-black text-2xl text-slate-900 mt-1">{value}</div>
      <div className="text-xs font-medium text-slate-400 mt-1">{sub}</div>
    </div>
  </div>
);

const AddRoomModal = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Thêm phòng mới <span className="text-[#f97316]">Bước {step}/6</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">1. Thông tin cơ bản</h4>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên phòng / Tiêu đề</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316]" placeholder="Ví dụ: Phòng trọ ban công..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Giá (VNĐ/tháng)</label>
                  <input type="number" className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316]" placeholder="2500000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Diện tích (m²)</label>
                  <input type="number" className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316]" placeholder="20" />
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">2. Tiện nghi & Tùy chọn</h4>
              <div className="grid grid-cols-2 gap-3">
                {["Máy lạnh", "Gác lửng", "Tủ lạnh", "Máy giặt", "Nước nóng"].map(a => (
                  <label key={a} className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#f97316]" style={{ accentColor: "#f97316" }} />
                    <span className="text-sm font-semibold text-slate-700">{a}</span>
                  </label>
                ))}
              </div>
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Phòng cách âm</span>
                  <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: "#f97316" }} />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">3. Chi phí sinh hoạt (Không phụ phí ẩn)</h4>
              <div className="grid grid-cols-2 gap-4">
                {["Tiền điện (đ/kWh)", "Tiền nước (đ/m3)", "Internet (đ/tháng)", "Rác (đ/tháng)"].map(c => (
                  <div key={c}>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{c}</label>
                    <input type="number" className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">4. Hình ảnh phòng</h4>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-white text-center">
                <div className="w-12 h-12 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-[#f97316]" />
                </div>
                <div className="font-bold text-slate-700">Kéo thả ảnh hoặc click để tải lên</div>
                <div className="text-sm text-slate-500 mt-1">Tối đa 10 ảnh (.jpg, .png)</div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">5. Xác minh Safe Badge</h4>
              <p className="text-sm text-slate-600">Tải lên giấy tờ chứng minh sở hữu (Sổ hồng, hóa đơn điện nước) để nhận huy hiệu Safe Badge, giúp tăng 300% lượt thuê.</p>
              <input type="file" className="w-full p-3 bg-white rounded-xl border border-slate-200" />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-bold text-xl text-slate-900">Hoàn tất thiết lập!</h4>
              <p className="text-sm text-slate-500">Phòng của bạn đã sẵn sàng để đăng lên hệ thống.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="rounded-full font-bold text-slate-600">
            {step === 1 ? "Hủy" : "Quay lại"}
          </Button>
          <Button onClick={() => step < 6 ? setStep(step + 1) : onClose()} className="rounded-full font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-8">
            {step === 6 ? "Đăng tin ngay" : "Tiếp tục"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN PAGE COMPONENT ──
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddRoomOpen, setAddRoomOpen] = useState(false);
  const [passRequests, setPassRequests] = useState([]);

  // Dữ liệu thực tế của Chủ trọ
  const [realRooms, setRealRooms] = useState([]);
  const [loadingLandlord, setLoadingLandlord] = useState(false);
  const [roomFilter, setRoomFilter] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, rented: 0, repairing: 0 });

  const loadLandlordData = async () => {
    setLoadingLandlord(true);
    try {
      const [roomsRes, apptsData, statsRes] = await Promise.all([
        base44.entities.Room.myRooms(),
        base44.entities.Appointment.landlordList(),
        base44.entities.Room.landlordStats()
      ]);

      if (roomsRes?.data && roomsRes.data.length > 0) {
        setRealRooms(roomsRes.data);
      } else {
        setRealRooms(mockRooms);
      }
      setAppointments(apptsData || []);
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu chủ trọ:", e);
      setRealRooms(mockRooms);
    } finally {
      setLoadingLandlord(false);
    }
  };

  useEffect(() => {
    loadLandlordData();
    const data = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
    setPassRequests(data.filter(r => r.status === "pending_landlord"));
  }, []);

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      const res = await base44.entities.Room.updateAvailability(roomId, newStatus);
      if (res.success) {
        setRealRooms(prev => prev.map(r => (r._id === roomId || r.id === roomId) ? { ...r, status: newStatus } : r));
        loadLandlordData();
      }
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  const handleUpdateAppointment = async (code, status, landlordResponseNote) => {
    try {
      const res = await base44.entities.Appointment.updateStatus(code, status, landlordResponseNote);
      if (res.success) {
        setAppointments(prev => prev.map(a => a.appointmentCode === code ? { ...a, status, landlordResponseNote } : a));
      }
    } catch (err) {
      alert("Lỗi cập nhật lịch hẹn: " + err.message);
    }
  };

  const sidebarTabs = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "rooms", label: "Phòng của tôi", icon: HomeIcon },
    { id: "tenants", label: "Khách thuê", icon: Users },
    { id: "contracts", label: "Hợp đồng & Cọc", icon: FileCheck },
    { id: "invoices", label: "Hóa đơn & Thu tiền", icon: Receipt },
    { id: "requests", label: "Yêu cầu / Liên hệ", icon: MessageSquare },
    { id: "reviews", label: "Đánh giá", icon: Star },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col md:flex-row pt-4 md:pt-8 pb-12 px-4 md:px-8 gap-6 max-w-[1400px] mx-auto">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-[#f4ebd9]">
          <div className="px-4 py-3 mb-2 flex justify-between items-start">
            <div>
              <h2 className="font-heading font-black text-lg text-slate-900">Quản lý <span className="text-[#f97316]">Trọ</span></h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                {user?.role === "landlord" ? "Chủ nhà trọ" : "Dành cho Nhân viên"}
              </p>
              {user?.fullName && (
                <p className="text-xs font-bold text-orange-600 truncate max-w-[130px] mt-0.5">
                  {user.fullName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                logout?.();
                window.location.href = "/login";
              }}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 underline"
            >
              Đăng xuất
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarTabs.map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                    active 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "text-slate-600 hover:bg-[#faf3e3] hover:text-[#f97316]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "requests" && passRequests.length > 0 && <span className="ml-auto w-5 h-5 rounded-full bg-[#f97316] text-white text-[10px] flex items-center justify-center">{passRequests.length}</span>}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem trang Sinh viên</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        
        {/* HEADER AREA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {sidebarTabs.find(t => t.id === activeTab)?.label}
          </h1>
          {activeTab === "rooms" && (
            <Button onClick={() => setAddRoomOpen(true)} className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-6 py-5 shadow-lg shadow-[#f97316]/20">
              <Plus className="w-5 h-5 mr-2" /> Thêm phòng mới
            </Button>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Building2} title="Tổng số phòng" value={stats.total || realRooms.length} sub="Đang quản lý" colorClass="bg-blue-100 text-blue-600" />
                <StatCard icon={CheckCircle} title="Phòng trống" value={stats.available || realRooms.filter(r => r.status === "available" || r.status === "Trống").length} sub="Sẵn sàng đón khách" colorClass="bg-emerald-100 text-emerald-600" />
                <StatCard icon={Users} title="Đang thuê" value={stats.rented || realRooms.filter(r => r.status === "rented" || r.status === "Đang thuê").length} sub="Hợp đồng đang ở" colorClass="bg-amber-100 text-amber-600" />
                <StatCard icon={Receipt} title="Lịch hẹn mới" value={appointments.filter(a => a.status === "pending").length} sub="Sinh viên chờ duyệt" colorClass="bg-[#f97316]/10 text-[#f97316]" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To do list */}
                <div className="lg:col-span-1 bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
                  <h3 className="font-bold text-slate-900 mb-4">Việc cần làm</h3>
                  <div className="space-y-3">
                    {mockTodos.map(todo => (
                      <div key={todo.id} className="flex gap-3 p-3 rounded-xl bg-[#fdfbf7] border border-slate-100">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", todo.type === "warning" ? "bg-rose-500" : todo.type === "info" ? "bg-blue-500" : "bg-[#f97316]")} />
                        <div className="text-sm font-semibold text-slate-700">{todo.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dummy Charts */}
                <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Biểu đồ doanh thu (6 tháng)</h3>
                    <select className="text-sm font-bold bg-slate-50 border-none rounded-lg p-2 focus:ring-0 text-slate-600">
                      <option>2026</option>
                    </select>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[40, 60, 45, 80, 65, 95].map((h, i) => (
                      <div key={i} className="w-full bg-[#faf3e3] rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-[#f97316] rounded-t-xl transition-all" style={{ height: `${h}%` }} />
                        <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-slate-400">Th {i+5}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "available", label: "Phòng trống" },
                  { id: "rented", label: "Đang thuê" },
                  { id: "repairing", label: "Đang sửa" }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRoomFilter(f.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                      roomFilter === f.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-[#f4ebd9] hover:border-[#f97316]"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <div className="flex items-center gap-2 ml-auto bg-white border border-[#f4ebd9] rounded-full px-4 py-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, địa chỉ phòng..."
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-sm font-medium w-48"
                  />
                </div>
              </div>

              {/* Room Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {realRooms
                  .filter(r => {
                    const statusVal = r.status === "Trống" ? "available" : (r.status === "Đang thuê" ? "rented" : (r.status === "Đang sửa" ? "repairing" : (r.status || "available")));
                    const matchF = roomFilter === "all" || statusVal === roomFilter;
                    const matchS = !roomSearch || r.title?.toLowerCase().includes(roomSearch.toLowerCase()) || r.address?.toLowerCase().includes(roomSearch.toLowerCase());
                    return matchF && matchS;
                  })
                  .map(room => {
                    const roomId = room._id || room.id;
                    const isAvail = room.status === "available" || room.status === "Trống";
                    const isRent = room.status === "rented" || room.status === "Đang thuê";
                    const isRepair = room.status === "repairing" || room.status === "Đang sửa";

                    return (
                      <div key={roomId} className="bg-white p-5 rounded-[24px] shadow-sm border border-[#f4ebd9] flex flex-col sm:flex-row gap-5 transition-all hover:shadow-md hover:border-[#f97316]/30">
                        <div className="w-full sm:w-40 h-32 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative">
                          <img src={room.images?.[0] || room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"} className="w-full h-full object-cover" alt="room" />
                          {(room.safe || room.isSafeListing) && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg uppercase">
                              Safe Badge
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 line-clamp-1">{room.title}</h4>
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0",
                                isAvail ? "bg-emerald-100 text-emerald-700" :
                                isRent ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                              )}>
                                {isAvail ? "Còn phòng" : (isRent ? "Đang cho thuê" : "Đang sửa")}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {room.campus || room.address} · {room.area || 20}m²
                            </p>
                            <div className="font-black text-[#f97316] text-lg mt-2">
                              {Number(room.price).toLocaleString("vi-VN")}đ<span className="text-xs text-slate-400 font-medium">/tháng</span>
                            </div>
                          </div>

                          {/* Quick availability toggle */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500">Tình trạng:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomStatus(roomId, "available")}
                              className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition", isAvail ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                            >
                              Còn phòng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomStatus(roomId, "rented")}
                              className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition", isRent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                            >
                              Đã thuê
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomStatus(roomId, "repairing")}
                              className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition", isRepair ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                            >
                              Sửa chữa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === "tenants" && (
            <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Danh sách khách thuê</h3>
                <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Tìm khách..." className="bg-transparent border-none focus:outline-none text-sm font-medium w-40" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#fdfbf7] text-slate-500 font-bold text-xs uppercase">
                    <tr>
                      <th className="p-4 pl-6">Họ tên / SĐT</th>
                      <th className="p-4">Phòng</th>
                      <th className="p-4">Ngày vào</th>
                      <th className="p-4">Tiền phòng tháng này</th>
                      <th className="p-4 text-right pr-6">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockTenants.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.phone}</div>
                        </td>
                        <td className="p-4 font-bold text-[#f97316]">{t.room}</td>
                        <td className="p-4 text-slate-600 font-medium">{t.startDate}</td>
                        <td className="p-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", t.status === "Đã thu" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 space-x-2">
                          <Button variant="ghost" size="sm" className="font-bold text-slate-600">Chi tiết</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* PHẦN 1: LỊCH HẸN XEM PHÒNG CỦA SINH VIÊN */}
              <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-[#f97316]" />
                  Lịch Hẹn Xem Phòng Của Sinh Viên ({appointments.length})
                </h3>

                {appointments.length === 0 ? (
                  <div className="text-center py-8 bg-[#fdfbf7] rounded-2xl border border-slate-100">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Chưa có lịch hẹn xem phòng mới</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map(appt => (
                      <div key={appt._id || appt.appointmentCode} className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">Mã: #{appt.appointmentCode}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                              appt.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                              appt.status === "rejected" ? "bg-rose-100 text-rose-800" :
                              appt.status === "completed" ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            )}>
                              {appt.status === "confirmed" ? "Đã duyệt" :
                               appt.status === "rejected" ? "Đã từ chối" :
                               appt.status === "completed" ? "Đã dẫn xem" : "Chờ bạn duyệt"}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{appt.roomId?.title || "Phòng trọ"}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                            <span>Khách: <b className="text-slate-800">{appt.studentName}</b></span>
                            <span>SĐT: <b className="text-emerald-700">{appt.studentPhone}</b></span>
                            <span>Hẹn lúc: <b className="text-[#f97316]">{appt.appointmentDate} - {appt.appointmentTime}</b></span>
                          </div>
                          {appt.note && <p className="text-[11px] text-slate-500 italic mt-1">Ghi chú: "{appt.note}"</p>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          {appt.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateAppointment(appt.appointmentCode, "confirmed", "Chủ trọ đã đồng ý hẹn!")}
                                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4"
                              >
                                Duyệt hẹn
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAppointment(appt.appointmentCode, "rejected", "Chủ trọ bận khung giờ này")}
                                className="rounded-full text-rose-600 hover:bg-rose-50 font-bold text-xs h-8 px-3"
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          {appt.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateAppointment(appt.appointmentCode, "completed", "Đã dẫn xem phòng thành công")}
                              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4"
                            >
                              Đánh dấu đã dẫn xem
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHẦN 2: YÊU CẦU PASS PHÒNG */}
              <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] overflow-hidden p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-[#f97316]" />
                  Yêu cầu Pass Phòng chờ xác nhận ({passRequests.length})
                </h3>
                
                {passRequests.length === 0 ? (
                  <div className="text-center py-8 bg-[#fdfbf7] rounded-2xl border border-slate-100">
                    <CheckCircle className="w-8 h-8 text-[#f97316] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Không có yêu cầu pass phòng mới</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passRequests.map(req => (
                      <div key={req.id} className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                        <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                          <img src={req.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"} alt={req.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Chờ duyệt</span>
                            <span className="text-xs font-semibold text-slate-500">Mã: {req.id}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg">{req.title}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                            <p className="text-slate-600"><span className="font-medium text-slate-400">Người đăng:</span> <span className="font-bold">{req.posterName}</span></p>
                            <p className="text-slate-600"><span className="font-medium text-slate-400">SĐT bạn:</span> <span className="font-bold">{req.landlordPhone}</span></p>
                            <p className="text-slate-600"><span className="font-medium text-slate-400">Giá:</span> <span className="font-bold text-[#f97316]">{Number(req.price).toLocaleString()}đ</span></p>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                          <a href={`/xac-nhan-pass/${req.id}`} target="_blank" className="flex-1 md:w-full inline-flex items-center justify-center h-10 px-4 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-bold shadow-sm">
                            Mở trang duyệt
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Quản lý Hợp đồng & Cọc phòng */}
          {activeTab === "contracts" && <ContractsManager />}

          {/* Tab Hóa đơn & Thu tiền minh bạch */}
          {activeTab === "invoices" && <InvoiceManager />}

          {/* Placeholders for other tabs */}
          {["reviews", "settings"].includes(activeTab) && (
            <div className="bg-white rounded-[24px] p-12 shadow-sm border border-[#f4ebd9] text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-[#faf3e3] rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-[#f97316]" />
              </div>
              <h3 className="font-heading font-black text-xl text-slate-900 mb-2">Tính năng đang được phát triển</h3>
              <p className="text-sm font-medium text-slate-500 max-w-md">
                Khu vực "{sidebarTabs.find(t => t.id === activeTab)?.label}" đang trong quá trình hoàn thiện. Bạn hãy quay lại sau nhé!
              </p>
            </div>
          )}

        </div>
      </main>

      <AddRoomModal open={isAddRoomOpen} onClose={() => setAddRoomOpen(false)} />
    </div>
  );
}
