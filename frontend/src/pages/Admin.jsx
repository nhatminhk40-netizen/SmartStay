import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  getHeroConfig,
  saveHeroConfig,
  DEFAULT_HERO,
  getCampusesConfig,
  saveCampusesConfig,
  getAmenitiesConfig,
  saveAmenitiesConfig,
  getSpecialTogglesConfig,
  saveSpecialTogglesConfig,
  DEFAULT_SPECIAL_TOGGLES,
  getQuickActionsConfig,
  saveQuickActionsConfig,
  DEFAULT_QUICK_ACTIONS
} from "@/lib/adminConfig";
import {
  LayoutDashboard,
  Building2,
  Image as ImageIcon,
  GraduationCap,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  KeyRound,
  Users,
  Home as HomeIcon,
  LogOut,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Maximize,
  Star,
  RefreshCw,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  Snowflake,
  Box,
  Droplets,
  Layers,
  RotateCw,
  Shirt,
  VolumeOff,
  Phone,
  FileText,
  Truck,
  Compass,
  Play
} from "lucide-react";
import RoommateQuiz from "@/components/RoommateQuiz";
import LogisticsCalculator from "@/components/LogisticsCalculator";
import PassRoomDialog from "@/components/PassRoomDialog";
import SafeListingModal from "@/components/SafeListingModal";
import { cn } from "@/lib/utils";

// Danh mục Icon hỗ trợ cho Tiện nghi
const AVAILABLE_ICONS = [
  { name: "Snowflake", label: "Máy lạnh (Tuyết)", icon: Snowflake },
  { name: "Box", label: "Tủ lạnh (Hộp)", icon: Box },
  { name: "Droplets", label: "Máy nước nóng (Nước)", icon: Droplets },
  { name: "Layers", label: "Gác lửng (Tầng)", icon: Layers },
  { name: "RotateCw", label: "Máy giặt (Xoay)", icon: RotateCw },
  { name: "Shirt", label: "Tủ quần áo (Áo)", icon: Shirt },
  { name: "VolumeOff", label: "Cách âm (Yên tĩnh)", icon: VolumeOff },
  { name: "Sparkles", label: "Nội thất cao cấp", icon: Sparkles },
  { name: "ShieldCheck", label: "An ninh bảo vệ", icon: ShieldCheck },
];

