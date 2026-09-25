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
    <div className="min-h-screen bg-slate-100 flex font-body text-slate-800">
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={cn(
              "px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold",
              toastMessage.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-emerald-600 text-white border-emerald-500"
            )}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Sidebar bên trái */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                SmartStay
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase">
                  Admin
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Hệ thống quản trị Cần Thơ</div>
            </div>
          </div>

          <Link
            to="/"
            className="w-full mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700/60"
          >
            <span className="flex items-center gap-1.5">
              <HomeIcon className="w-3.5 h-3.5 text-emerald-400" />
              Xem trang chủ
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* Menu điều hướng */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Phân hệ Quản trị
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group",
                  active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Admin profile footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.name || "Administrator"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.phone || "0000"} · Quyền Admin
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Khu vực nội dung bên phải */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Admin Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <h1 className="text-sm font-bold text-slate-900 font-display">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRooms}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", loading && "animate-spin")} />
              <span>Làm mới dữ liệu</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đồng bộ thời gian thực
            </span>
          </div>
        </header>

        {/* Nội dung theo từng Tab */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD (TỔNG QUAN)                                  */}
          {/* ============================================================== */}
          {activeTab === "dashboard" && (
            <>
              {/* Header chào mừng */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl md:text-2xl mb-1 flex items-center gap-2">
                    Chào mừng trở lại, {user?.name || "Administrator"}! 👋
                  </h2>
                  <p className="text-slate-300 text-xs md:text-sm font-light">
                    Hệ thống đang quản lý tin đăng trọ sinh viên minh bạch tại khu vực TP. Cần Thơ.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("rooms")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <span>Quản lý tin đăng</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BƯỚC 2: CÁC THẺ SỐ LIỆU TỔNG QUAN (DASHBOARD METRICS) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    Số liệu tổng hợp thời gian thực
                  </h3>
                  <span className="text-xs text-slate-500">
                    Tính toán tự động từ {totalRooms} phòng hiện hữu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Card 1: Tổng số phòng */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">Tổng phòng</span>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-slate-900">
                      {loading ? "..." : totalRooms}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Đang công khai hiển thị</div>
                  </div>

                  {/* Card 2: Safe Badge */}
                  <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-emerald-700">Badge Safe</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-emerald-600">
                      {loading ? "..." : safeRooms}
                    </div>
                    <div className="text-[11px] text-emerald-600/80 mt-1">
                      {totalRooms ? Math.round((safeRooms / totalRooms) * 100) : 0}% tổng tin đăng
                    </div>
                  </div>

                  {/* Card 3: Pass phòng */}
                  <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-amber-700">Đang Pass</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <KeyRound className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-amber-600">
                      {loading ? "..." : passRooms}
                    </div>
                    <div className="text-[11px] text-amber-600/80 mt-1">Sang nhượng cọc</div>
                  </div>

                  {/* Card 4: Tin Lên đầu */}
                  <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-700">Lên đầu (Boost)</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-indigo-600">
                      {loading ? "..." : boostedRooms}
                    </div>
                    <div className="text-[11px] text-indigo-600/80 mt-1">Ưu tiên hiển thị top</div>
                  </div>

                  {/* Card 5: Tìm ghép */}
                  <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-700">Tìm ghép</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="font-display font-extrabold text-2xl text-purple-600">
                      {loading ? "..." : roommateRooms}
                    </div>
                    <div className="text-[11px] text-purple-600/80 mt-1">Nhu cầu ở ghép</div>
                  </div>
                </div>
              </div>

              {/* Bảng phân tích chi tiết & Phòng mới nhất */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột 1: Phân bố theo trường đại học Cần Thơ */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-bold text-slate-900 text-sm">
                      Phân bố theo Trường ĐH
                    </h4>
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="space-y-3">
                    {Object.entries(campusStats).length === 0 ? (
                      <div className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</div>
                    ) : (
                      Object.entries(campusStats).map(([camp, count]) => {
                        const percent = totalRooms ? Math.round((count / totalRooms) * 100) : 0;
                        return (
                          <div key={camp} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700 truncate max-w-[170px]">{camp}</span>
                              <span className="font-bold text-slate-900">
                                {count} phòng ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Cột 2-3: Danh sách phòng mới nhất */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-bold text-slate-900 text-sm">
                      Tin đăng gần đây ({rooms.slice(0, 5).length})
                    </h4>
                    <button
                      onClick={() => setActiveTab("rooms")}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      Quản lý tất cả
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {rooms.slice(0, 5).map((room) => (
                      <div
                        key={room.id || room._id}
                        className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              room.image_url ||
                              (room.images && room.images[0]) ||
                              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
                            }
                            alt={room.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {room.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{room.campus}</span>
                              <span>·</span>
                              <span className="font-semibold text-emerald-700">{Number(room.price || 0).toLocaleString("vi-VN")} đ/tháng</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {room.safe_badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Safe
                            </span>
                          )}
                          {room.is_boosted && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              Lên đầu
                            </span>
                          )}
                          {room.has_pass && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Pass
                            </span>
                          )}
                          {room.seeking_roommate && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              Tìm ghép
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: QUẢN LÝ TIN ĐĂNG / PHÒNG TRỌ (BƯỚC 3 CRUD)              */}
          {/* ============================================================== */}
          {activeTab === "rooms" && (
            <div className="space-y-4">
              {/* Header bar: Search, filters, and Add button */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên phòng, trường, địa chỉ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Filter Badges */}
                  <select
                    value={filterBadge}
                    onChange={(e) => setFilterBadge(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tất cả badge</option>
                    <option value="safe">Badge Safe</option>
                    <option value="pass">Đang Pass phòng</option>
                    <option value="boosted">Lên đầu (Boost)</option>
                    <option value="roommate">Tìm ghép</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenAddRoom}
                  className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm phòng mới</span>
                </button>
              </div>

              {/* Bảng danh sách phòng trọ */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="p-3.5 pl-4">Ảnh</th>
                        <th className="p-3.5">Tên phòng / Địa chỉ</th>
                        <th className="p-3.5">Campus</th>
                        <th className="p-3.5">Giá / tháng</th>
                        <th className="p-3.5">Diện tích</th>
                        <th className="p-3.5">Badges</th>
                        <th className="p-3.5">Rating</th>
                        <th className="p-3.5 text-right pr-4">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400">
                            Không tìm thấy phòng trọ nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((room) => (
                          <tr key={room.id || room._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pl-4">
                              <img
                                src={
                                  room.image_url ||
                                  (room.images && room.images[0]) ||
                                  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
                                }
                                alt={room.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="font-bold text-slate-900 truncate mb-0.5">{room.title}</div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {room.address || room.location}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {room.campus}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-emerald-700">
                              {Number(room.price || 0).toLocaleString("vi-VN")} đ
                            </td>
                            <td className="p-3 text-slate-600">{room.area_sqm || 20} m²</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {room.safe_badge && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                    Safe
                                  </span>
                                )}
                                {room.is_boosted && (
                                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                                    Top
                                  </span>
                                )}
                                {room.has_pass && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                    Pass ({room.pass_months_left || 3}th)
                                  </span>
                                )}
                                {room.seeking_roommate && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                                    Ghép
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                                {(room.rating || room._avgRating || 4.5).toFixed(1)}
                              </span>
                            </td>
                            <td className="p-3 text-right pr-4 space-x-1">
                              <button
                                onClick={() => handleOpenEditRoom(room)}
                                title="Sửa phòng"
                                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmRoom(room)}
                                title="Xóa phòng"
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* ============================================================== */}
          {/* TAB 3: QUẢN LÝ HERO BANNER (BƯỚC 4)                            */}
          {/* ============================================================== */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              {/* Form cài đặt Hero */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">
                      Cấu hình Banner Trang chủ (Hero)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chỉnh sửa tiêu đề, mô tả và các nút kêu gọi hành động (CTA) hiển thị trên cùng trang chủ.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetHero}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Mặc định
                    </button>
                    <button
                      onClick={handleSaveHero}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu thay đổi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tiêu đề (Phần đầu)
                    </label>
                    <input
                      type="text"
                      value={heroForm.title}
                      onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Từ khóa nổi bật (Màu xanh)
                    </label>
                    <input
                      type="text"
                      value={heroForm.highlight}
                      onChange={(e) => setHeroForm({ ...heroForm, highlight: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phần cuối tiêu đề
                    </label>
                    <input
                      type="text"
                      value={heroForm.titleSuffix}
                      onChange={(e) => setHeroForm({ ...heroForm, titleSuffix: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Đoạn văn mô tả (Description)
                  </label>
                  <textarea
                    rows={2}
                    value={heroForm.description}
                    onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 3 Huy hiệu nổi bật */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      3 Huy hiệu tin cậy dưới tiêu đề
                    </span>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroForm.showBadges !== false}
                        onChange={(e) => setHeroForm({ ...heroForm, showBadges: e.target.checked })}
                        className="rounded accent-emerald-600"
                      />
                      Hiển thị hàng huy hiệu
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={heroForm.badge1}
                      onChange={(e) => setHeroForm({ ...heroForm, badge1: e.target.value })}
                      placeholder="Huy hiệu 1"
                      className="px-3 py-2 border rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={heroForm.badge2}
                      onChange={(e) => setHeroForm({ ...heroForm, badge2: e.target.value })}
                      placeholder="Huy hiệu 2"
                      className="px-3 py-2 border rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={heroForm.badge3}
                      onChange={(e) => setHeroForm({ ...heroForm, badge3: e.target.value })}
                      placeholder="Huy hiệu 3"
                      className="px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Tùy chọn 2 nút CTA */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Tùy chọn hiển thị 2 nút CTA ("Đăng tin Safe" / "Tìm bạn ở ghép")
                    </span>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroForm.showCtaButtons || false}
                        onChange={(e) => setHeroForm({ ...heroForm, showCtaButtons: e.target.checked })}
                        className="rounded accent-emerald-600"
                      />
                      Bật nút CTA trong Hero
                    </label>
                  </div>
                  {heroForm.showCtaButtons && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        value={heroForm.ctaSafeText || "Đăng tin Safe"}
                        onChange={(e) => setHeroForm({ ...heroForm, ctaSafeText: e.target.value })}
                        placeholder="Tên nút Đăng tin"
                        className="px-3 py-2 border rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        value={heroForm.ctaQuizText || "Tìm bạn ở ghép"}
                        onChange={(e) => setHeroForm({ ...heroForm, ctaQuizText: e.target.value })}
                        placeholder="Tên nút Tìm ghép"
                        className="px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <div className="flex items-center gap-2 mb-2 font-display font-bold text-sm text-slate-800">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Xem trước thời gian thực (Live Preview)</span>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800">
                  <h1 className="font-display font-extrabold text-xl md:text-2xl mb-2">
                    {heroForm.title}{" "}
                    <span className="text-emerald-400">{heroForm.highlight} </span>
                    {heroForm.titleSuffix}
                  </h1>
                  <p className="text-slate-300 text-xs md:text-sm max-w-2xl mb-4 leading-relaxed">
                    {heroForm.description}
                  </p>
                  {heroForm.showBadges !== false && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      {heroForm.badge1 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {heroForm.badge1}
                        </span>
                      )}
                      {heroForm.badge2 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" /> {heroForm.badge2}
                        </span>
                      )}
                      {heroForm.badge3 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                          <Truck className="w-3.5 h-3.5 text-teal-400" /> {heroForm.badge3}
                        </span>
                      )}
                    </div>
                  )}
                  {heroForm.showCtaButtons && (
                    <div className="flex flex-wrap gap-2.5 mt-4">
                      <span className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                        <ShieldCheck className="w-4 h-4" /> {heroForm.ctaSafeText || "Đăng tin Safe"}
                      </span>
                      <span className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {heroForm.ctaQuizText || "Tìm bạn ở ghép"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: QUẢN LÝ KHU VỰC / CAMPUS (BƯỚC 5)                       */}
          {/* ============================================================== */}
          {activeTab === "campuses" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">
                      Danh mục Khu vực / Campus trường đại học
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Các trường ĐH này sẽ xuất hiện trên thanh bộ lọc trang chủ và biểu mẫu đăng phòng trọ.
                    </p>
                  </div>
                </div>

                {/* Form thêm Campus */}
                <div className="space-y-2 max-w-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tên trường ĐH mới (vd: ĐH Kỹ thuật - Công nghệ Cần Thơ)..."
                      value={newCampus}
                      onChange={(e) => setNewCampus(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCampus();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      onClick={handleAddCampus}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm trường</span>
                    </button>
                  </div>
                  {/* Gợi ý thêm nhanh trường ĐH phổ biến ở Cần Thơ */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold">Gợi ý nhanh:</span>
                    {["ĐH Kỹ thuật - Công nghệ Cần Thơ", "ĐH Tây Đô", "Cao đẳng Cần Thơ", "Cao đẳng Y Tế Cần Thơ"].filter(rec => !campuses.includes(rec)).map((rec) => (
                      <button
                        key={rec}
                        onClick={() => setNewCampus(rec)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors"
                      >
                        + {rec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách các Campus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                  {campuses.map((c) => {
                    const roomCount = c === "Tất cả khu vực" ? totalRooms : (campusStats[c] || 0);
                    const isDefault = c === "Tất cả khu vực";
                    const isEditing = editingCampus === c;

                    return (
                      <div
                        key={c}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
                          isDefault
                            ? "bg-slate-900 text-white border-slate-800 shadow-md"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                isDefault
                                  ? "bg-emerald-500 text-white"
                                  : "bg-emerald-50 border border-emerald-100 text-emerald-600"
                              )}
                            >
                              <GraduationCap className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editCampusText}
                                    onChange={(e) => setEditCampusText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEditCampus(c);
                                      if (e.key === "Escape") setEditingCampus(null);
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded-lg text-slate-900 bg-white"
                                  />
                                  <button
                                    onClick={() => handleSaveEditCampus(c)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Lưu tên"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCampus(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="Hủy"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className={cn(
                                      "text-xs font-bold truncate",
                                      isDefault ? "text-white" : "text-slate-900"
                                    )}
                                  >
                                    {c}
                                  </div>
                                  <div
                                    className={cn(
                                      "text-[11px] mt-0.5",
                                      isDefault ? "text-emerald-400 font-semibold" : "text-slate-500"
                                    )}
                                  >
                                    {isDefault
                                      ? `Toàn hệ thống · ${roomCount} phòng`
                                      : `${roomCount} phòng trọ hiện có`}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white shrink-0">
                              Mặc định
                            </span>
                          )}
                        </div>

                        {/* Thanh nút bấm thao tác trên card */}
                        <div
                          className={cn(
                            "pt-2 border-t flex items-center justify-between text-xs",
                            isDefault ? "border-slate-800" : "border-slate-100"
                          )}
                        >
                          <button
                            onClick={() => {
                              setActiveTab("rooms");
                              setSearchTerm(isDefault ? "" : c);
                              setFilterBadge("all");
                            }}
                            className={cn(
                              "text-[11px] font-semibold flex items-center gap-1 transition-colors",
                              isDefault
                                ? "text-emerald-300 hover:text-white"
                                : "text-emerald-700 hover:text-emerald-800"
                            )}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem danh sách tin</span>
                          </button>

                          {!isDefault && !isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEditCampus(c)}
                                title="Đổi tên trường này"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampus(c)}
                                title="Xóa trường này"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: BỘ LỌC TIỆN NGHI & TOGGLE ĐẶC BIỆT (BƯỚC 5 & 6)          */}
          {/* ============================================================== */}
          {activeTab === "amenities" && (
            <div className="space-y-6">
              {/* PHẦN 1: TIỆN NGHI */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    Danh mục Tiện nghi phòng trọ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thêm hoặc xóa các tiện nghi (Máy lạnh, Máy giặt, Gác lửng, Cách âm...) kèm biểu tượng icon.
                  </p>
                </div>

                {/* Form thêm tiện nghi */}
                <div className="flex flex-wrap items-center gap-2 max-w-lg">
                  <input
                    type="text"
                    placeholder="Tên tiện nghi mới (vd: Ban công thoáng mát)..."
                    value={newAmenityName}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={newAmenityIcon}
                    onChange={(e) => setNewAmenityIcon(e.target.value)}
                    className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAmenity}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </button>
                </div>

                {/* Grid danh sách tiện nghi */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {amenities.map((a) => {
                    const iconItem = AVAILABLE_ICONS.find((ic) => ic.name === a.iconName) || AVAILABLE_ICONS[0];
                    const IconComp = iconItem.icon;
                    return (
                      <div
                        key={a.id || a.label}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between group hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">{a.label}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAmenity(a.id || a.label)}
                          title="Xóa tiện nghi này"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PHẦN 2: TOGGLE ĐẶC BIỆT */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">
                      Quản lý Toggle đặc biệt trên bộ lọc
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bật/tắt hiển thị và đổi nhãn/mô tả của 2 toggle quan trọng ("Phòng cách âm" và "Tìm bạn ở ghép").
                    </p>
                  </div>
                  <button
                    onClick={handleSaveToggles}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu Toggle
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Toggle 1: Phòng cách âm */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <VolumeOff className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-900">Toggle 1: Cách âm</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={specialToggles.soundproof?.enabled !== false}
                          onChange={(e) =>
                            setSpecialToggles({
                              ...specialToggles,
                              soundproof: { ...specialToggles.soundproof, enabled: e.target.checked }
                            })
                          }
                          className="rounded accent-emerald-600"
                        />
                        Hiển thị trên bộ lọc
                      </label>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề Toggle</label>
                      <input
                        type="text"
                        value={specialToggles.soundproof?.title || ""}
                        onChange={(e) =>
                          setSpecialToggles({
                            ...specialToggles,
                            soundproof: { ...specialToggles.soundproof, title: e.target.value }
                          })
                        }
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả phụ</label>
                      <input
                        type="text"
                        value={specialToggles.soundproof?.desc || ""}
                        onChange={(e) =>
                          setSpecialToggles({
                            ...specialToggles,
                            soundproof: { ...specialToggles.soundproof, desc: e.target.value }
                          })
                        }
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Toggle 2: Tìm bạn ở ghép */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-slate-900">Toggle 2: Tìm bạn ở ghép</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={specialToggles.roommate?.enabled !== false}
                          onChange={(e) =>
                            setSpecialToggles({
                              ...specialToggles,
                              roommate: { ...specialToggles.roommate, enabled: e.target.checked }
                            })
                          }
                          className="rounded accent-indigo-600"
                        />
                        Hiển thị trên bộ lọc
                      </label>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề Toggle</label>
                      <input
                        type="text"
                        value={specialToggles.roommate?.title || ""}
                        onChange={(e) =>
                          setSpecialToggles({
                            ...specialToggles,
                            roommate: { ...specialToggles.roommate, title: e.target.value }
                          })
                        }
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả phụ</label>
                      <input
                        type="text"
                        value={specialToggles.roommate?.desc || ""}
                        onChange={(e) =>
                          setSpecialToggles({
                            ...specialToggles,
                            roommate: { ...specialToggles.roommate, desc: e.target.value }
                          })
                        }
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: KHỐI TRUY CẬP NHANH (BƯỚC 6)                            */}
          {/* ============================================================== */}
          {activeTab === "quick-actions" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-display font-bold text-slate-900 text-base">
                        Quản lý Khối "Truy cập nhanh" (Quick Actions)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Nhấp vào bất kỳ mục nào để <strong>chỉnh sửa nội dung</strong>, hoặc bấm <strong>"Chạy thử"</strong> để trải nghiệm trực tiếp tính năng.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleResetQuickActions}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Khôi phục mặc định"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Khôi phục
                    </button>
                    <button
                      onClick={handleOpenAddQuickAction}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm nút mới
                    </button>
                    <button
                      onClick={handleSaveQuickActions}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu danh sách
                    </button>
                  </div>
                </div>

                {/* Live student preview strip */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-slate-200">
                        Xem trước thanh Truy cập nhanh (Trang chủ sinh viên)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 italic">
                      (Bấm vào nút để kiểm tra thao tác)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {quickActions.filter((a) => a.enabled !== false).map((action) => {
                      const iconMap = { Users, Truck, KeyRound, ShieldCheck, Compass, Sparkles, Building2, GraduationCap, MapPin, Phone, Search };
                      const IconComp = iconMap[action.icon] || Compass;
                      return (
                        <button
                          key={"preview-" + action.id}
                          onClick={() => handleTestQuickAction(action)}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all backdrop-blur border border-white/10 hover:border-emerald-400 active:scale-95 group shadow-sm"
                          title={`Bấm để chạy thử tính năng "${action.label}"`}
                        >
                          <IconComp className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
                          <span>{action.label}</span>
                          <Play className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 fill-current" />
                        </button>
                      );
                    })}
                    {quickActions.filter((a) => a.enabled !== false).length === 0 && (
                      <div className="text-xs text-slate-400 italic py-1">
                        (Tất cả các nút đang bị tắt - bật ít nhất 1 nút để hiển thị)
                      </div>
                    )}
                  </div>
                </div>

                {/* Danh sách quản lý các nút */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Danh sách cấu hình chi tiết ({quickActions.length} nút)</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Bấm vào thẻ để sửa nội dung · Bấm "Chạy thử" để kiểm tra tính năng
                    </span>
                  </div>

                  {quickActions.map((action, index) => {
                    const iconMap = { Users, Truck, KeyRound, ShieldCheck, Compass, Sparkles, Building2, GraduationCap, MapPin, Phone, Search };
                    const IconComp = iconMap[action.icon] || Compass;
                    const isEnabled = action.enabled !== false;

                    return (
                      <div
                        key={action.id}
                        onClick={() => handleOpenEditQuickAction(action)}
                        className={cn(
                          "group p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer",
                          isEnabled
                            ? "bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50/20"
                            : "bg-slate-50 border-slate-200/50 opacity-60 hover:opacity-90"
                        )}
                        title="Bấm vào để chỉnh sửa thông tin"
                      >
                        {/* Left: Icon & Label & Desc */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                              action.action === "quiz" ? "bg-indigo-100 text-indigo-700" :
                              action.action === "logistics" ? "bg-teal-100 text-teal-700" :
                              action.action === "safe" ? "bg-emerald-100 text-emerald-700" :
                              action.action === "pass" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-700"
                            )}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                              <span className="group-hover:text-emerald-700 transition-colors font-display text-[13px]">
                                {action.label}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                action: {action.action}
                              </span>
                              {!isEnabled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">
                                  Đang tắt
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {action.desc || "Không có mô tả phụ"}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions (Chạy thử, Sửa, Lên/Xuống, Bật/Tắt, Xóa) */}
                        <div
                          className="flex items-center gap-1.5 flex-wrap self-end sm:self-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Nút Chạy thử */}
                          <button
                            onClick={() => handleTestQuickAction(action)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200 transition-all shadow-xs"
                            title="Bấm để chạy thử hành động này"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Chạy thử</span>
                          </button>

                          {/* Nút Sửa */}
                          <button
                            onClick={() => handleOpenEditQuickAction(action)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            title="Chỉnh sửa thông tin nút"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>

                          {/* Nút Reorder */}
                          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl">
                            <button
                              disabled={index === 0}
                              onClick={() => moveQuickAction(index, -1)}
                              className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 transition-all"
                              title="Di chuyển lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={index === quickActions.length - 1}
                              onClick={() => moveQuickAction(index, 1)}
                              className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 transition-all"
                              title="Di chuyển xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Bật/Tắt trạng thái */}
                          <button
                            onClick={() => toggleQuickActionActive(action.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                              isEnabled
                                ? "bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300"
                            )}
                            title={isEnabled ? "Bấm để tắt" : "Bấm để bật"}
                          >
                            {isEnabled ? "Đang bật" : "Đã tắt"}
                          </button>

                          {/* Nút Xóa */}
                          <button
                            onClick={() => handleDeleteQuickAction(action.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Xóa nút này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL THÊM / SỬA PHÒNG TRỌ (BƯỚC 3)                                  */}
      {/* =================================================================== */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-extrabold text-sm md:text-base">
                  {editingRoom ? "Chỉnh sửa tin đăng phòng trọ" : "Thêm tin đăng phòng trọ mới"}
                </h3>
              </div>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveRoom} className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Tên phòng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tin đăng / Tiêu đề phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phòng trọ cao cấp gần ĐH Cần Thơ Khu 2..."
                  value={roomForm.title}
                  onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Campus & Loại phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khu vực / Campus trường ĐH <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={roomForm.campus}
                    onChange={(e) => setRoomForm({ ...roomForm, campus: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {campuses.filter((c) => c !== "Tất cả khu vực").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại phòng trọ
                  </label>
                  <select
                    value={roomForm.room_type}
                    onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Giá & Diện tích & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá thuê (VNĐ/tháng) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="50000"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diện tích (m²)
                  </label>
                  <input
                    type="number"
                    value={roomForm.area_sqm}
                    onChange={(e) => setRoomForm({ ...roomForm, area_sqm: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Điểm Rating (Sao)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={roomForm.rating}
                    onChange={(e) => setRoomForm({ ...roomForm, rating: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Địa chỉ & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hẻm 51, Đ. 3 Tháng 2, Ninh Kiều, Cần Thơ"
                    value={roomForm.address}
                    onChange={(e) => setRoomForm({ ...roomForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={roomForm.contactPhone}
                    onChange={(e) => setRoomForm({ ...roomForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Badges trạng thái */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="block text-xs font-bold text-slate-800">
                  Huy hiệu trạng thái (Chọn nhiều cùng lúc)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomForm.safe_badge}
                      onChange={(e) => setRoomForm({ ...roomForm, safe_badge: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span className="font-semibold text-emerald-800">Badge Safe</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomForm.is_boosted}
                      onChange={(e) => setRoomForm({ ...roomForm, is_boosted: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-semibold text-indigo-800">Lên đầu (Top)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomForm.seeking_roommate}
                      onChange={(e) => setRoomForm({ ...roomForm, seeking_roommate: e.target.checked })}
                      className="rounded accent-purple-600"
                    />
                    <span className="font-semibold text-purple-800">Tìm ghép</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomForm.has_pass}
                      onChange={(e) => setRoomForm({ ...roomForm, has_pass: e.target.checked })}
                      className="rounded accent-amber-600"
                    />
                    <span className="font-semibold text-amber-800">Pass phòng</span>
                  </label>
                </div>
                {roomForm.has_pass && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-600">Số tháng cọc còn lại:</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={roomForm.pass_months_left}
                      onChange={(e) => setRoomForm({ ...roomForm, pass_months_left: e.target.value })}
                      className="w-20 px-2 py-1 border rounded-lg text-xs"
                    />
                    <span className="text-xs text-slate-500">tháng</span>
                  </div>
                )}
              </div>

              {/* Danh sách Tiện nghi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Danh sách Tiện nghi phòng
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {amenities.map((a) => {
                    const id = a.id || a.label;
                    const checked = roomForm.amenities.includes(id);
                    return (
                      <label
                        key={id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors",
                          checked
                            ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                            : "bg-white border-slate-200 text-slate-600"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoomForm({ ...roomForm, amenities: [...roomForm.amenities, id] });
                            } else {
                              setRoomForm({
                                ...roomForm,
                                amenities: roomForm.amenities.filter((item) => item !== id)
                              });
                            }
                          }}
                          className="rounded accent-emerald-600"
                        />
                        <span>{a.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ảnh URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link ảnh (Dán link URL, mỗi dòng 1 link ảnh)
                </label>
                <textarea
                  rows={2}
                  value={roomForm.imagesText}
                  onChange={(e) => setRoomForm({ ...roomForm, imagesText: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mô tả phòng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết phòng
                </label>
                <textarea
                  rows={3}
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  placeholder="Giờ giấc tự do, có máy giặt, gần trường..."
                  className="w-full px-3.5 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoom}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isSavingRoom ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingRoom ? "Lưu cập nhật" : "Tạo phòng mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DIALOG XÁC NHẬN XÓA PHÒNG                                           */}
      {/* =================================================================== */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-base mb-1">
                Xác nhận xóa tin phòng trọ?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa phòng <strong>"{deleteConfirmRoom.title}"</strong> không? Hành động này sẽ loại bỏ phòng khỏi trang Khám phá.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmRoom(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Không, giữ lại
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-rose-600/20"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL THÊM / SỬA KHỐI TRUY CẬP NHANH (QUICK ACTIONS)                 */}
      {/* =================================================================== */}
      {isQuickActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-extrabold text-sm md:text-base">
                  {editingQuickAction ? "Chỉnh sửa nút thao tác nhanh" : "Thêm nút thao tác nhanh mới"}
                </h3>
              </div>
              <button
                onClick={() => setIsQuickActionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuickActionModal} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Tên nút */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên hiển thị của nút <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickActionForm.label}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, label: e.target.value })}
                  placeholder="Ví dụ: Ghép bạn, Chuyển trọ, Pass phòng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Mô tả phụ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả ngắn gọn
                </label>
                <input
                  type="text"
                  value={quickActionForm.desc}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, desc: e.target.value })}
                  placeholder="Ví dụ: Trắc nghiệm tìm bạn cùng phòng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Hành động khi nhấp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hành động kích hoạt (Action trigger) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={quickActionForm.action}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, action: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="explore">Khám phá: Điều hướng / xem danh sách phòng</option>
                  <option value="quiz">Ghép bạn: Mở Quiz trắc nghiệm tìm bạn ở ghép</option>
                  <option value="logistics">Chuyển trọ: Mở bảng tính cước xe ba gác / tải nhỏ</option>
                  <option value="pass">Pass phòng: Mở form chuyển nhượng cọc trọ</option>
                  <option value="safe">Đăng tin Safe: Mở form đăng tin trọ có kiểm duyệt</option>
                  <option value="custom">Tùy chỉnh khác</option>
                </select>
              </div>

              {/* Chọn Biểu tượng Icon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Biểu tượng (Icon hiển thị)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    { id: "Compass", label: "La bàn", icon: Compass },
                    { id: "Users", label: "Người", icon: Users },
                    { id: "Truck", label: "Xe tải", icon: Truck },
                    { id: "KeyRound", label: "Chìa khóa", icon: KeyRound },
                    { id: "ShieldCheck", label: "Khiên", icon: ShieldCheck },
                    { id: "Sparkles", label: "Lấp lánh", icon: Sparkles },
                    { id: "Building2", label: "Tòa nhà", icon: Building2 },
                    { id: "GraduationCap", label: "Trường", icon: GraduationCap },
                    { id: "MapPin", label: "Vị trí", icon: MapPin },
                    { id: "Phone", label: "Hotline", icon: Phone },
                    { id: "Search", label: "Tìm kiếm", icon: Search },
                  ].map((ic) => {
                    const IconComp = ic.icon;
                    const isSelected = quickActionForm.icon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setQuickActionForm({ ...quickActionForm, icon: ic.id })}
                        className={cn(
                          "p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all",
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trạng thái Bật / Tắt */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Hiển thị cho sinh viên</div>
                  <div className="text-[11px] text-slate-500">Bật để hiển thị nút này trên trang chủ</div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickActionForm({ ...quickActionForm, enabled: !quickActionForm.enabled })}
                  className={cn(
                    "w-11 h-6 rounded-full p-0.5 transition-colors",
                    quickActionForm.enabled ? "bg-emerald-600" : "bg-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white transition-transform",
                      quickActionForm.enabled && "translate-x-5"
                    )}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickActionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingQuickAction ? "Lưu thay đổi" : "Thêm mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CÁC MODAL CHẠY THỬ TÍNH NĂNG TRỰC TIẾP TỪ ADMIN                      */}
      {/* =================================================================== */}
      <RoommateQuiz
        open={testQuizOpen}
        onClose={() => setTestQuizOpen(false)}
        onComplete={() => {
          setTestQuizOpen(false);
          showToast("Đã hoàn thành khảo sát ghép bạn (Chế độ chạy thử admin)!");
        }}
      />
      <LogisticsCalculator
        open={testLogisticsOpen}
        onClose={() => setTestLogisticsOpen(false)}
      />
      <PassRoomDialog
        open={testPassOpen}
        onClose={() => setTestPassOpen(false)}
        onBoost={() => {
          setTestPassOpen(false);
          showToast("Đã gửi yêu cầu Pass phòng (Chế độ chạy thử admin)!");
        }}
      />
      <SafeListingModal
        open={testSafeOpen}
        onClose={() => setTestSafeOpen(false)}
        onSafe={() => {
          setTestSafeOpen(false);
          showToast("Đã hoàn tất kiểm duyệt Safe (Chế độ chạy thử admin)!");
        }}
      />

    </div>
  );
}
