import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Bell,
  UserCircle2,
  Plus,
  Users,
  Truck,
  KeyRound,
  Compass,
  Check,
  CheckCheck,
  Menu,
  X,
  GraduationCap,
  Phone,
  Mail,
  Edit3,
  BadgeCheck,
  Building2,
  Sparkles,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Tìm bạn ở ghép",
    desc: "Đã có 3 sinh viên ĐH FPT Cần Thơ có lối sống phù hợp >90% với bạn!",
    time: "5 phút trước",
    read: false,
    action: "quiz"
  },
  {
    id: 2,
    title: "Hỗ trợ chuyển trọ Cần Thơ",
    desc: "Đội xe ba gác sinh viên Khu 2 Cần Thơ đang có mã giảm 15% cho bạn.",
    time: "25 phút trước",
    read: false,
    action: "logistics"
  },
  {
    id: 3,
    title: "Xác minh Safe Badge",
    desc: "Trọ Mini An Khánh vừa cập nhật chứng nhận Safe Badge (đồng hồ riêng, PCCC).",
    time: "2 giờ trước",
    read: false,
    action: "explore"
  },
  {
    id: 4,
    title: "SmartStay Pass",
    desc: "Tính năng Pass phòng an toàn đã sẵn sàng để bạn chuyển nhượng cọc nhanh.",
    time: "1 ngày trước",
    read: true,
    action: "pass"
  }
];

const DEFAULT_PROFILE = {
  name: "Đinh Trịnh Nhật Minh",
  campus: "ĐH FPT Cần Thơ",
  studentId: "CE180000",
  phone: "0912 345 678",
  email: "minhdtnce180000@fpt.edu.vn",
  status: "Đang tìm phòng trọ",
  verified: true
};

const SAMPLE_STUDENTS = [
  {
    name: "Đinh Trịnh Nhật Minh",
    campus: "ĐH FPT Cần Thơ",
    studentId: "CE180000",
    phone: "0912 345 678",
    email: "minhdtnce180000@fpt.edu.vn",
    status: "Đang tìm phòng trọ",
    verified: true
  },
  {
    name: "Nguyễn Văn An",
    campus: "ĐH Cần Thơ (Khu 2)",
    studentId: "B2109876",
    phone: "0909 112 233",
    email: "anb2109876@student.ctu.edu.vn",
    status: "Cần tìm bạn ở ghép",
    verified: true
  },
  {
    name: "Lê Thị Bích",
    campus: "ĐH Y Dược Cần Thơ",
    studentId: "Y2005432",
    phone: "0938 776 554",
    email: "bichly20@ctump.edu.vn",
    status: "Muốn pass phòng trọ",
    verified: true
  }
];

