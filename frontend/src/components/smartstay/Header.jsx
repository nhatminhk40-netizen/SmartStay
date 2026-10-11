import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  Plus,
  ShieldCheck,
  Users,
  Truck,
  KeyRound,
  User,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  School,
  Mail,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import SafeListingModal from "@/components/SafeListingModal";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Khám phá", path: "/" },
  { label: "Ghép bạn", path: "/ghep-ban" },
  { label: "Chuyển trọ", path: "/chuyen-tro" },
  { label: "Pass phòng", path: "/pass-phong" },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Ưu đãi Chuyển trọ Sinh viên",
    desc: "Mã giảm giá TRANTRO15 — Trợ giá 15% khi đặt xe ba gác & xe tải chuyển trọ tuần này.",
    time: "10 phút trước",
    read: false,
    path: "/chuyen-tro",
    icon: Truck,
    color: "text-orange-500 bg-orange-50"
  },
  {
    id: 2,
    title: "Gợi ý Bạn cùng phòng",
    desc: "Có 3 sinh viên ĐH Cần Thơ & ĐH FPT có chỉ số tương thích lối sống >90% với bạn.",
    time: "45 phút trước",
    read: false,
    path: "/ghep-ban",
    icon: Users,
    color: "text-blue-500 bg-blue-50"
  },
  {
    id: 3,
    title: "Phòng trọ mới pass cọc",
    desc: "Phòng trọ gần ĐH FPT (KDC Hồng Phát) vừa đăng pass cọc tiết kiệm 2 tháng tiền phòng.",
    time: "2 giờ trước",
    read: false,
    path: "/pass-phong",
    icon: KeyRound,
    color: "text-emerald-500 bg-emerald-50"
  },
  {
    id: 4,
    title: "Bảo mật tài khoản Google",
    desc: "Tài khoản của bạn đã được kết nối an toàn với Google Identity Services.",
    time: "Hôm qua",
    read: true,
    path: "/",
    icon: ShieldCheck,
    color: "text-purple-500 bg-purple-50"
  }
];

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Dropdown states
  const [openPostMenu, setOpenPostMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openSafeListing, setOpenSafeListing] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
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

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item) => {
    setNotifications(
      notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setOpenNotifications(false);
    if (item.path) navigate(item.path);
  };

  const getUserInitial = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "M";
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 group-hover:bg-orange-500/25 flex items-center justify-center transition-colors">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
            <div className="leading-tight">
              <div className="font-heading font-extrabold text-foreground text-lg tracking-tight">SmartStay</div>
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase font-semibold">
                Cần Thơ · Sinh viên
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
                    "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                    active
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  {item.label}
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
                    {/* Đăng Safe Badge */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPostMenu(false);
                        setOpenSafeListing(true);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-orange-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Đăng phòng Safe Badge™</p>
                        <p className="text-[11px] text-slate-500 leading-tight">Kiểm duyệt minh bạch & gắn nhãn an toàn</p>
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

                    {/* Đặt xe chuyển trọ */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPostMenu(false);
                        navigate("/chuyen-tro");
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Đặt xe chuyển trọ sinh viên</p>
                        <p className="text-[11px] text-slate-500 leading-tight">Xe ba gác & xe tải giá sinh viên theo km</p>
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
                    {notifications.map((item) => {
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
                    })}
                  </div>

                  <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                    SmartStay Cần Thơ · Đồng hành cùng sinh viên
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
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-base overflow-hidden flex-shrink-0">
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
                          {user?.fullName || "Sinh viên Cần Thơ"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 uppercase">
                            {user?.role === "admin"
                              ? "Quản trị viên"
                              : user?.role === "landlord"
                              ? "Chủ nhà trọ"
                              : user?.role === "employee"
                              ? "Nhân viên"
                              : "Sinh viên"}
                          </span>
                          {user?.authProvider === "google" && (
                            <span className="text-[9px] font-semibold text-slate-400">Google ID</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1 space-y-0.5 text-xs">
                      {/* Chủ trọ: Đăng phòng Safe Badge */}
                      {user?.role === "landlord" && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenUserMenu(false);
                            setOpenSafeListing(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold transition text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-orange-600" />
                          <span>Đăng phòng trọ (Safe Badge)</span>
                        </button>
                      )}

                      {/* Xem hồ sơ cá nhân */}
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

                      {/* Lịch sử chuyển trọ */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenUserMenu(false);
                          navigate("/chuyen-tro");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                      >
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span>Dịch vụ chuyển trọ của tôi</span>
                      </button>

                      {/* Ghép bạn */}
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

                      {/* Admin panel link */}
                      {user?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenUserMenu(false);
                            navigate("/admin");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold transition text-left"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Trang Quản trị Admin</span>
                        </button>
                      )}

                      {/* Employee panel link */}
                      {(user?.role === "employee" || user?.role === "admin") && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenUserMenu(false);
                            navigate("/employee");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-left"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-500" />
                          <span>Bàn làm việc Nhân viên</span>
                        </button>
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
                    {user?.fullName || "Sinh viên SmartStay"}
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
                  <span className="text-slate-500">Khu vực / Campus:</span>
                  <span className="font-semibold text-slate-800">{user?.campus || "ĐH Cần Thơ / FPT Can Tho"}</span>
                </div>

                <div className="flex justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500">Vai trò tài khoản:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {user?.role === "admin"
                      ? "Quản trị viên"
                      : user?.role === "employee"
                      ? "Nhân viên kiểm duyệt"
                      : "Sinh viên"}
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

      {/* MODAL SAFE LISTING */}
      <SafeListingModal
        open={openSafeListing}
        onClose={() => setOpenSafeListing(false)}
        onSafe={() => {
          setOpenSafeListing(false);
          navigate("/");
        }}
      />
    </>
  );
}