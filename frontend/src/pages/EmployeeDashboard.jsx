import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Home as HomeIcon, Users, FileText, Receipt,
  MessageSquare, Star, Settings, Plus, Search, MapPin, CheckCircle,
  Clock, Edit2, Trash2, X, Eye, EyeOff, FileCheck, Info, Building2, ArrowLeft,
  Calendar, Phone, RefreshCw, AlertCircle, Check, UploadCloud, Image as ImageIcon,
  Sparkles, Loader2
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

const SAMPLE_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80"
];

const AddRoomModal = ({ open, onClose, user, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);

  const initialForm = {
    title: "",
    price: "",
    area_sqm: 20,
    campus: "ĐH Cần Thơ",
    address: "",
    contactPhone: user?.phone || "",
    room_type: "Phòng trọ khép kín",
    description: "",
    amenities: ["Máy lạnh", "Gác lửng"],
    soundproof: false,
    petAllowed: false,
    curfewType: "tu_do",
    electricityCostType: "nha_nuoc",
    waterCost: "Theo giá nhà nước",
    internetFee: 50000,
    trashFee: 20000,
    hasSeparateMeter: true,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setStep(1);
      setImages([]);
      setUrlInput("");
      setForm({
        ...initialForm,
        contactPhone: user?.phone || ""
      });
    }
  }, [open, user]);

  if (!open) return null;

  // Xử lý nạp ảnh từ File input
  const processImageFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      alert("Vui lòng chọn tệp định dạng hình ảnh (.jpg, .png, .webp)!");
      return;
    }

    const remainingSlots = 10 - images.length;
    if (remainingSlots <= 0) {
      alert("Bạn đã chọn đủ tối đa 10 ảnh cho phòng này!");
      return;
    }

    const filesToRead = validFiles.slice(0, remainingSlots);
    filesToRead.forEach(file => {
      // Giới hạn 6MB mỗi file
      if (file.size > 6 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" quá lớn (>6MB). Vui lòng chọn ảnh dung lượng nhỏ hơn.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, reader.result];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      alert("Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    if (images.length >= 10) {
      alert("Đã đạt giới hạn tối đa 10 ảnh!");
      return;
    }
    setImages(prev => [...prev, trimmed]);
    setUrlInput("");
  };

  const handleUseSamplePhotos = () => {
    setImages(SAMPLE_ROOM_IMAGES);
  };

  const toggleAmenity = (item) => {
    setForm(prev => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== item) 
          : [...prev.amenities, item]
      };
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.title.trim()) {
        alert("Vui lòng nhập Tên phòng / Tiêu đề!");
        return;
      }
      if (!form.price || Number(form.price) <= 0) {
        alert("Vui lòng nhập Giá phòng hợp lệ (VNĐ/tháng)!");
        return;
      }
      if (!form.address.trim()) {
        alert("Vui lòng nhập Địa chỉ cụ thể của phòng trọ (Số nhà, hẻm, tên đường, phường/xã)!");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmitRoom = async () => {
    setSubmitting(true);
    try {
      const finalImages = images.length > 0 ? images : [SAMPLE_ROOM_IMAGES[0]];
      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        area_sqm: Number(form.area_sqm) || 20,
        campus: form.campus || "ĐH Cần Thơ",
        address: form.address.trim(),
        location: form.address.trim(),
        contactPhone: user?.phone || form.contactPhone.trim() || "0901234567",
        room_type: form.room_type || "Phòng trọ khép kín",
        description: form.description.trim() || "Phòng trọ mới sạch sẽ, an ninh tốt, giờ giấc tự do.",
        amenities: form.amenities,
        soundproof: form.soundproof,
        petAllowed: form.petAllowed,
        curfewType: form.curfewType,
        electricityCostType: form.electricityCostType,
        waterCost: form.waterCost,
        extraFees: {
          wifi: Number(form.internetFee) || 0,
          trash: Number(form.trashFee) || 0,
          parking: 0
        },
        hasSeparateMeter: form.hasSeparateMeter,
        images: finalImages,
        image_url: finalImages[0],
        status: "available",
        listingType: "standard"
      };

      await base44.entities.Room.create(payload);
      alert(`🎉 Đã thêm phòng "${payload.title}" thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi khi thêm phòng:", err);
      alert("Lỗi khi đăng tin phòng: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span>Thêm phòng mới</span>
            <span className="text-[#f97316] bg-orange-100/70 text-xs px-2.5 py-1 rounded-full font-bold">
              Bước {step}/5
            </span>
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200/80 rounded-full transition text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
          
          {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base">1. Thông tin cơ bản</h4>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tên phòng / Tiêu đề <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                  placeholder="Ví dụ: Mini house cao cấp gần ĐH Cần Thơ, Phòng ban công..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Giá thuê (VNĐ/tháng) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="Ví dụ: 2500000" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Diện tích (m²)</label>
                  <input 
                    type="number" 
                    value={form.area_sqm}
                    onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="20" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trường / Khu vực gần nhất</label>
                  <select 
                    value={form.campus}
                    onChange={(e) => setForm({ ...form, campus: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium"
                  >
                    <option value="ĐH Cần Thơ">ĐH Cần Thơ (Khu 2 - 3 Tháng 2)</option>
                    <option value="ĐH FPT">ĐH FPT Cần Thơ (An Bình)</option>
                    <option value="ĐH Y Dược Cần Thơ">ĐH Y Dược Cần Thơ</option>
                    <option value="ĐH Nam Cần Thơ">ĐH Nam Cần Thơ</option>
                    <option value="Cao đẳng Cần Thơ">Cao đẳng Cần Thơ</option>
                    <option value="Ninh Kiều">Trung tâm Ninh Kiều</option>
                    <option value="Cái Răng">Khu vực Cái Răng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại hình phòng</label>
                  <select 
                    value={form.room_type}
                    onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium"
                  >
                    <option value="Phòng trọ khép kín">Phòng trọ khép kín</option>
                    <option value="Mini house / Studio">Mini house / Studio</option>
                    <option value="Ký túc xá / Homestay">Ký túc xá / Homestay</option>
                    <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Địa chỉ cụ thể <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                  placeholder="Ví dụ: Hẻm 51 đường 3 Tháng 2, P. Xuân Khánh, Ninh Kiều" 
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Bắt buộc nhập chính xác địa chỉ từng khu/nhà trọ để sinh viên định vị và đặt lịch hẹn xem phòng.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/70 text-xs text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-[#f97316]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Số điện thoại liên hệ: <span className="text-[#f97316] font-bold">{user?.phone || "Đã xác thực theo tài khoản"}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống tự động sử dụng số điện thoại đã xác minh của tài khoản bạn, không cần nhập lại.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* BƯỚC 2: TIỆN NGHI & TÙY CHỌN */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base">2. Tiện nghi & Tùy chọn</h4>
              <p className="text-xs text-slate-500">Chọn các trang thiết bị đã có sẵn trong phòng để sinh viên dễ tìm kiếm:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  "Máy lạnh", "Gác lửng", "Tủ lạnh", "Máy giặt", "Nước nóng", 
                  "Tủ quần áo", "Ban công", "Bếp riêng", "Khóa vân tay"
                ].map(a => {
                  const isChecked = form.amenities.includes(a);
                  return (
                    <label 
                      key={a} 
                      onClick={() => toggleAmenity(a)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all",
                        isChecked 
                          ? "bg-orange-50 border-[#f97316] text-[#ea580c] shadow-xs" 
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} // handled by label onClick
                        className="w-4 h-4 rounded text-[#f97316]" 
                        style={{ accentColor: "#f97316" }} 
                      />
                      <span className="text-sm font-semibold">{a}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Phòng cách âm</span>
                    <span className="text-xs text-slate-500">Tường dày, cửa cách âm giúp sinh viên yên tĩnh học tập</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.soundproof}
                    onChange={(e) => setForm({ ...form, soundproof: e.target.checked })}
                    className="w-5 h-5 rounded" 
                    style={{ accentColor: "#f97316" }} 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Giờ giấc tự do (Không chung chủ)</span>
                    <span className="text-xs text-slate-500">Sinh viên có chìa khóa cổng hoặc vân tay riêng</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.curfewType === "tu_do"}
                    onChange={(e) => setForm({ ...form, curfewType: e.target.checked ? "tu_do" : "co_gio_gioi_nghiem" })}
                    className="w-5 h-5 rounded" 
                    style={{ accentColor: "#f97316" }} 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Cho phép nuôi thú cưng</span>
                    <span className="text-xs text-slate-500">Chấp nhận sinh viên nuôi mèo hoặc chó nhỏ</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.petAllowed}
                    onChange={(e) => setForm({ ...form, petAllowed: e.target.checked })}
                    className="w-5 h-5 rounded" 
                    style={{ accentColor: "#f97316" }} 
                  />
                </label>
              </div>
            </div>
          )}

          {/* BƯỚC 3: CHI PHÍ SINH HOẠT */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base">3. Chi phí sinh hoạt (Minh bạch không phụ phí ẩn)</h4>
              <p className="text-xs text-slate-500">SmartStay cam kết minh bạch chi phí để bảo vệ cả người thuê lẫn uy tín chủ trọ.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cách tính tiền điện</label>
                  <select 
                    value={form.electricityCostType}
                    onChange={(e) => setForm({ ...form, electricityCostType: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium"
                  >
                    <option value="nha_nuoc">Theo giá nhà nước (EVN)</option>
                    <option value="kinh_doanh">Theo biểu giá 3.500đ / kWh</option>
                    <option value="gia_co_dinh">Theo biểu giá 4.000đ / kWh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cách tính tiền nước</label>
                  <select 
                    value={form.waterCost}
                    onChange={(e) => setForm({ ...form, waterCost: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium"
                  >
                    <option value="Theo giá nhà nước">Theo giá nước sạch nhà nước</option>
                    <option value="15.000 VNĐ/khối">15.000 VNĐ / khối (m³)</option>
                    <option value="20.000 VNĐ/khối">20.000 VNĐ / khối (m³)</option>
                    <option value="50.000 VNĐ/người">50.000 VNĐ / người / tháng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internet / Wifi (VNĐ/tháng)</label>
                  <input 
                    type="number" 
                    value={form.internetFee}
                    onChange={(e) => setForm({ ...form, internetFee: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="50000 (0 nếu miễn phí)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiền rác & Vệ sinh (VNĐ/tháng)</label>
                  <input 
                    type="number" 
                    value={form.trashFee}
                    onChange={(e) => setForm({ ...form, trashFee: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="20000"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.hasSeparateMeter}
                    onChange={(e) => setForm({ ...form, hasSeparateMeter: e.target.checked })}
                    className="w-4 h-4 rounded text-[#f97316]" 
                    style={{ accentColor: "#f97316" }} 
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Đồng hồ điện & nước riêng từng phòng</span>
                    <span className="text-xs text-slate-500">Giúp phòng đạt tiêu chuẩn minh bạch và sinh viên an tâm thuê</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* BƯỚC 4: HÌNH ẢNH PHÒNG (INTERACTIVE DROPZONE & CLICK-TO-UPLOAD) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">4. Hình ảnh phòng</h4>
                  <p className="text-xs text-slate-500">Hình ảnh thực tế giúp phòng thu hút hơn 80% lượt xem.</p>
                </div>
                {images.length > 0 && (
                  <span className="text-xs font-bold text-[#f97316] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    {images.length}/10 ảnh
                  </span>
                )}
              </div>

              {/* Input File ẩn kết nối trực tiếp với Dropzone */}
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/png,image/jpeg,image/webp,image/jpg" 
                className="hidden" 
                onChange={handleFileSelect} 
              />

              {/* VÙNG KÉO THẢ & CLICK ĐỂ CHỌN ẢNH */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none group relative",
                  isDragging 
                    ? "border-[#f97316] bg-orange-50/70 scale-[1.01] shadow-md" 
                    : "border-slate-300 hover:border-[#f97316] bg-white hover:bg-orange-50/20"
                )}
              >
                <div className="w-14 h-14 rounded-full bg-[#f97316]/10 group-hover:bg-[#f97316]/20 flex items-center justify-center mb-3 transition group-hover:scale-110">
                  <UploadCloud className="w-7 h-7 text-[#f97316]" />
                </div>
                <div className="font-bold text-slate-800 text-base group-hover:text-[#f97316] transition">
                  Kéo thả ảnh hoặc click để tải lên
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Tối đa 10 ảnh (.jpg, .png, .webp) · Dung lượng dưới 6MB/ảnh
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f97316] text-white text-xs font-bold shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Chọn ảnh từ thiết bị
                  </span>
                </div>
              </div>

              {/* DANH SÁCH ẢNH ĐÃ CHỌN (PREVIEWS) */}
              {images.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Ảnh đã tải ({images.length}):</span>
                    <button 
                      type="button" 
                      onClick={() => setImages([])}
                      className="text-xs font-semibold text-rose-500 hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs hover:shadow-md transition"
                      >
                        <img 
                          src={img} 
                          alt={`Ảnh phòng ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-[#f97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                            Ảnh chính
                          </span>
                        )}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          title="Xóa ảnh này"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white flex items-center justify-center transition opacity-90 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-xl border border-dashed border-slate-300 hover:border-[#f97316] hover:bg-orange-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-[#f97316] transition text-xs font-bold gap-1"
                      >
                        <Plus className="w-5 h-5" />
                        Thêm ảnh
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DÁN URL HOẶC DÙNG ẢNH MẪU */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="url" 
                    placeholder="Hoặc dán URL ảnh trực tiếp (https://...)" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316]"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddUrl}
                    className="rounded-xl text-xs font-bold text-[#f97316] border-[#f97316] hover:bg-orange-50 shrink-0"
                  >
                    Thêm link
                  </Button>
                </div>

                {images.length === 0 && (
                  <div className="flex justify-center pt-1">
                    <button 
                      type="button" 
                      onClick={handleUseSamplePhotos}
                      className="text-xs text-[#f97316] font-semibold hover:underline flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Thử nghiệm: Nạp 3 ảnh mẫu phòng trọ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BƯỚC 5: XÁC NHẬN & HOÀN TẤT */}
          {step === 5 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-heading font-black text-xl text-slate-900">Hoàn tất thiết lập!</h4>
              <p className="text-sm text-slate-500">Phòng của bạn đã sẵn sàng để đăng lên hệ thống SmartStay.</p>

              {/* Tóm tắt thông tin phòng */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left space-y-3 mt-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{form.title || "Phòng trọ mới"}</h5>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {form.address || form.campus} · {form.area_sqm}m²
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#f97316] text-lg">
                      {Number(form.price || 0).toLocaleString("vi-VN")}đ
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">/tháng</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Hình ảnh:</span> <span className="font-bold text-slate-700">{images.length} ảnh</span></div>
                  <div><span className="text-slate-400">Loại:</span> <span className="font-bold text-slate-700">{form.room_type}</span></div>
                  <div><span className="text-slate-400">Tiện nghi:</span> <span className="font-bold text-slate-700">{form.amenities.length} tiện ích</span></div>
                  <div><span className="text-slate-400">Đồng hồ riêng:</span> <span className="font-bold text-slate-700">{form.hasSeparateMeter ? "Có" : "Không"}</span></div>
                  <div className="col-span-2"><span className="text-slate-400">SĐT liên hệ:</span> <span className="font-bold text-emerald-700">{user?.phone || "Theo tài khoản đã xác minh"}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            disabled={submitting}
            onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="rounded-full font-bold text-slate-600"
          >
            {step === 1 ? "Hủy" : "Quay lại"}
          </Button>
          
          {step < 5 ? (
            <Button 
              onClick={handleNextStep} 
              className="rounded-full font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-8"
            >
              Tiếp tục
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitRoom}
              disabled={submitting}
              className="rounded-full font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-8 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Đang lưu..." : "Đăng tin ngay"}
            </Button>
          )}
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
              <h2 className="font-heading font-black text-lg text-slate-900">Kênh Quản trị <span className="text-[#f97316]">Chủ Trọ</span></h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                {user?.role === "landlord" ? "Chủ nhà trọ" : (user?.role === "admin" ? "Quản trị viên" : "Chủ cơ sở lưu trú")}
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
              
              {/* Revenue Chart */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
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

      <AddRoomModal 
        open={isAddRoomOpen} 
        onClose={() => setAddRoomOpen(false)} 
        user={user}
        onSuccess={loadLandlordData}
      />
    </div>
  );
}
