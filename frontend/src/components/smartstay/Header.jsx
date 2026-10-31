import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  Plus,
  ShieldCheck,
  Users,
  KeyRound,
  User,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  School,
  Mail,
  X,
  Building2,
  Receipt,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import StudentPortalModal from "@/components/StudentPortalModal";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Khám phá", path: "/" },
  { label: "Ghép bạn", path: "/ghep-ban" },
    { label: "Pass phòng", path: "/pass-phong" },
];

// Định dạng thời gian thông báo tự nhiên
const formatNotifTime = (dateStr) => {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return "Gần đây";
  }
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Dropdown states
  const [openPostMenu, setOpenPostMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openStudentPortal, setOpenStudentPortal] = useState(false);

  // Notifications (Khởi tạo rỗng, chỉ hiển thị khi có dữ liệu thật từ hệ thống)
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Click outside ref handling
  const postMenuRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target)) {
        setOpenPostMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động đồng bộ thông báo thực tế từ server khi người dùng đăng nhập
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        if (!token) {
          setNotifications([]);
          return;
        }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const apiNotifs = json.data.map(n => {
            const isConfirmed = n.type && n.type.includes('confirmed');
            const isRejected = n.type && n.type.includes('rejected');
            const isPass = n.type && n.type.includes('pass');
            const isContract = n.type && (n.type.includes('contract') || n.type.includes('bill'));
            return {
              id: n._id || n.id,
              title: n.title,
              desc: n.message,
              time: formatNotifTime(n.createdAt),
              read: Boolean(n.read),
              path: n.link || '/pass-phong/cua-toi',
              icon: isConfirmed ? ShieldCheck : (isPass ? KeyRound : (isContract ? FileText : Bell)),
              color: isConfirmed ? 'text-emerald-500 bg-emerald-50' : (isRejected ? 'text-rose-500 bg-rose-50' : 'text-orange-500 bg-orange-50')
            };
          });
          setNotifications(apiNotifs);
        } else {
          setNotifications([]);
        }
      } catch (e) {
        setNotifications([]);
      }
    };
    fetchNotifs();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
      if (token && notifications.length > 0) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        notifications.filter(n => !n.read).forEach(n => {
          fetch(`${apiUrl}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => {});
        });
      }
    } catch {}
  };

  const handleNotificationClick = async (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setOpenNotifications(false);
    if (!item.read) {
      try {
        const token = localStorage.getItem('smartstay_token') || localStorage.getItem('token');
        if (token) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          fetch(`${apiUrl}/notifications/${item.id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => {});
        }
      } catch {}
    }
    if (item.path) navigate(item.path);
  };

  const getUserInitial = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "M";
  };

  return (
    <>
      {/* ── BANNER PHÂN BIỆT VAI TRÒ (ĐẢM BẢO KHÔNG DÙNG CHUNG GIAO DIỆN) ── */}
      
      {user?.role === "landlord" && (
        <div className="bg-orange-900 text-orange-100 text-xs py-2 px-4 border-b border-orange-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-300 shrink-0" />
              <span>
                Bác Chủ trọ <strong className="text-white font-bold">{user.fullName || "Chủ trọ"}</strong> đang ở giao diện tìm phòng của Người thuê.
              </span>
            </div>
            <Link
              to="/chu-tro"
              className="px-3.5 py-1 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-black text-[11px] whitespace-nowrap transition shadow-sm flex items-center gap-1"
            >
              <span>Vào Kênh Quản Lý Trọ (/chu-tro)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="bg-slate-950 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Bạn đang duyệt với quyền Quản trị viên <strong className="text-white font-bold">{user.fullName || "Admin"}</strong>.
              </span>
            </div>
            <Link
              to="/admin"
              className="px-3.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] whitespace-nowrap transition shadow-sm flex items-center gap-1"
            >
              <span>Vào Bảng Admin (/admin)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <header className={cn("sticky z-40 bg-background/85 backdrop-blur-md border-b border-border/60", (user?.role === "transporter" || user?.role === "landlord" || user?.role === "admin") ? "top-9" : "top-0")}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/smartstay-icon.png"
              alt="SmartStay Logo"
              className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="leading-tight">
              <div className="font-heading font-extrabold text-foreground text-lg tracking-tight group-hover:text-orange-600 transition-colors">
                SmartStay
              </div>
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase font-semibold">
                Cần Thơ · Hỗ trợ tìm phòng & Quản lí phòng trọ
              </div>
            </div>
          </Link>

          {/* MAIN NAV PILLS */}
          <nav className="hidden md:flex items-center gap-1 bg-white border-2 border-slate-200/80 shadow-sm rounded-full p-1">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5",
                    active
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-1.5 py-0.2 rounded-full tracking-tight whitespace-nowrap",
                        active ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-800 border border-amber-200"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 1. NÚT ĐĂNG TIN VÀ DROPDOWN CHỨC NĂNG */}
            <div className="relative" ref={postMenuRef}>
              <Button
                variant="outline"
                onClick={() => setOpenPostMenu((prev) => !prev)}
                className="rounded-full border-orange-500/50 text-orange-600 hover:bg-orange-50 hover:text-orange-600 font-bold hidden sm:inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Đăng tin</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openPostMenu && "rotate-180")} />
              </Button>

              {openPostMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chọn loại bài đăng</p>
                  </div>

                  <div className="space-y-1 py-1">
                    {/* Đăng phòng trọ */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPostMenu(false);
                        navigate("/chu-tro");
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-orange-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Đăng phòng trọ</p>
                        <p className="text-[11px] text-slate-500 leading-tight">Dành cho chủ trọ đăng tin & quản lý phòng</p>
                      </div>
                    </button>

                    {/* Đăng Ghép bạn */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPostMenu(false);
                        navigate("/ghep-ban");
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Đăng tìm bạn ở ghép</p>
                        <p className="text-[11px] text-slate-500 leading-tight">Làm bài test lối sống & kết nối bạn cùng trường</p>
                      </div>
                    </button>

                    {/* Đăng Pass phòng */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPostMenu(false);
                        navigate("/pass-phong");
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Đăng tin Pass phòng</p>
                        <p className="text-[11px] text-slate-500 leading-tight">Sang cọc an toàn, bảo lãnh bởi SmartStay</p>
                      </div>
                    </button>

                                      </div>
                </div>
              )}
            </div>

            {/* 2. CHUÔNG THÔNG BÁO VÀ DROPDOWN */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setOpenNotifications((prev) => !prev)}
                aria-label="Thông báo"
                className="relative w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition border border-border/50 text-foreground"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-orange-600 hover:underline"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-5 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-5 h-5 stroke-1.5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Chưa có thông báo nào</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Khi có cập nhật mới về phòng trọ, yêu cầu hoặc tài khoản của bạn, thông báo sẽ hiển thị tại đây.
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const Icon = item.icon || Bell;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={cn(
                              "p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3",
                              !item.read && "bg-orange-50/30"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", item.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h5 className={cn("text-xs font-bold leading-tight", !item.read ? "text-slate-900" : "text-slate-700")}>
                                  {item.title}
                                </h5>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 self-center" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                    SmartStay Cần Thơ — Hỗ trợ tìm phòng & Quản lí phòng trọ
                  </div>
                </div>
              )}
            </div>

            {/* 3. AVATAR NGƯỜI DÙNG VÀ DROPDOWN TÀI KHOẢN */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setOpenUserMenu((prev) => !prev)}
                  className="relative w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-sm hover:ring-2 hover:ring-orange-400 transition-all overflow-hidden"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName || "User"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getUserInitial()}</span>
                  )}
                  {/* Chấm online */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
                    {/* Header info user */}
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-base overflow-hidden flex-shrink-0",
                        user?.role === "transporter" ? "bg-teal-100 text-teal-800" :
                        user?.role === "landlord" ? "bg-orange-100 text-orange-700" :
                        user?.role === "admin" ? "bg-slate-900 text-white" :
                        "bg-emerald-100 text-emerald-800"
                      )}>
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName || "User"}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          getUserInitial()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {user?.fullName || (user?.role === "transporter" ? "Đối tác Tài xế" : "Người thuê phòng")}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                            user?.role === "admin" ? "bg-slate-900 text-white" :
                            user?.role === "landlord" ? "bg-orange-100 text-orange-800 border border-orange-200" :
                            user?.role === "transporter" ? "bg-teal-100 text-teal-800 border border-teal-200" :
                            user?.role === "employee" ? "bg-blue-100 text-blue-800" :
                            "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          )}>
                            {user?.role === "admin"
                              ? "Quản trị viên"
                              : user?.role === "landlord"
                              ? "Chủ nhà trọ"
                              : user?.role === "employee"
                              ? "Nhân viên"
                              : user?.role === "transporter"
                              ? "Đối tác Vận tải"
                              : "Người thuê"}
                          </span>
                          {user?.authProvider === "google" && (
                            <span className="text-[9px] font-semibold text-slate-400">Google ID</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items theo đúng từng vai trò (Zero Role Leak) */}
                    <div className="py-1 space-y-0.5 text-xs">
                      {/* VAI TRÒ: TÀI XẾ / ĐỐI TÁC VẬN TẢI */}
                      
                      {/* VAI TRÒ: CHỦ NHÀ TRỌ */}
                      {user?.role === "landlord" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/chu-tro");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold transition text-left"
                          >
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>Kênh Quản Trị Trọ & Hóa Đơn</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/chu-tro");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 text-slate-700 font-medium transition text-left"
                          >
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>Đăng phòng trọ mới</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              setOpenProfileModal(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Thông tin Chủ trọ</span>
                          </button>
                        </>
                      )}

                      {/* VAI TRÒ: QUẢN TRỊ VIÊN (ADMIN) */}
                      {user?.role === "admin" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/admin");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition text-left"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-400" />
                            <span>Bảng Quản Trị Hệ Thống (Admin)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/chu-tro");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 text-orange-800 font-medium transition text-left"
                          >
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <span>Kênh Quản Trị Trọ</span>
                          </button>
                                                    <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              setOpenProfileModal(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Thông tin Quản trị viên</span>
                          </button>
                        </>
                      )}

                      {/* VAI TRÒ: NGƯỜI THUÊ */}
                      {(user?.role === "student" || (!user?.role && user)) && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              setOpenStudentPortal(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold transition text-left"
                          >
                            <Receipt className="w-4 h-4 text-emerald-600" />
                            <span>Phòng & Hóa đơn của tôi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/ghep-ban");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                          >
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>Ghép bạn cùng phòng</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              navigate("/pass-phong/cua-toi");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 text-slate-700 font-medium transition text-left"
                          >
                            <KeyRound className="w-4 h-4 text-[#f97316]" />
                            <span>Quản lý Pass phòng của tôi</span>
                          </button>
                                                    <button
                            type="button"
                            onClick={() => {
                              setOpenUserMenu(false);
                              setOpenProfileModal(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Thông tin tài khoản</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      {/* Đăng xuất */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/login")}
                className="rounded-full bg-slate-900 text-white font-bold text-xs"
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* MODAL THÔNG TIN TÀI KHOẢN (PROFILE DETAILS DIALOG) */}
      {openProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col text-slate-800">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hồ sơ tài khoản SmartStay</h3>
                  <p className="text-xs text-slate-500">Thông tin xác thực thành viên Cần Thơ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenProfileModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xl overflow-hidden shadow-sm flex-shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName || "User"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getUserInitial()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {user?.fullName || "Người thuê SmartStay"}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                  </span>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="space-y-2.5">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500">Khu vực / Địa điểm:</span>
                  <span className="font-semibold text-slate-800">{user?.campus || "Ninh Kiều / Cái Răng, Cần Thơ"}</span>
                </div>

                <div className="flex justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500">Vai trò tài khoản:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {user?.role === "admin"
                      ? "Quản trị viên Hệ thống"
                      : user?.role === "landlord"
                      ? "Chủ nhà trọ"
                      : user?.role === "employee"
                      ? "Nhân viên kiểm duyệt"
                      : user?.role === "transporter"
                      ? "Đối tác Vận tải SmartStay"
                      : "Người thuê"}
                  </span>
                </div>

                
                <div className="flex justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500">Phương thức đăng nhập:</span>
                  <span className="font-semibold text-slate-800">
                    {user?.authProvider === "google" ? "Google OAuth 2.0 (Liên kết trực tiếp)" : "Email & Mật khẩu"}
                  </span>
                </div>

                {user?.googleId && (
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 font-mono text-[11px]">
                    <span className="text-slate-500 font-sans">Google ID:</span>
                    <span className="text-slate-600 truncate max-w-[180px]">{user.googleId}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setOpenProfileModal(false)}
                  className="w-full rounded-xl bg-slate-900 text-white font-bold h-11"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL CỔNG THÔNG TIN NGƯỜI THUÊ */}
      <StudentPortalModal
        open={openStudentPortal}
        onClose={() => setOpenStudentPortal(false)}
      />
    </>
  );
}