const ROOM_TYPES = [
  "Phòng trọ khép kín",
  "Căn hộ mini / Studio",
  "Homestay sinh viên",
  "Phòng ở ghép",
  "Ký túc xá cao cấp",
];

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Hiển thị Toast thông báo
  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ==================== TẢI DỮ LIỆU PHÒNG ====================
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Room.list("", 100);
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải phòng cho Admin:", err);
      showToast("Lỗi kết nối tải dữ liệu phòng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ==================== TÍNH TOÁN DASHBOARD ====================
  const totalRooms = rooms.length;
  const safeRooms = rooms.filter((r) => r.safe_badge || r.isSafeBadge).length;
  const passRooms = rooms.filter((r) => r.has_pass || r.listingType === "pass").length;
  const boostedRooms = rooms.filter((r) => r.is_boosted).length;
  const roommateRooms = rooms.filter((r) => r.seeking_roommate).length;

  const campusStats = rooms.reduce((acc, r) => {
    const c = r.campus || "Chưa phân loại";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  // ==================== BƯỚC 3: QUẢN LÝ PHÒNG TRỌ (CRUD) ====================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBadge, setFilterBadge] = useState("all");
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Form State tạo / sửa phòng
  const initialRoomForm = {
    title: "",
    campus: "ĐH Cần Thơ",
    address: "",
    location: "Ninh Kiều, Cần Thơ",
    price: 2000000,
    area_sqm: 20,
    room_type: "Phòng trọ khép kín",
    contactPhone: "0901234567",
    description: "",
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    imagesText: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    amenities: ["Máy lạnh", "Gác lửng"],
    safe_badge: true,
    is_boosted: false,
    has_pass: false,
    pass_months_left: 3,
    seeking_roommate: false,
  };
  const [roomForm, setRoomForm] = useState(initialRoomForm);

  // Mở modal thêm phòng mới
  const handleOpenAddRoom = () => {
    const defaultCampus = campuses[1] || "ĐH Cần Thơ";
    setEditingRoom(null);
    setRoomForm({ ...initialRoomForm, campus: defaultCampus });
    setIsRoomModalOpen(true);
  };

  // Mở modal sửa phòng
  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    const imgList = room.images && room.images.length > 0 ? room.images.join("\n") : (room.image_url || "");
    setRoomForm({
      title: room.title || "",
      campus: room.campus || campuses[1] || "ĐH Cần Thơ",
      address: room.address || "",
      location: room.location || "Ninh Kiều, Cần Thơ",
      price: room.price || 0,
      area_sqm: room.area_sqm || 20,
      room_type: room.room_type || "Phòng trọ khép kín",
      contactPhone: room.contactPhone || "",
      description: room.description || "",
      rating: room.rating || room._avgRating || 4.5,
      image_url: room.image_url || (room.images && room.images[0]) || "",
      imagesText: imgList,
      amenities: room.amenities || [],
      safe_badge: Boolean(room.safe_badge || room.isSafeBadge),
      is_boosted: Boolean(room.is_boosted),
      has_pass: Boolean(room.has_pass || room.listingType === "pass"),
      pass_months_left: room.pass_months_left || room.remaining_duration || 3,
      seeking_roommate: Boolean(room.seeking_roommate),
    });
    setIsRoomModalOpen(true);
  };

  // Lưu phòng (Create hoặc Update)
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.title.trim()) {
      showToast("Vui lòng nhập tên tin đăng phòng!", "error");
      return;
    }

    setIsSavingRoom(true);
    try {
      const imgArray = roomForm.imagesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...roomForm,
        images: imgArray.length > 0 ? imgArray : [roomForm.image_url],
        image_url: imgArray[0] || roomForm.image_url,
        price: Number(roomForm.price),
        area_sqm: Number(roomForm.area_sqm),
        rating: Number(roomForm.rating),
        pass_months_left: Number(roomForm.pass_months_left),
        isSafeBadge: roomForm.safe_badge,
        listingType: roomForm.has_pass ? "pass" : roomForm.safe_badge ? "safe" : "standard"
      };

      if (editingRoom) {
        const id = editingRoom.id || editingRoom._id;
        await base44.entities.Room.update(id, payload);
        showToast(`Đã cập nhật phòng "${payload.title}" thành công!`);
      } else {
        await base44.entities.Room.create(payload);
        showToast(`Đã thêm phòng mới "${payload.title}" thành công!`);
      }

      setIsRoomModalOpen(false);
      await fetchRooms();
    } catch (err) {
      console.error("Lỗi lưu phòng:", err);
      showToast("Lỗi khi lưu phòng trọ, vui lòng thử lại.", "error");
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Xác nhận xóa phòng
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRoom) return;
    try {
      const id = deleteConfirmRoom.id || deleteConfirmRoom._id;
      await base44.entities.Room.delete(id);
      showToast(`Đã xóa phòng "${deleteConfirmRoom.title}" thành công!`);
      setDeleteConfirmRoom(null);
      await fetchRooms();
    } catch (err) {
      console.error("Lỗi xóa phòng:", err);
      showToast("Lỗi khi xóa phòng.", "error");
    }
  };

  // Lọc danh sách phòng theo tìm kiếm và badge
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.campus && r.campus.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.address && r.address.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      if (filterBadge === "safe" && !(r.safe_badge || r.isSafeBadge)) return false;
      if (filterBadge === "pass" && !(r.has_pass || r.listingType === "pass")) return false;
      if (filterBadge === "boosted" && !r.is_boosted) return false;
      if (filterBadge === "roommate" && !r.seeking_roommate) return false;

      return true;
    });
  }, [rooms, searchTerm, filterBadge]);

  // ==================== BƯỚC 4: QUẢN LÝ HERO BANNER ====================
  const [heroForm, setHeroForm] = useState(getHeroConfig);
  const handleSaveHero = () => {
    saveHeroConfig(heroForm);
    showToast("Đã lưu nội dung Banner Hero thành công!");
  };
  const handleResetHero = () => {
    setHeroForm(DEFAULT_HERO);
    saveHeroConfig(DEFAULT_HERO);
    showToast("Đã khôi phục Banner Hero về mặc định!");
  };

  // ==================== BƯỚC 5: QUẢN LÝ CAMPUS & TIỆN NGHI ====================
  const [campuses, setCampuses] = useState(getCampusesConfig);
  const [newCampus, setNewCampus] = useState("");
  const [editingCampus, setEditingCampus] = useState(null);
  const [editCampusText, setEditCampusText] = useState("");

  const [amenities, setAmenities] = useState(getAmenitiesConfig);
  const [newAmenityName, setNewAmenityName] = useState("");
  const [newAmenityIcon, setNewAmenityIcon] = useState("Snowflake");

  // Campus operations
  const handleAddCampus = () => {
    if (!newCampus.trim()) {
      showToast("Vui lòng nhập tên trường ĐH vào ô bên cạnh trước khi bấm Thêm!", "error");
      return;
    }
    if (campuses.some((c) => c.toLowerCase() === newCampus.trim().toLowerCase())) {
      showToast("Khu vực / Campus này đã tồn tại trong danh mục!", "error");
      return;
    }
    const updated = [...campuses, newCampus.trim()];
    setCampuses(updated);
    saveCampusesConfig(updated);
    setNewCampus("");
    showToast(`Đã thêm Campus: "${newCampus.trim()}" thành công!`);
  };

  const handleStartEditCampus = (c) => {
    if (c === "Tất cả khu vực") {
      showToast("Mục 'Tất cả khu vực' là mặc định toàn hệ thống, không thể đổi tên.", "error");
      return;
    }
    setEditingCampus(c);
    setEditCampusText(c);
  };

  const handleSaveEditCampus = (oldName) => {
    if (!editCampusText.trim()) {
      showToast("Tên trường ĐH không được để trống!", "error");
      return;
    }
    const updated = campuses.map((c) => (c === oldName ? editCampusText.trim() : c));
    setCampuses(updated);
    saveCampusesConfig(updated);
    setEditingCampus(null);
    showToast(`Đã đổi tên trường thành "${editCampusText.trim()}" thành công!`);
  };

  const handleDeleteCampus = (c) => {
    if (c === "Tất cả khu vực") {
      showToast("Không thể xóa mục mặc định 'Tất cả khu vực'", "error");
      return;
    }
    const updated = campuses.filter((item) => item !== c);
    setCampuses(updated);
    saveCampusesConfig(updated);
    showToast(`Đã xóa Campus: "${c}"`);
  };

  // Amenity operations
  const handleAddAmenity = () => {
    if (!newAmenityName.trim()) {
      showToast("Vui lòng nhập tên tiện nghi vào ô bên cạnh trước khi bấm Thêm!", "error");
      return;
    }
    if (amenities.some((a) => (a.id || a.label).toLowerCase() === newAmenityName.trim().toLowerCase())) {
      showToast("Tiện nghi này đã có trong danh sách!", "error");
      return;
    }
    const updated = [
      ...amenities,
      { id: newAmenityName.trim(), label: newAmenityName.trim(), iconName: newAmenityIcon }
    ];
    setAmenities(updated);
    saveAmenitiesConfig(updated);
    setNewAmenityName("");
    showToast(`Đã thêm Tiện nghi: "${newAmenityName.trim()}"`);
  };

  const handleDeleteAmenity = (id) => {
    const updated = amenities.filter((a) => (a.id || a.label) !== id);
    setAmenities(updated);
    saveAmenitiesConfig(updated);
    showToast(`Đã xóa tiện nghi "${id}"`);
  };

  // ==================== BƯỚC 6: TOGGLE ĐẶC BIỆT & QUICK ACTIONS ====================
  const [specialToggles, setSpecialToggles] = useState(getSpecialTogglesConfig);
  const handleSaveToggles = () => {
    saveSpecialTogglesConfig(specialToggles);
    showToast("Đã lưu cấu hình Toggle bộ lọc thành công!");
  };

  const [quickActions, setQuickActions] = useState(getQuickActionsConfig);
  const [testQuizOpen, setTestQuizOpen] = useState(false);
  const [testLogisticsOpen, setTestLogisticsOpen] = useState(false);
  const [testPassOpen, setTestPassOpen] = useState(false);
  const [testSafeOpen, setTestSafeOpen] = useState(false);

  // Modal Thêm / Sửa Thao tác nhanh
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [editingQuickAction, setEditingQuickAction] = useState(null);
  const [quickActionForm, setQuickActionForm] = useState({
    id: "",
    label: "",
    desc: "",
    icon: "Compass",
    action: "explore",
    enabled: true
  });

  const handleOpenAddQuickAction = () => {
    setEditingQuickAction(null);
    setQuickActionForm({
      id: "action-" + Date.now(),
      label: "",
      desc: "",
      icon: "Sparkles",
      action: "explore",
      enabled: true
    });
    setIsQuickActionModalOpen(true);
  };

  const handleOpenEditQuickAction = (item) => {
    setEditingQuickAction(item);
    setQuickActionForm({
      id: item.id || "action-" + Date.now(),
      label: item.label || "",
      desc: item.desc || "",
      icon: item.icon || "Compass",
      action: item.action || "explore",
      enabled: item.enabled !== false
    });
    setIsQuickActionModalOpen(true);
  };

  const handleSaveQuickActionModal = (e) => {
    e.preventDefault();
    if (!quickActionForm.label.trim()) {
      showToast("Vui lòng nhập tên nút thao tác!", "error");
      return;
    }

    let updated;
    if (editingQuickAction) {
      updated = quickActions.map((a) =>
        a.id === editingQuickAction.id
          ? {
              ...quickActionForm,
              label: quickActionForm.label.trim(),
              desc: quickActionForm.desc.trim()
            }
          : a
      );
      showToast(`Đã cập nhật nút "${quickActionForm.label.trim()}"!`);
    } else {
      updated = [
        ...quickActions,
        {
          ...quickActionForm,
          label: quickActionForm.label.trim(),
          desc: quickActionForm.desc.trim()
        }
      ];
      showToast(`Đã thêm mới nút "${quickActionForm.label.trim()}"!`);
    }
    setQuickActions(updated);
    saveQuickActionsConfig(updated);
    setIsQuickActionModalOpen(false);
  };

  const handleDeleteQuickAction = (id) => {
    const itemToDelete = quickActions.find((a) => a.id === id);
    const updated = quickActions.filter((a) => a.id !== id);
    setQuickActions(updated);
    saveQuickActionsConfig(updated);
    showToast(`Đã xóa nút "${itemToDelete?.label || id}"!`);
  };

  const handleResetQuickActions = () => {
    setQuickActions(DEFAULT_QUICK_ACTIONS);
    saveQuickActionsConfig(DEFAULT_QUICK_ACTIONS);
    showToast("Đã khôi phục khối Truy cập nhanh về cấu hình gốc!");
  };

  const handleTestQuickAction = (item) => {
    if (!item) return;
    if (item.action === "quiz") {
      setTestQuizOpen(true);
      showToast(`[CHẠY THỬ] Mở tính năng: "${item.label}" (Trắc nghiệm ghép bạn)`);
    } else if (item.action === "logistics") {
      setTestLogisticsOpen(true);
      showToast(`[CHẠY THỬ] Mở tính năng: "${item.label}" (Tính giá chuyển trọ)`);
    } else if (item.action === "pass") {
      setTestPassOpen(true);
      showToast(`[CHẠY THỬ] Mở tính năng: "${item.label}" (Pass phòng sang nhượng)`);
    } else if (item.action === "safe") {
      setTestSafeOpen(true);
      showToast(`[CHẠY THỬ] Mở tính năng: "${item.label}" (Đăng tin Safe kiểm duyệt)`);
    } else if (item.action === "explore") {
      showToast(`[CHẠY THỬ] Nút "${item.label}": Điều hướng tới danh sách phòng trọ!`);
    } else {
      showToast(`[CHẠY THỬ] Nút "${item.label}": Thao tác hoạt động bình thường!`);
    }
  };

  const handleSaveQuickActions = () => {
    saveQuickActionsConfig(quickActions);
    showToast("Đã lưu khối Truy cập nhanh thành công!");
  };

  const moveQuickAction = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= quickActions.length) return;
    const copy = [...quickActions];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setQuickActions(copy);
    saveQuickActionsConfig(copy);
  };

  const toggleQuickActionActive = (id) => {
    const updated = quickActions.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    setQuickActions(updated);
    saveQuickActionsConfig(updated);
  };

  // Danh mục menu bên sidebar
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "rooms", label: "Quản lý tin đăng / phòng", icon: Building2 },
    { id: "hero", label: "Quản lý banner (Hero)", icon: ImageIcon },
    { id: "campuses", label: "Danh mục khu vực / Campus", icon: GraduationCap },
    { id: "amenities", label: "Bộ lọc tiện nghi & Toggle", icon: SlidersHorizontal },
    { id: "quick-actions", label: "Khối Truy cập nhanh", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex font-body text-slate-900" style={{ background: "linear-gradient(to bottom, #fdfbf7, #faf3e3, #f4ebd9)" }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={cn(
            "px-5 py-3.5 rounded-lg shadow-lg border text-xs font-bold",
            toastMessage.type === "error" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-[#f97316] text-white border-[#f97316]"
          )}>
            {toastMessage.msg}
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="w-64 shrink-0 flex flex-col border-r select-none" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
        {/* Brand */}
        <div className="p-6 border-b" style={{ borderColor: "#f4ebd9" }}>
          <div className="font-black text-xl tracking-tight text-slate-900 mb-1">
            SmartStay
          </div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Admin Portal
          </div>
        </div>

        {/* Nav */}
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left",
                  active
                    ? "text-white shadow-md"
                    : "text-slate-600"
                )}
                style={{
                  background: active ? "#f97316" : "transparent",
                  ...( !active && { ":hover": { background: "#f4ebd9", color: "#f97316" } } )
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#f4ebd9"; e.currentTarget.style.color = "#f97316"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ""; } }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Profile footer */}
        <div className="p-4 border-t" style={{ borderColor: "#f4ebd9" }}>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border shadow-sm" style={{ borderColor: "#f4ebd9" }}>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{user?.name || "Administrator"}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Quyền Admin</div>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
          <Link
            to="/"
            className="block w-full text-center mt-3 py-2 text-xs font-bold text-slate-500 hover:text-[#f97316] transition-colors"
          >
            Quay về trang chủ
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: "rgba(253,251,247,0.8)", borderColor: "#f4ebd9" }}>
          <h1 className="text-lg font-black text-slate-900">
            {menuItems.find((m) => m.id === activeTab)?.label}
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchRooms}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: "#f4ebd9" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#faf3e3"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f4ebd9"}
            >
              {loading ? "Đang tải..." : "Làm mới dữ liệu"}
            </button>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f97316" }} />
              Live
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* ── TAB: DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <>
              {/* Welcome */}
              <div className="rounded-xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                <div>
                  <h2 className="font-black text-2xl mb-2">
                    Chào mừng, {user?.name || "Administrator"}!
                  </h2>
                  <p className="text-white/80 text-sm">
                    Quản lý hệ thống phòng trọ sinh viên minh bạch tại TP. Cần Thơ.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("rooms")}
                  className="px-6 py-3 rounded-lg bg-white text-[#f97316] text-sm font-bold transition-all active:scale-95 shadow-md hover:bg-slate-50"
                >
                  Quản lý tin đăng
                </button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Tổng phòng", value: totalRooms, sub: "Đang công khai", color: "#f97316" },
                  { label: "Safe Badge", value: safeRooms, sub: `${totalRooms ? Math.round((safeRooms/totalRooms)*100) : 0}% tổng tin`, color: "#10b981" },
                  { label: "Đang Pass", value: passRooms, sub: "Sang nhượng cọc", color: "#f59e0b" },
                  { label: "Lên đầu", value: boostedRooms, sub: "Ưu tiên hiển thị", color: "#6366f1" },
                  { label: "Tìm ghép", value: roommateRooms, sub: "Nhu cầu ở ghép", color: "#a855f7" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="rounded-xl p-5 bg-white border shadow-sm" style={{ borderColor: "#f4ebd9" }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>{label}</div>
                    <div className="font-black text-3xl text-slate-900 mb-1">{loading ? "..." : value}</div>
                    <div className="text-[11px] font-semibold text-slate-400">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-xl p-6 bg-white border shadow-sm" style={{ borderColor: "#f4ebd9" }}>
                  <h4 className="font-black text-slate-900 text-base mb-6">Phân bố theo Trường</h4>
                  <div className="space-y-4">
                    {Object.entries(campusStats).length === 0 ? (
                      <div className="text-sm font-medium text-slate-500 py-4 text-center">Chưa có dữ liệu</div>
                    ) : (
                      Object.entries(campusStats).map(([camp, count]) => {
                        const percent = totalRooms ? Math.round((count / totalRooms) * 100) : 0;
                        return (
                          <div key={camp} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-slate-700 truncate max-w-[150px]">{camp}</span>
                              <span className="font-black text-slate-900">{count} ({percent}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f4ebd9" }}>
                              <div className="h-full transition-all duration-500" style={{ width: `${percent}%`, background: "#f97316" }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-xl p-6 bg-white border shadow-sm" style={{ borderColor: "#f4ebd9" }}>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-slate-900 text-base">Tin đăng gần đây</h4>
                    <button onClick={() => setActiveTab("rooms")} className="text-xs font-bold transition-colors uppercase tracking-wider" style={{ color: "#f97316" }}>
                      Xem tất cả
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#f4ebd9" }}>
                    {rooms.slice(0, 5).map((room) => (
                      <div key={room.id || room._id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-lg shrink-0 border overflow-hidden" style={{ background: "#faf3e3", borderColor: "#f4ebd9" }}>
                            <img src={room.image_url || (room.images && room.images[0])} alt={room.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{room.title}</div>
                            <div className="text-xs font-semibold text-slate-500 mt-1">
                              {room.campus} · <span className="text-slate-900">{Number(room.price || 0).toLocaleString("vi-VN")}đ</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {room.safe_badge && <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>SAFE</span>}
                          {room.is_boosted && <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>TOP</span>}
                          {room.has_pass && <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>PASS</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: ROOMS ── */}
          {activeTab === "rooms" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                  <input
                    type="text"
                    placeholder="Tìm theo tên phòng, trường, địa chỉ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 max-w-md px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                    style={{ borderColor: "#f4ebd9" }}
                  />
                  <select
                    value={filterBadge}
                    onChange={(e) => setFilterBadge(e.target.value)}
                    className="px-4 py-2.5 rounded-lg text-sm font-bold border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                    style={{ borderColor: "#f4ebd9" }}
                  >
                    <option value="all">Tất cả badge</option>
                    <option value="safe">Badge Safe</option>
                    <option value="pass">Đang Pass</option>
                    <option value="boosted">Lên đầu</option>
                    <option value="roommate">Tìm ghép</option>
                  </select>
                </div>
                <button
                  onClick={handleOpenAddRoom}
                  className="w-full md:w-auto px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow-md"
                  style={{ background: "#f97316" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#ea580c"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#f97316"}
                >
                  + Thêm phòng mới
                </button>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: "#f4ebd9" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                        {["Ảnh", "Tên phòng / Địa chỉ", "Campus", "Giá / tháng", "Diện tích", "Badges", "Rating", "Hành động"].map((h, i) => (
                          <th key={h} className={cn("p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider", i === 7 && "text-right", i === 0 && "pl-6")}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "#f4ebd9" }}>
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-12 text-center text-slate-500 font-medium">
                            Không tìm thấy phòng trọ nào.
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((room) => (
                          <tr key={room.id || room._id} className="transition-colors hover:bg-slate-50">
                            <td className="p-4 pl-6">
                              <div className="w-14 h-14 rounded-lg bg-slate-200 border border-slate-200 overflow-hidden">
                                <img src={room.image_url || (room.images && room.images[0])} alt={room.title} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="font-bold text-slate-900 truncate mb-1">{room.title}</div>
                              <div className="text-xs font-medium text-slate-500 truncate">{room.address || room.location}</div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-700 text-xs px-2.5 py-1 rounded" style={{ background: "#f4ebd9" }}>
                                {room.campus}
                              </span>
                            </td>
                            <td className="p-4 font-black" style={{ color: "#f97316" }}>
                              {Number(room.price || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="p-4 font-medium text-slate-600">{room.area_sqm || 20} m²</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5 max-w-[140px]">
                                {room.safe_badge && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>SAFE</span>}
                                {room.is_boosted && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>TOP</span>}
                                {room.has_pass && <span className="px-2 py-1 rounded border text-[10px] font-bold tracking-wider" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>PASS</span>}
                                {room.seeking_roommate && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>GHÉP</span>}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-black text-slate-900">
                                {(room.rating || room._avgRating || 4.5).toFixed(1)} / 5
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => handleOpenEditRoom(room)} className="px-3 py-1.5 rounded text-slate-700 text-xs font-bold transition-colors hover:bg-slate-200" style={{ background: "#f4ebd9" }}>
                                Sửa
                              </button>
                              <button onClick={() => setDeleteConfirmRoom(room)} className="px-3 py-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors">
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: HERO BANNER ── */}
          {activeTab === "hero" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 bg-white border shadow-sm space-y-6" style={{ borderColor: "#f4ebd9" }}>
                <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: "#f4ebd9" }}>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Cấu hình Banner</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Nội dung hiển thị chính ở trang chủ.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleResetHero} className="px-4 py-2 rounded-lg text-slate-700 text-sm font-bold transition-colors" style={{ background: "#f4ebd9" }}>
                      Mặc định
                    </button>
                    <button onClick={handleSaveHero} className="px-5 py-2 rounded-lg text-white text-sm font-bold transition-colors shadow-md" style={{ background: "#f97316" }}>
                      Lưu thay đổi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Tiêu đề (Phần đầu)", key: "title" },
                    { label: "Từ khóa nổi bật", key: "highlight" },
                    { label: "Phần cuối", key: "titleSuffix" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                      <input
                        type="text"
                        value={heroForm[key]}
                        onChange={(e) => setHeroForm({ ...heroForm, [key]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                        style={{ borderColor: "#f4ebd9" }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đoạn mô tả</label>
                  <textarea
                    rows={2}
                    value={heroForm.description}
                    onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 resize-none"
                    style={{ borderColor: "#f4ebd9" }}
                  />
                </div>

                <div className="pt-6 border-t" style={{ borderColor: "#f4ebd9" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black text-slate-900">Huy hiệu tin cậy</span>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={heroForm.showBadges !== false} onChange={(e) => setHeroForm({ ...heroForm, showBadges: e.target.checked })} className="rounded w-4 h-4" style={{ accentColor: "#f97316" }} />
                      Hiển thị huy hiệu
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["badge1", "badge2", "badge3"].map((k) => (
                      <input key={k} type="text" value={heroForm[k]} onChange={(e) => setHeroForm({ ...heroForm, [k]: e.target.value })} placeholder={`Huy hiệu ${k.slice(-1)}`}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                        style={{ borderColor: "#f4ebd9" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 mb-4 px-2">Xem trước (Live Preview)</h4>
                <div className="rounded-xl p-10 border text-center" style={{ background: "linear-gradient(to bottom, #fdfbf7, #faf3e3)", borderColor: "#f4ebd9" }}>
                  <h1 className="font-black text-3xl text-slate-900 mb-4">
                    {heroForm.title} <span style={{ color: "#f97316" }}>{heroForm.highlight}</span> {heroForm.titleSuffix}
                  </h1>
                  <p className="text-slate-600 font-medium mb-6 max-w-2xl mx-auto">{heroForm.description}</p>
                  {heroForm.showBadges !== false && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {[heroForm.badge1, heroForm.badge2, heroForm.badge3].filter(Boolean).map((b, i) => (
                        <span key={i} className="px-4 py-2 rounded-full bg-white border text-slate-700 text-xs font-bold shadow-sm" style={{ borderColor: "#f4ebd9" }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CAMPUSES ── */}
          {activeTab === "campuses" && (
            <div className="rounded-xl p-8 bg-white border shadow-sm space-y-6" style={{ borderColor: "#f4ebd9" }}>
              <div className="pb-6 border-b" style={{ borderColor: "#f4ebd9" }}>
                <h3 className="font-black text-slate-900 text-lg">Khu vực / Campus</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Thêm, sửa, xóa các trường Đại học trong hệ thống.</p>
              </div>

              <div className="flex gap-3 max-w-lg">
                <input
                  type="text"
                  placeholder="Nhập tên trường ĐH mới..."
                  value={newCampus}
                  onChange={(e) => setNewCampus(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCampus(); } }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                  style={{ borderColor: "#f4ebd9" }}
                />
                <button onClick={handleAddCampus} className="px-6 py-2.5 rounded-lg text-white text-sm font-bold shadow-md" style={{ background: "#f97316" }}>
                  Thêm
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {campuses.map((c) => {
                  const roomCount = c === "Tất cả khu vực" ? totalRooms : (campusStats[c] || 0);
                  const isDefault = c === "Tất cả khu vực";
                  const isEditing = editingCampus === c;
                  return (
                    <div
                      key={c}
                      className="p-5 rounded-xl border transition-all"
                      style={{ background: isDefault ? "#fdfbf7" : "#ffffff", borderColor: "#f4ebd9" }}
                    >
                      <div className="mb-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input autoFocus type="text" value={editCampusText} onChange={(e) => setEditCampusText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditCampus(c); if (e.key === "Escape") setEditingCampus(null); }}
                              className="w-full px-3 py-1.5 text-sm font-bold border rounded focus:outline-none"
                              style={{ borderColor: "#f97316" }}
                            />
                            <button onClick={() => handleSaveEditCampus(c)} className="text-xs font-bold text-slate-900">Lưu</button>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-black text-slate-900 truncate mb-1">{c} {isDefault && <span className="ml-2 text-[10px] px-2 py-0.5 rounded text-slate-700 uppercase" style={{ background: "#f4ebd9" }}>Mặc định</span>}</div>
                            <div className="text-xs font-semibold text-slate-500">{roomCount} phòng trọ</div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#f4ebd9" }}>
                        <button onClick={() => { setActiveTab("rooms"); setSearchTerm(isDefault ? "" : c); setFilterBadge("all"); }} className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider">
                          Xem phòng
                        </button>
                        {!isDefault && !isEditing && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleStartEditCampus(c)} className="text-xs font-bold text-slate-500 hover:text-[#f97316] transition-colors">Sửa</button>
                            <button onClick={() => handleDeleteCampus(c)} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors">Xóa</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: AMENITIES ── */}
          {activeTab === "amenities" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 bg-white border shadow-sm space-y-6" style={{ borderColor: "#f4ebd9" }}>
                <div className="pb-6 border-b" style={{ borderColor: "#f4ebd9" }}>
                  <h3 className="font-black text-slate-900 text-lg">Tiện nghi</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Quản lý danh sách tiện nghi của phòng.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 max-w-2xl">
                  <input type="text" placeholder="Tên tiện nghi..." value={newAmenityName} onChange={(e) => setNewAmenityName(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                    style={{ borderColor: "#f4ebd9" }}
                  />
                  <select value={newAmenityIcon} onChange={(e) => setNewAmenityIcon(e.target.value)}
                    className="px-4 py-2.5 rounded-lg text-sm font-bold border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                    style={{ borderColor: "#f4ebd9" }}
                  >
                    {AVAILABLE_ICONS.map((ic) => <option key={ic.name} value={ic.name}>{ic.label}</option>)}
                  </select>
                  <button onClick={handleAddAmenity} className="px-6 py-2.5 rounded-lg text-white text-sm font-bold shadow-md" style={{ background: "#f97316" }}>
                    Thêm tiện nghi
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {amenities.map((a) => (
                    <div key={a.id || a.label} className="p-4 rounded-xl border flex items-center justify-between group" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                      <span className="text-sm font-bold text-slate-900 truncate">{a.label}</span>
                      <button onClick={() => handleDeleteAmenity(a.id || a.label)} className="text-xs font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-8 bg-white border shadow-sm space-y-6" style={{ borderColor: "#f4ebd9" }}>
                <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: "#f4ebd9" }}>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Toggles Đặc Biệt</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Chỉnh sửa 2 toggle quan trọng trên trang chủ.</p>
                  </div>
                  <button onClick={handleSaveToggles} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold shadow-md" style={{ background: "#f97316" }}>
                    Lưu cấu hình
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: "soundproof", label: "Toggle 1: Cách âm" },
                    { key: "roommate", label: "Toggle 2: Tìm bạn ở ghép" },
                  ].map(({ key, label }) => (
                    <div key={key} className="p-6 rounded-xl border space-y-4" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{label}</span>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={specialToggles[key]?.enabled !== false}
                            onChange={(e) => setSpecialToggles({ ...specialToggles, [key]: { ...specialToggles[key], enabled: e.target.checked } })}
                            className="rounded w-4 h-4" style={{ accentColor: "#f97316" }}
                          />
                          Bật
                        </label>
                      </div>
                      {[{ label: "Nhãn", subkey: "title" }, { label: "Mô tả nhỏ", subkey: "desc" }].map(({ label: l, subkey }) => (
                        <div key={subkey}>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{l}</label>
                          <input type="text" value={specialToggles[key]?.[subkey] || ""}
                            onChange={(e) => setSpecialToggles({ ...specialToggles, [key]: { ...specialToggles[key], [subkey]: e.target.value } })}
                            className="w-full px-4 py-2 rounded-lg text-sm font-medium border bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                            style={{ borderColor: "#f4ebd9" }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: QUICK ACTIONS ── */}
          {activeTab === "quick-actions" && (
            <div className="rounded-xl p-8 bg-white border shadow-sm space-y-8" style={{ borderColor: "#f4ebd9" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: "#f4ebd9" }}>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Truy cập nhanh</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Các nút chức năng nổi bật trên trang chủ.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleResetQuickActions} className="px-4 py-2 rounded-lg text-slate-700 text-sm font-bold" style={{ background: "#f4ebd9" }}>
                    Khôi phục
                  </button>
                  <button onClick={handleOpenAddQuickAction} className="px-4 py-2 rounded-lg border text-slate-900 text-sm font-bold bg-white" style={{ borderColor: "#f4ebd9" }}>
                    + Thêm
                  </button>
                  <button onClick={handleSaveQuickActions} className="px-5 py-2 rounded-lg text-white text-sm font-bold shadow-md" style={{ background: "#f97316" }}>
                    Lưu thứ tự
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="p-6 rounded-xl border" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Xem trước thanh nút bấm</div>
                <div className="flex flex-wrap gap-3">
                  {quickActions.filter((a) => a.enabled !== false).map((action) => (
                    <button key={"preview-" + action.id} onClick={() => handleTestQuickAction(action)}
                      className="px-5 py-2.5 rounded-full bg-white border shadow-sm text-sm font-black text-slate-900 transition-colors hover:border-[#f97316]"
                      style={{ borderColor: "#f4ebd9" }}
                    >
                      {action.label}
                    </button>
                  ))}
                  {quickActions.filter((a) => a.enabled !== false).length === 0 && (
                    <div className="text-sm font-medium text-slate-500 italic">Chưa có nút nào được bật.</div>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const isEnabled = action.enabled !== false;
                  return (
                    <div
                      key={action.id}
                      onClick={() => handleOpenEditQuickAction(action)}
                      className={cn("p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer transition-colors hover:border-[#f97316]", !isEnabled && "opacity-60")}
                      style={{ background: isEnabled ? "#ffffff" : "#fdfbf7", borderColor: "#f4ebd9" }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-base text-slate-900">{action.label}</span>
                          <span className="px-2 py-0.5 rounded text-slate-600 text-[10px] font-bold uppercase tracking-wider" style={{ background: "#f4ebd9" }}>Hành động: {action.action}</span>
                          {!isEnabled && <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">Đã ẩn</span>}
                        </div>
                        <div className="text-sm font-medium text-slate-500 truncate">{action.desc || "Không có mô tả"}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleTestQuickAction(action)} className="px-3 py-1.5 rounded text-slate-700 text-xs font-bold" style={{ background: "#f4ebd9" }}>Chạy thử</button>
                        <button onClick={() => handleOpenEditQuickAction(action)} className="px-3 py-1.5 rounded text-slate-700 text-xs font-bold" style={{ background: "#f4ebd9" }}>Sửa</button>
                        <div className="flex rounded p-1" style={{ background: "#f4ebd9" }}>
                          <button disabled={index === 0} onClick={() => moveQuickAction(index, -1)} className="px-2 font-bold text-slate-700 hover:text-[#f97316] disabled:opacity-30">↑</button>
                          <button disabled={index === quickActions.length - 1} onClick={() => moveQuickAction(index, 1)} className="px-2 font-bold text-slate-700 hover:text-[#f97316] disabled:opacity-30">↓</button>
                        </div>
                        <button onClick={() => toggleQuickActionActive(action.id)} className="px-3 py-1.5 rounded border text-slate-700 text-xs font-bold hover:border-[#f97316]" style={{ borderColor: "#f4ebd9" }}>
                          {isEnabled ? "Ẩn đi" : "Hiện lại"}
                        </button>
                        <button onClick={() => handleDeleteQuickAction(action.id)} className="px-3 py-1.5 rounded bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100">Xóa</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL THÊM/SỬA PHÒNG ── */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: "#f4ebd9" }}>
              <h3 className="font-black text-xl text-slate-900">{editingRoom ? "Sửa thông tin phòng" : "Tạo phòng mới"}</h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Đóng ✕</button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-8 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiêu đề phòng <span className="text-rose-500">*</span></label>
                <input type="text" required placeholder="Phòng trọ sinh viên..." value={roomForm.title} onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                  style={{ borderColor: "#f4ebd9" }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Trường / Khu vực *", type: "select", key: "campus", options: campuses.filter(c => c !== "Tất cả khu vực") },
                  { label: "Loại phòng", type: "select", key: "room_type", options: ROOM_TYPES },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                    <select value={roomForm[key]} onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                      style={{ borderColor: "#f4ebd9" }}
                    >
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Giá (VNĐ/tháng) *", key: "price", type: "number", step: "50000" },
                  { label: "Diện tích (m²)", key: "area_sqm", type: "number" },
                  { label: "Rating (1–5)", key: "rating", type: "number", step: "0.1", min: "1", max: "5" },
                ].map(({ label, key, type, step, min, max }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                    <input type={type} step={step} min={min} max={max} value={roomForm[key]} onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                      style={{ borderColor: "#f4ebd9" }}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Địa chỉ chi tiết", key: "address" },
                  { label: "Số điện thoại liên hệ", key: "contactPhone" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                    <input type="text" value={roomForm[key]} onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                      style={{ borderColor: "#f4ebd9" }}
                    />
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl border space-y-4" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Huy hiệu hiển thị</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-bold text-slate-700">
                  {[
                    { key: "safe_badge", label: "SAFE" },
                    { key: "is_boosted", label: "TOP (Lên đầu)" },
                    { key: "seeking_roommate", label: "GHÉP BẠN" },
                    { key: "has_pass", label: "PASS PHÒNG" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={roomForm[key]} onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: "#f97316" }} />
                      {label}
                    </label>
                  ))}
                </div>
                {roomForm.has_pass && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm font-bold text-slate-700">Tháng cọc còn lại:</span>
                    <input type="number" min="1" max="12" value={roomForm.pass_months_left} onChange={(e) => setRoomForm({ ...roomForm, pass_months_left: e.target.value })}
                      className="w-24 px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                      style={{ borderColor: "#f4ebd9" }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tiện nghi có sẵn</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {amenities.map((a) => {
                    const id = a.id || a.label;
                    const checked = roomForm.amenities.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-colors" style={{ background: checked ? "#f97316" : "#ffffff", borderColor: checked ? "#f97316" : "#f4ebd9", color: checked ? "#ffffff" : "#334155" }}>
                        <input type="checkbox" className="hidden" checked={checked} onChange={(e) => {
                          if (e.target.checked) setRoomForm({ ...roomForm, amenities: [...roomForm.amenities, id] });
                          else setRoomForm({ ...roomForm, amenities: roomForm.amenities.filter(item => item !== id) });
                        }} />
                        <span className="text-xs font-bold truncate">{a.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hình ảnh (URL, mỗi dòng 1 link)</label>
                <textarea rows={3} value={roomForm.imagesText} onChange={(e) => setRoomForm({ ...roomForm, imagesText: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 resize-none bg-white"
                  style={{ borderColor: "#f4ebd9" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả phòng</label>
                <textarea rows={4} value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 resize-none bg-white"
                  style={{ borderColor: "#f4ebd9" }}
                />
              </div>
            </form>
            <div className="px-8 py-5 border-t flex items-center justify-end gap-3" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
              <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Hủy
              </button>
              <button type="submit" disabled={isSavingRoom} className="px-6 py-2.5 rounded-lg text-white font-bold shadow-md disabled:opacity-50" style={{ background: "#f97316" }}>
                {isSavingRoom ? "Đang lưu..." : (editingRoom ? "Cập nhật phòng" : "Tạo phòng mới")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-2xl text-center space-y-6 border" style={{ borderColor: "#f4ebd9" }}>
            <h3 className="font-black text-2xl text-slate-900">Xác nhận xóa</h3>
            <p className="text-sm font-medium text-slate-600">
              Bạn có chắc chắn muốn xóa phòng <strong className="text-slate-900">"{deleteConfirmRoom.title}"</strong>?<br/>Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setDeleteConfirmRoom(null)} className="flex-1 py-3 rounded-lg text-slate-700 font-bold" style={{ background: "#f4ebd9" }}>
                Giữ lại
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-lg bg-rose-600 text-white font-bold shadow-md hover:bg-rose-700">
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL QUICK ACTION ── */}
      {isQuickActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: "#f4ebd9" }}>
              <h3 className="font-black text-xl text-slate-900">{editingQuickAction ? "Sửa nút Truy cập nhanh" : "Tạo nút Truy cập nhanh"}</h3>
              <button onClick={() => setIsQuickActionModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Đóng ✕</button>
            </div>
            <form onSubmit={handleSaveQuickActionModal} className="p-8 space-y-6 overflow-y-auto flex-1">
              {[
                { label: "Nhãn nút (Label) *", key: "label" },
                { label: "Mô tả ngắn", key: "desc" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                  <input type="text" required={key === "label"} value={quickActionForm[key]} onChange={(e) => setQuickActionForm({ ...quickActionForm, [key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                    style={{ borderColor: "#f4ebd9" }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hành động khi nhấn *</label>
                <select value={quickActionForm.action} onChange={(e) => setQuickActionForm({ ...quickActionForm, action: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white"
                  style={{ borderColor: "#f4ebd9" }}
                >
                  <option value="explore">Xem danh sách phòng</option>
                  <option value="quiz">Mở Quiz trắc nghiệm</option>
                  <option value="logistics">Bảng tính cước xe</option>
                  <option value="pass">Form chuyển nhượng</option>
                  <option value="safe">Form kiểm duyệt Safe</option>
                  <option value="custom">Tùy chỉnh khác</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
                <span className="text-sm font-bold text-slate-900">Hiển thị cho sinh viên</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={quickActionForm.enabled} onChange={(e) => setQuickActionForm({ ...quickActionForm, enabled: e.target.checked })} className="w-5 h-5 rounded" style={{ accentColor: "#f97316" }} />
                  <span className="text-sm font-bold text-slate-700">Bật</span>
                </label>
              </div>
            </form>
            <div className="px-8 py-5 border-t flex items-center justify-end gap-3" style={{ background: "#fdfbf7", borderColor: "#f4ebd9" }}>
              <button type="button" onClick={() => setIsQuickActionModalOpen(false)} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 hover:text-slate-900">
                Hủy
              </button>
              <button type="submit" onClick={handleSaveQuickActionModal} className="px-6 py-2.5 rounded-lg text-white font-bold shadow-md" style={{ background: "#f97316" }}>
                {editingQuickAction ? "Lưu cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST MODALS ── */}
      <RoommateQuiz open={testQuizOpen} onClose={() => setTestQuizOpen(false)} onComplete={() => { setTestQuizOpen(false); showToast("Đã hoàn thành khảo sát!"); }} />
      <LogisticsCalculator open={testLogisticsOpen} onClose={() => setTestLogisticsOpen(false)} />
      <PassRoomDialog open={testPassOpen} onClose={() => setTestPassOpen(false)} onBoost={() => { setTestPassOpen(false); showToast("Đã gửi yêu cầu Pass!"); }} />
      <SafeListingModal open={testSafeOpen} onClose={() => setTestSafeOpen(false)} onSafe={() => { setTestSafeOpen(false); showToast("Đã duyệt Safe!"); }} />

    </div>
  );
}