export default function AppHeader({
  onOpenExplore = () => { },
  onOpenQuiz = () => { },
  onOpenLogistics = () => { },
  onOpenPass = () => { },
  onOpenSafe = () => { }
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Student Profile state
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("smartstay_student_profile");
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [editForm, setEditForm] = useState(profile);

  // Refs for click outside
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);

    // Execute corresponding action
    if (item.action === "quiz") onOpenQuiz();
    else if (item.action === "logistics") onOpenLogistics();
    else if (item.action === "pass") onOpenPass();
    else if (item.action === "safe") onOpenSafe();
    else if (item.action === "explore") onOpenExplore();
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(editForm);
    try {
      localStorage.setItem("smartstay_student_profile", JSON.stringify(editForm));
    } catch {
      // ignore
    }
    setShowEditProfileModal(false);
  };

  const handleSwitchAccount = (std) => {
    setProfile(std);
    setEditForm(std);
    try {
      localStorage.setItem("smartstay_student_profile", JSON.stringify(std));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-emerald-600 transition-colors">
              SmartStay
            </div>
            <div className="text-[10px] text-slate-400 font-body uppercase tracking-wider font-semibold">
              Cần Thơ · Sinh viên
            </div>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-2xl border border-slate-100">
          <button
            onClick={onOpenExplore}
            className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-800 hover:text-emerald-600 hover:bg-white transition-all flex items-center gap-1.5 focus:outline-none"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            Khám phá
          </button>

          <button
            onClick={onOpenQuiz}
            className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-1.5 focus:outline-none"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            Ghép bạn
          </button>

          <button
            onClick={onOpenLogistics}
            className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-teal-600 hover:bg-white transition-all flex items-center gap-1.5 focus:outline-none"
          >
            <Truck className="w-4 h-4 text-teal-500" />
            Chuyển trọ
          </button>

          <button
            onClick={onOpenPass}
            className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-amber-600 hover:bg-white transition-all flex items-center gap-1.5 focus:outline-none"
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            Pass phòng
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Post Safe Listing button */}
          <button
            onClick={onOpenSafe}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-95 shadow-md shadow-emerald-500/20 transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Đăng tin</span>
          </button>

          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              title="Thông báo"
              className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all focus:outline-none",
                showNotifications
                  ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-slate-900 text-sm">
                      Thông báo sinh viên
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Đã đọc
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        title="Xóa hết"
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      Chưa có thông báo mới nào
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex gap-3 items-start",
                          !n.read && "bg-emerald-50/40"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                            n.action === "quiz" && "bg-indigo-100 text-indigo-600",
                            n.action === "logistics" && "bg-teal-100 text-teal-600",
                            n.action === "safe" && "bg-emerald-100 text-emerald-600",
                            n.action === "pass" && "bg-amber-100 text-amber-600",
                            n.action === "explore" && "bg-blue-100 text-blue-600"
                          )}
                        >
                          {n.action === "quiz" && <Users className="w-4 h-4" />}
                          {n.action === "logistics" && <Truck className="w-4 h-4" />}
                          {n.action === "safe" && <ShieldCheck className="w-4 h-4" />}
                          {n.action === "pass" && <KeyRound className="w-4 h-4" />}
                          {n.action === "explore" && <Compass className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                            {n.desc}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">
                    SmartStay · Hệ thống thông báo tự động Cần Thơ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Button & Popover */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              title="Hồ sơ sinh viên"
              className={cn(
                "relative h-9 px-2.5 rounded-xl flex items-center gap-1.5 transition-all focus:outline-none",
                showProfile
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                {profile.name ? profile.name.slice(0, 1).toUpperCase() : "S"}
              </div>
              <span className="hidden sm:inline text-xs font-bold max-w-[100px] truncate">
                {profile.name ? profile.name.split(" ").slice(-1)[0] : "Sinh viên"}
              </span>
            </button>

            {/* User Profile Dropdown Panel */}
            {showProfile && (
              <div className="absolute right-0 top-12 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Header */}
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-lg border border-white/30">
                        {profile.name ? profile.name.slice(0, 1).toUpperCase() : "S"}
                      </div>
                      <div>
                        <div className="font-display font-extrabold text-white text-base flex items-center gap-1.5">
                          {profile.name}
                          {profile.verified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-300" />
                          )}
                        </div>
                        <div className="text-xs text-emerald-100 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {profile.campus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
                    <div>MSSV: <span className="font-semibold text-white">{profile.studentId}</span></div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/40 text-[11px] font-semibold text-white">
                      {profile.status}
                    </div>
                  </div>
                </div>

                {/* Profile Quick Details */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.phone}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                      Đã xác minh
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setEditForm(profile);
                      setShowEditProfileModal(true);
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa thông tin sinh viên</span>
                  </button>
                </div>

                {/* Account Switcher Presets */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    Đổi tài khoản SV mẫu
                  </div>
                  <div className="space-y-1">
                    {SAMPLE_STUDENTS.map((std) => (
                      <button
                        key={std.studentId}
                        onClick={() => handleSwitchAccount(std)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                          profile.studentId === std.studentId
                            ? "bg-emerald-100 text-emerald-900 font-bold"
                            : "hover:bg-slate-200/70 text-slate-700"
                        )}
                      >
                        <span className="truncate">{std.name} ({std.campus})</span>
                        {profile.studentId === std.studentId && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenExplore();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold text-left"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              Khám phá trọ
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuiz();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold text-left"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Ghép bạn
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogistics();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold text-left"
            >
              <Truck className="w-4 h-4 text-teal-600" />
              Chuyển trọ
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPass();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold text-left"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              Pass phòng
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSafe();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Đăng tin Safe Badge
          </button>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Hồ sơ sinh viên Cần Thơ
                </h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên sinh viên
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trường Đại học tại Cần Thơ
                </label>
                <select
                  value={editForm.campus}
                  onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ĐH FPT Cần Thơ">ĐH FPT Cần Thơ</option>
                  <option value="ĐH Cần Thơ (Khu 2)">ĐH Cần Thơ (Khu 2)</option>
                  <option value="ĐH Y Dược Cần Thơ">ĐH Y Dược Cần Thơ</option>
                  <option value="ĐH Nam Cần Thơ">ĐH Nam Cần Thơ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã số sinh viên (MSSV)
                  </label>
                  <input
                    type="text"
                    value={editForm.studentId}
                    onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email sinh viên (.edu.vn)
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái hiện tại
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Đang tìm phòng trọ">Đang tìm phòng trọ</option>
                  <option value="Cần tìm bạn ở ghép">Cần tìm bạn ở ghép</option>
                  <option value="Đang ở trọ ổn định">Đang ở trọ ổn định</option>
                  <option value="Muốn pass phòng trọ">Muốn pass phòng trọ</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}