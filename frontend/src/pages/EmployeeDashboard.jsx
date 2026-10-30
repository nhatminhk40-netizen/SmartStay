import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Key, Home as HomeIcon, Users, FileText, Receipt,
  MessageSquare, Star, Settings, Plus, Search, MapPin, CheckCircle,
  Clock, Edit2, Trash2, X, Eye, EyeOff, FileCheck, Info, Building2, ArrowLeft,
  Calendar, Phone, RefreshCw, AlertCircle, Check, UploadCloud, Image as ImageIcon,
  Sparkles, Loader2, AlertTriangle, DoorOpen, Layers, Copy, Camera, ChevronRight, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ContractsManager from "@/components/contracts/ContractsManager";
import InvoiceManager from "@/components/contracts/InvoiceManager";
import LandlordStayManager from "@/components/stay/LandlordStayManager";
import MeterGridManager from "@/components/contracts/MeterGridManager";
import RoomTenantAndMeterModal from "@/components/smartstay/RoomTenantAndMeterModal";
import { base44 } from "@/api/base44Client";

// ── MOCK DATA ──
const mockRooms = [
  {
    id: 1,
    property_name: "Khu trọ Cô Ba (Hẻm 51)",
    room_number: "P.101",
    title: "Phòng trọ ban công thoáng mát",
    address: "Hẻm 51, 3 Tháng 2, Ninh Kiều",
    campus: "ĐH Cần Thơ",
    price: 2500000,
    area: 25,
    status: "Đang thuê",
    views: 120,
    saves: 15,
    safe: true,
    tenant: {
      name: "Nguyễn Văn A",
      phone: "0912 345 678",
      email: "nguyenvana@gmail.com",
      university: "ĐH Cần Thơ (Khoa CNTT)",
      startDate: "01/08/2026",
      endDate: "01/08/2027",
      depositAmount: 2500000,
      notes: "Đã đóng cọc 1 tháng, thanh toán tiền phòng trước ngày 10 hàng tháng."
    },
    electricityCostType: "3.500 đ / kWh",
    waterCost: "15.000 VNĐ / khối (m³)",
    extraFees: { wifi: 50000, trash: 20000 },
    meterHistory: [
      {
        month: 11,
        year: 2026,
        elecOld: 1205,
        elecNew: 1290,
        elecUsage: 85,
        elecCost: 297500,
        waterOld: 86,
        waterNew: 91,
        waterUsage: 5,
        waterCost: 75000,
        roomCost: 2500000,
        wifiCost: 50000,
        trashCost: 20000,
        total: 2942500,
        status: "unpaid",
        dueDate: "10/11/2026"
      },
      {
        month: 10,
        year: 2026,
        elecOld: 1120,
        elecNew: 1205,
        elecUsage: 85,
        elecCost: 297500,
        waterOld: 82,
        waterNew: 86,
        waterUsage: 4,
        waterCost: 60000,
        roomCost: 2500000,
        wifiCost: 50000,
        trashCost: 20000,
        total: 2927500,
        status: "paid",
        paidDate: "05/10/2026"
      },
      {
        month: 9,
        year: 2026,
        elecOld: 1030,
        elecNew: 1120,
        elecUsage: 90,
        elecCost: 315000,
        waterOld: 78,
        waterNew: 82,
        waterUsage: 4,
        waterCost: 60000,
        roomCost: 2500000,
        wifiCost: 50000,
        trashCost: 20000,
        total: 2945000,
        status: "paid",
        paidDate: "04/09/2026"
      }
    ]
  },
  {
    id: 2,
    property_name: "Khu trọ Cô Ba (Hẻm 51)",
    room_number: "P.102",
    title: "Phòng khép kín tầng trệt",
    address: "Hẻm 51, 3 Tháng 2, Ninh Kiều",
    campus: "ĐH Cần Thơ",
    price: 2200000,
    area: 22,
    status: "Trống",
    views: 85,
    saves: 10,
    safe: true,
    tenant: null,
    electricityCostType: "3.500 đ / kWh",
    waterCost: "15.000 VNĐ / khối (m³)",
    extraFees: { wifi: 50000, trash: 20000 },
    meterHistory: []
  },
  {
    id: 3,
    property_name: "Nhà trọ Lê Khải",
    room_number: "P.101",
    title: "Phòng gác lửng đúc kiên cố",
    address: "Khu vực gần ĐH FPT Cần Thơ, Cần Thơ",
    campus: "ĐH FPT Cần Thơ",
    price: 1800000,
    area: 25,
    status: "Trống",
    views: 210,
    saves: 30,
    safe: true,
    tenant: null,
    electricityCostType: "3.500 đ / kWh",
    waterCost: "15.000 VNĐ / khối (m³)",
    extraFees: { wifi: 0, trash: 0 },
    images: [
      "https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0",
      "https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6"
    ],
    image_url: "https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0",
    meterHistory: []
  },
  {
    id: 4,
    property_name: "Nhà trọ Lê Khải",
    room_number: "P.102",
    title: "Phòng trọ gác lửng có máy lạnh",
    address: "Khu vực gần ĐH FPT Cần Thơ, Cần Thơ",
    campus: "ĐH FPT Cần Thơ",
    price: 2000000,
    area: 28,
    status: "Đang thuê",
    views: 180,
    saves: 22,
    safe: true,
    tenant: {
      name: "Trần Văn Nam",
      phone: "0939 123 456",
      email: "nam.tran@gmail.com",
      university: "ĐH FPT Cần Thơ",
      startDate: "15/09/2026",
      endDate: "15/09/2027",
      depositAmount: 2000000,
      notes: "Đã đóng cọc 1 tháng, thanh toán tiền phòng ngày 1 hàng tháng."
    },
    electricityCostType: "3.500 đ / kWh",
    waterCost: "15.000 VNĐ / khối (m³)",
    extraFees: { wifi: 0, trash: 0 },
    images: [
      "https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6",
      "https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0"
    ],
    image_url: "https://lh3.googleusercontent.com/d/1oa_42uRBFDnPV324xoKK9o99Agi2X-O6",
    meterHistory: []
  },
  {
    id: 5,
    property_name: "Nhà trọ Lê Khải",
    room_number: "P.201",
    title: "Phòng ban công thoáng mát lầu 1",
    address: "Khu vực gần ĐH FPT Cần Thơ, Cần Thơ",
    campus: "ĐH FPT Cần Thơ",
    price: 2400000,
    area: 30,
    status: "Trống",
    views: 310,
    saves: 45,
    safe: true,
    tenant: null,
    electricityCostType: "3.500 đ / kWh",
    waterCost: "15.000 VNĐ / khối (m³)",
    extraFees: { wifi: 0, trash: 0 },
    images: [
      "https://lh3.googleusercontent.com/d/1lZdIaZ0_em938DJ4hTinFEcMWO_Hl-Kb",
      "https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0"
    ],
    image_url: "https://lh3.googleusercontent.com/d/1lZdIaZ0_em938DJ4hTinFEcMWO_Hl-Kb",
    meterHistory: []
  }
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

const AddRoomModal = ({ open, onClose, user, onSuccess, editingRoom = null, onSwitchToFastAdd }) => {
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }, 150);
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err) {
      console.warn("Không mở được camera stream, chuyển sang camera file input:", err);
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.85);

    setImages(prev => {
      if (prev.length >= 10) {
        alert("Đã đạt giới hạn tối đa 10 ảnh!");
        return prev;
      }
      return [...prev, photoUrl];
    });

    stopCamera();
  };

  const initialForm = {
    title: "",
    price: "",
    price_min: "",
    price_max: "",
    total_rooms: 8,
    area_sqm: 25,
    campus: "ĐH Cần Thơ",
    address: "",
    contactPhone: user?.phone || "",
    room_type: "Phòng trọ khép kín (WC riêng)",
    description: "",
    amenities: ["Máy lạnh", "Gác lửng"],
    soundproof: false,
    petAllowed: false,
    curfewType: "tu_do", // "tu_do" (không chung chủ) | "chung_chu" (chung chủ)
    electricityCostType: "", // Để trống hoàn toàn, chủ trọ tự nhập
    waterCost: "",           // Để trống hoàn toàn, chủ trọ tự nhập
    waterUnit: "khối",
    internetFee: "",         // Để trống
    trashFee: "",            // Để trống
    hasSeparateMeter: true,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setStep(1);
      setUrlInput("");
      if (editingRoom) {
        // Trích xuất số tiền điện từ dữ liệu cũ (nha_nuoc, kinh_doanh, hoặc số)
        let parsedElec = "3500";
        if (editingRoom.electricityCostType !== undefined && editingRoom.electricityCostType !== null) {
          const rawE = String(editingRoom.electricityCostType).trim();
          if (rawE === "nha_nuoc" || rawE.toLowerCase().includes("nhà nước")) {
            parsedElec = "0";
          } else if (rawE === "kinh_doanh") {
            parsedElec = "3500";
          } else if (rawE === "gia_co_dinh") {
            parsedElec = "4000";
          } else {
            const digits = rawE.replace(/\D/g, "");
            parsedElec = digits || "3500";
          }
        }

        // Trích xuất số tiền nước và đơn vị (khối hoặc người)
        let parsedWater = "15000";
        let parsedWaterUnit = "khối";
        if (editingRoom.waterCost !== undefined && editingRoom.waterCost !== null) {
          const rawW = String(editingRoom.waterCost).trim();
          if (rawW.toLowerCase().includes("người")) {
            parsedWaterUnit = "người";
          }
          if (rawW.toLowerCase().includes("nhà nước")) {
            parsedWater = "0";
          } else {
            const digits = rawW.replace(/\D/g, "");
            parsedWater = digits || "15000";
          }
        }

        setForm({
          title: editingRoom.property_name || editingRoom.title || "",
          price: editingRoom.price || "",
          price_min: editingRoom.price_min || editingRoom.price || "",
          price_max: editingRoom.price_max || editingRoom.price || "",
          total_rooms: editingRoom.total_rooms || 8,
          area_sqm: editingRoom.area_sqm || editingRoom.area || 25,
          campus: editingRoom.campus || "ĐH Cần Thơ",
          address: editingRoom.address || "",
          contactPhone: editingRoom.contactPhone || user?.phone || "",
          room_type: editingRoom.room_type || "Phòng trọ khép kín",
          description: editingRoom.description || "",
          amenities: Array.isArray(editingRoom.amenities) && editingRoom.amenities.length > 0 ? editingRoom.amenities : ["Máy lạnh", "Gác lửng"],
          soundproof: Boolean(editingRoom.soundproof),
          petAllowed: Boolean(editingRoom.petAllowed),
          curfewType: editingRoom.curfewType || "tu_do",
          electricityCostType: parsedElec,
          waterCost: parsedWater,
          waterUnit: parsedWaterUnit,
          internetFee: editingRoom.extraFees?.wifi ?? 50000,
          trashFee: editingRoom.extraFees?.trash ?? 20000,
          hasSeparateMeter: editingRoom.hasSeparateMeter !== false,
        });
        const existingImgs = Array.isArray(editingRoom.images) && editingRoom.images.length > 0
          ? editingRoom.images
          : (editingRoom.image_url ? [editingRoom.image_url] : []);
        setImages(existingImgs);
      } else {
        setImages([]);
        setForm({
          ...initialForm,
          contactPhone: user?.phone || ""
        });
      }
    }
  }, [open, user, editingRoom]);

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
      if (form.price_max && Number(form.price_max) > 0 && Number(form.price_max) < Number(form.price_min || form.price)) {
        alert(`Giá phòng cao nhất (${Number(form.price_max).toLocaleString()} đ) không được nhỏ hơn giá thấp nhất (${Number(form.price_min || form.price).toLocaleString()} đ)!`);
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
      const minP = Number(form.price_min) || Number(form.price);
      const maxP = Number(form.price_max) || Number(form.price);
      const payload = {
        title: form.title.trim(),
        property_name: form.title.trim(),
        room_number: editingRoom?.room_number || "",
        price: minP,
        price_min: minP,
        price_max: maxP,
        total_rooms: Number(form.total_rooms) || 8,
        available_rooms: Number(form.total_rooms) || 8,
        area_sqm: Number(form.area_sqm) || 25,
        campus: form.campus || "ĐH Cần Thơ",
        address: form.address.trim(),
        location: form.address.trim(),
        contactPhone: user?.phone || form.contactPhone.trim() || "0901234567",
        room_type: form.room_type || "Phòng trọ khép kín",
        description: form.description.trim() || `Khu trọ ${form.title.trim()} mới sạch sẽ, an ninh tốt, giờ giấc tự do.`,
        amenities: form.amenities,
        soundproof: form.soundproof,
        petAllowed: form.petAllowed,
        curfewType: form.curfewType,
        electricityCostType: (() => {
          const rawE = String(form.electricityCostType || "").trim();
          const numE = Number(rawE);
          if (rawE === "0" || rawE === "nha_nuoc") return "Theo giá nhà nước (EVN)";
          if (!isNaN(numE) && numE > 0) return `${numE.toLocaleString('vi-VN')} đ / kWh`;
          return rawE || "3.500 đ / kWh";
        })(),
        waterCost: (() => {
          const rawW = String(form.waterCost || "").trim();
          const numW = Number(rawW);
          if (rawW === "0" || rawW.toLowerCase().includes("nhà nước")) return "Theo giá nước sạch nhà nước";
          if (!isNaN(numW) && numW > 0) {
            const unit = form.waterUnit === "người" ? "người / tháng" : "khối (m³)";
            return `${numW.toLocaleString('vi-VN')} VNĐ / ${unit}`;
          }
          return rawW || "15.000 VNĐ / khối (m³)";
        })(),
        extraFees: {
          wifi: Number(form.internetFee) || 0,
          trash: Number(form.trashFee) || 0,
          parking: 0
        },
        hasSeparateMeter: form.hasSeparateMeter,
        images: finalImages,
        image_url: finalImages[0],
        status: editingRoom?.status || "available",
        listingType: "standard"
      };

      const rawId = editingRoom?._id || editingRoom?.id;
      const isMongoId = rawId && /^[0-9a-fA-F]{24}$/.test(String(rawId));
      let savedResult = null;

      if (editingRoom && isMongoId) {
        try {
          const res = await base44.entities.Room.update(rawId, payload);
          savedResult = res?.data || res || { ...payload, id: rawId, _id: rawId };
        } catch (e) {
          console.warn("Backend update error:", e);
          savedResult = { ...payload, id: rawId, _id: rawId };
        }
        alert(`🎉 Đã cập nhật phòng "${payload.title}" thành công!`);
      } else {
        // Nếu là phòng mới HOẶC chỉnh sửa từ phòng mẫu (mock room):
        // Gọi create để tạo phòng thật trên backend gắn với tài khoản chủ trọ này!
        try {
          const res = await base44.entities.Room.create(payload);
          savedResult = res?.data || res || { ...payload, id: rawId || `room_${Date.now()}` };
        } catch (e) {
          console.warn("Backend create fallback:", e);
          savedResult = {
            ...payload,
            id: rawId || `room_${Date.now()}`,
            _id: rawId || `room_${Date.now()}`
          };
        }
        alert(editingRoom ? `🎉 Đã cập nhật phòng "${payload.title}" thành công!` : `🎉 Đã thêm phòng "${payload.title}" thành công!`);
      }

      onSuccess?.(savedResult, editingRoom);
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu phòng:", err);
      alert("Lỗi khi lưu phòng: " + (err.message || "Vui lòng kiểm tra lại"));
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
            <span>{editingRoom ? "Chỉnh sửa thông tin khu trọ" : "Thêm khu trọ ở vị trí mới"}</span>
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

        {/* Step quick navigation tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-bold text-slate-600">
          {[
            { num: 1, label: "Cơ bản" },
            { num: 2, label: "Chi phí & Tiện nghi" },
            { num: 3, label: "Quy định" },
            { num: 4, label: "Hình ảnh" },
            { num: 5, label: "Xác nhận" }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num > step && step === 1 && (!form.title.trim() || !form.price || !form.address.trim())) {
                  alert("Vui lòng hoàn thành Tiêu đề, Giá và Địa chỉ ở bước 1!");
                  return;
                }
                setStep(s.num);
              }}
              className={cn(
                "px-3 py-1 rounded-lg transition shrink-0",
                step === s.num
                  ? "bg-[#f97316] text-white shadow-sm"
                  : step > s.num
                  ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                  : "bg-white text-slate-500 hover:bg-slate-200"
              )}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
          
          {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
          {step === 1 && (
            <div className="space-y-4">
              {/* NHẮC NHỞ BỰ BỰ, ĐẬP THẲNG VÀO MẮT CHỦ TRỌ */}
              {!editingRoom && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[#f97316] text-amber-950 shadow-md animate-in fade-in">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#f97316] text-white flex items-center justify-center shrink-0 shadow-md mt-0.5 animate-pulse">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-heading font-black text-slate-900 text-base">
                          ⚠️ LƯU Ý QUAN TRỌNG TRƯỚC KHI THỰC HIỆN
                        </h4>
                        <span className="text-[11px] bg-orange-100 text-[#f97316] border border-orange-300 px-2 py-0.5 rounded-full font-bold">
                          Chỉ dành cho Cơ sở / Địa chỉ mới
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1.5 leading-relaxed">
                        Biểu mẫu 5 bước này <strong>CHỈ DÙNG KHI BẠN CẦN TẠO MỘT KHU TRỌ MỚI Ở VỊ TRÍ / ĐỊA CHỈ KHÁC</strong> (phải khai báo lại địa chỉ, nội quy và tiện ích riêng).
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        👉 Nếu bạn chỉ muốn <strong>thêm các số phòng (P.101, P.102, P.103...)</strong> vào khu trọ hiện tại để quản lý riêng, vui lòng <strong>KHÔNG CẦN NHẬP FORM NÀY</strong> để tránh mất thời gian!
                      </p>
                      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                        <Button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSwitchToFastAdd?.();
                          }}
                          className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-[#f97316]/25 flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" /> 
                          <span>👉 Chuyển sang: Thêm phòng mới vào khu trọ hiện tại</span>
                        </Button>
                        <span className="text-[11px] text-slate-500 italic">
                          (Hoặc tiếp tục điền nếu đây là cơ sở trọ mới ở địa chỉ khác ⬇️)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-base">1. Thông tin cơ sở trọ</h4>
                <span className="text-xs text-slate-500 font-medium">Khai báo địa chỉ & khoảng giá</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tên nhà trọ / Khu trọ <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                  placeholder="Ví dụ: Nhà trọ Lê Khải, Nhà trọ Cô Ba, Mini house An Bình..." 
                />
              </div>

              {/* Khoảng giá niêm yết cho người thuê (Giá cao nhất người dùng nhập tự do, không tự nhảy) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Giá phòng thấp nhất (VNĐ/tháng) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={form.price_min || form.price}
                    onChange={(e) => setForm({ ...form, price_min: e.target.value, price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="Ví dụ: 1300000" 
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Giá phòng tiêu chuẩn/thấp nhất</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Giá phòng cao nhất (VNĐ/tháng)
                  </label>
                  <input 
                    type="number" 
                    value={form.price_max}
                    onChange={(e) => setForm({ ...form, price_max: e.target.value })}
                    className={cn(
                      "w-full p-3 rounded-xl border bg-white focus:outline-none text-sm font-medium",
                      Number(form.price_max) > 0 && Number(form.price_max) < Number(form.price_min || form.price)
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#f97316]"
                    )}
                    placeholder="Nhập giá phòng cao nhất (tùy chọn)" 
                  />
                  {Number(form.price_max) > 0 && Number(form.price_max) < Number(form.price_min || form.price) ? (
                    <span className="text-[11px] text-rose-500 font-bold mt-1 block">
                      ⚠️ Giá cao nhất không được nhỏ hơn giá thấp nhất ({Number(form.price_min || form.price).toLocaleString()} đ)!
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">Nhập tự do (nếu khu trọ có nhiều mức giá khác nhau)</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tổng số phòng dự kiến</label>
                  <input 
                    type="number" 
                    value={form.total_rooms}
                    onChange={(e) => setForm({ ...form, total_rooms: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="Ví dụ: 8" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Diện tích tiêu chuẩn (m²)</label>
                  <input 
                    type="number" 
                    value={form.area_sqm}
                    onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="25" 
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
                    <option value="Phòng trọ khép kín (WC riêng)">Phòng trọ khép kín (WC riêng)</option>
                    <option value="Phòng trọ có gác lửng">Phòng trọ có gác lửng</option>
                    <option value="Phòng trọ không gác (trệt)">Phòng trọ không gác (trệt)</option>
                    <option value="Mini house / Căn hộ mini">Mini house / Căn hộ mini</option>
                    <option value="Căn hộ Studio cao cấp">Căn hộ Studio cao cấp</option>
                    <option value="Căn hộ dịch vụ (Full tiện nghi)">Căn hộ dịch vụ (Full tiện nghi)</option>
                    <option value="Chung cư / Căn hộ">Chung cư / Căn hộ</option>
                    <option value="Ký túc xá cao cấp / Sleepbox">Ký túc xá cao cấp / Sleepbox</option>
                    <option value="Phòng ở ghép (Shared Room)">Phòng ở ghép (Shared Room)</option>
                    <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                    <option value="Homestay sinh viên / Du lịch">Homestay sinh viên / Du lịch</option>
                    <option value="Phòng trọ chung chủ (ở cùng gia đình chủ)">Phòng trọ chung chủ (ở cùng gia đình chủ)</option>
                    <option value="Mặt bằng kinh doanh kết hợp ở">Mặt bằng kinh doanh kết hợp ở</option>
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
                  Bắt buộc nhập chính xác địa chỉ từng khu/nhà trọ để người thuê định vị và đặt lịch hẹn xem phòng.
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
              <p className="text-xs text-slate-500">Chọn các trang thiết bị đã có sẵn trong phòng để người thuê dễ tìm kiếm:</p>
              
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
                    <span className="text-xs text-slate-500">Tường dày, cửa cách âm giúp người thuê yên tĩnh nghỉ ngơi, làm việc</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.soundproof}
                    onChange={(e) => setForm({ ...form, soundproof: e.target.checked })}
                    className="w-5 h-5 rounded" 
                    style={{ accentColor: "#f97316" }} 
                  />
                </label>

                {/* LỰA CHỌN: KHÔNG CHUNG CHỦ HOẶC CHUNG CHỦ */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Hình thức ở & Giờ giấc:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. KHÔNG CHUNG CHỦ */}
                    <div
                      onClick={() => setForm({ ...form, curfewType: "tu_do" })}
                      className={cn(
                        "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none",
                        form.curfewType === "tu_do"
                          ? "border-[#f97316] bg-orange-50/70 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <DoorOpen className="w-4 h-4 text-[#f97316]" />
                          <span>Không chung chủ</span>
                        </span>
                        <span className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          form.curfewType === "tu_do" ? "border-[#f97316] bg-[#f97316]" : "border-slate-300"
                        )}>
                          {form.curfewType === "tu_do" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Giờ giấc tự do 24/7. Khách có chìa khóa cổng hoặc vân tay riêng.
                      </p>
                    </div>

                    {/* 2. CHUNG CHỦ */}
                    <div
                      onClick={() => setForm({ ...form, curfewType: "chung_chu" })}
                      className={cn(
                        "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none",
                        form.curfewType === "chung_chu"
                          ? "border-[#f97316] bg-orange-50/70 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <HomeIcon className="w-4 h-4 text-blue-600" />
                          <span>Chung chủ (Ở cùng chủ)</span>
                        </span>
                        <span className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          form.curfewType === "chung_chu" ? "border-[#f97316] bg-[#f97316]" : "border-slate-300"
                        )}>
                          {form.curfewType === "chung_chu" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ở cùng nhà chủ. An ninh đảm bảo, có thể có quy định giờ đóng cổng ban đêm.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Cho phép nuôi thú cưng</span>
                    <span className="text-xs text-slate-500">Chấp nhận người thuê nuôi mèo hoặc chó nhỏ</span>
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
              <h4 className="font-bold text-slate-900 text-base">3. Chi phí sinh hoạt (Không phụ phí ẩn)</h4>
              <p className="text-xs text-slate-500">SmartStay cam kết rõ ràng chi phí để bảo vệ cả người thuê lẫn uy tín chủ trọ.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Tiền điện */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Tiền điện (VNĐ / kWh)</label>
                    <span className="text-[11px] text-slate-400">0 = Giá nhà nước EVN</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={form.electricityCostType}
                      onChange={(e) => setForm({ ...form, electricityCostType: e.target.value })}
                      className="w-full p-3 pr-16 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-semibold text-slate-900"
                      placeholder="Nhập giá điện (VD: 3500, 4000 hoặc 0)"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      đ/kWh
                    </span>
                  </div>
                </div>

                {/* 2. Tiền nước */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Tiền nước (VNĐ)</label>
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, waterUnit: "khối" })}
                        className={cn(
                          "px-2 py-0.5 rounded-md transition text-[11px]",
                          form.waterUnit === "khối"
                            ? "bg-white text-orange-600 shadow-sm font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        đ / khối
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, waterUnit: "người" })}
                        className={cn(
                          "px-2 py-0.5 rounded-md transition text-[11px]",
                          form.waterUnit === "người"
                            ? "bg-white text-orange-600 shadow-sm font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        đ / người
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={form.waterCost}
                      onChange={(e) => setForm({ ...form, waterCost: e.target.value })}
                      className="w-full p-3 pr-24 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-semibold text-slate-900"
                      placeholder={form.waterUnit === "người" ? "Nhập giá nước/người (VD: 50000)" : "Nhập giá nước/khối (VD: 15000)"}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      {form.waterUnit === "người" ? "đ/người/tháng" : "đ/khối (m³)"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internet / Wifi (VNĐ/tháng)</label>
                  <input 
                    type="number" 
                    value={form.internetFee}
                    onChange={(e) => setForm({ ...form, internetFee: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="Nhập phí Wifi (VD: 50000, để 0 nếu miễn phí)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiền rác & Vệ sinh (VNĐ/tháng)</label>
                  <input 
                    type="number" 
                    value={form.trashFee}
                    onChange={(e) => setForm({ ...form, trashFee: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#f97316] text-sm font-medium" 
                    placeholder="Nhập phí rác (VD: 20000, để 0 nếu miễn phí)"
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
                    <span className="text-xs text-slate-500">Giúp phòng đạt tiêu chuẩn và người thuê an tâm lựa chọn</span>
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
              {/* Input Chụp ảnh trực tiếp từ Camera điện thoại / thiết bị */}
              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
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
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f97316] text-white text-xs font-bold shadow-sm hover:bg-[#ea580c] transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Chọn ảnh từ thiết bị
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition"
                  >
                    <Camera className="w-3.5 h-3.5" /> Chụp ảnh từ Camera
                  </button>
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
                      <>
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video rounded-xl border border-dashed border-slate-300 hover:border-[#f97316] hover:bg-orange-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-[#f97316] transition text-xs font-bold gap-1"
                        >
                          <Plus className="w-5 h-5" />
                          Thêm tệp
                        </button>
                        <button 
                          type="button" 
                          onClick={startCamera}
                          className="aspect-video rounded-xl border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/30 flex flex-col items-center justify-center text-blue-500 hover:text-blue-700 transition text-xs font-bold gap-1"
                        >
                          <Camera className="w-5 h-5" />
                          Chụp camera
                        </button>
                      </>
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

        {/* Modal kính ngắm Camera trực tiếp */}
        {isCameraActive && (
          <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden p-4 space-y-3 border border-slate-700 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between text-white">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Máy ảnh chụp trực tiếp phòng trọ</span>
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCamera}
                  className="rounded-full text-xs font-bold text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="rounded-full font-bold bg-[#f97316] hover:bg-[#ea580c] text-white text-xs px-6 flex items-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  <Camera className="w-4 h-4" />
                  <span>Chụp ảnh ngay</span>
                </Button>
              </div>
            </div>
          </div>
        )}

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
              {submitting ? "Đang lưu..." : (editingRoom ? "Lưu thay đổi" : "Đăng tin ngay")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── MODAL THÊM PHÒNG MỚI VÀO KHU TRỌ HIỆN CÓ (HOẶC TẠO HÀNG LOẠT) ──
const AddSubRoomModal = ({ open, onClose, user, existingRooms = [], onSuccess, onOpenAddProperty, initialPropertyName }) => {
  const [tab, setTab] = useState("single"); // "single" | "bulk"
  const [submitting, setSubmitting] = useState(false);

  // Nhóm danh sách các khu trọ hiện có của chủ trọ để chọn
  const propertyOptions = React.useMemo(() => {
    const map = new Map();
    existingRooms.forEach(r => {
      const propName = r.property_name || r.title || "Khu trọ hiện tại";
      if (!map.has(propName)) {
        map.set(propName, {
          property_name: propName,
          address: r.address || "Ninh Kiều, Cần Thơ",
          campus: r.campus || "ĐH Cần Thơ",
          electricityCostType: r.electricityCostType || "3.500 đ / kWh",
          waterCost: r.waterCost || "15.000 VNĐ / khối (m³)",
          amenities: r.amenities || ["Máy lạnh", "Gác lửng"],
          image_url: r.image_url || r.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
          price: r.price || 1800000,
          sampleRoom: r
        });
      }
    });
    if (map.size === 0) {
      map.set("Nhà trọ Lê Khải", {
        property_name: "Nhà trọ Lê Khải",
        address: "Khu vực gần ĐH FPT Cần Thơ, Cần Thơ",
        campus: "ĐH FPT Cần Thơ",
        electricityCostType: "3.500 đ / kWh",
        waterCost: "15.000 VNĐ / khối (m³)",
        amenities: ["Gác lửng", "Camera 24/7", "PCCC đạt chuẩn"],
        image_url: "https://lh3.googleusercontent.com/d/1RscDS08IT5hjZKrOlqJyjeySppXuUzq0",
        price: 1800000
      });
    }
    return Array.from(map.values());
  }, [existingRooms]);

  const [selectedPropName, setSelectedPropName] = useState("");

  // Single room states
  const [singleNumber, setSingleNumber] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleArea, setSingleArea] = useState(25);
  const [singleType, setSingleType] = useState("Phòng trọ khép kín");
  const [singleStatus, setSingleStatus] = useState("available");
  const [singleTenantName, setSingleTenantName] = useState("");
  const [singleTenantPhone, setSingleTenantPhone] = useState("");

  // Bulk room states
  const [bulkPrefix, setBulkPrefix] = useState("P.");
  const [bulkFrom, setBulkFrom] = useState(101);
  const [bulkTo, setBulkTo] = useState(105);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkArea, setBulkArea] = useState(25);
  const [bulkType, setBulkType] = useState("Phòng trọ khép kín");

  useEffect(() => {
    if (open) {
      if (propertyOptions.length > 0) {
        const found = initialPropertyName 
          ? propertyOptions.find(p => p.property_name === initialPropertyName)
          : null;
        const defaultProp = found || propertyOptions[0];
        setSelectedPropName(defaultProp.property_name);
        setSinglePrice(String(defaultProp.price || 1800000));
        setBulkPrice(String(defaultProp.price || 1800000));
      }
      setSingleNumber("");
      setSingleStatus("available");
      setSingleTenantName("");
      setSingleTenantPhone("");
    }
  }, [open, propertyOptions, initialPropertyName]);

  if (!open) return null;

  const activeProp = propertyOptions.find(p => p.property_name === selectedPropName) || propertyOptions[0];

  // Tính preview danh sách bulk
  const fromNum = parseInt(bulkFrom, 10) || 101;
  const toNum = parseInt(bulkTo, 10) || 105;
  const bulkCount = Math.max(0, Math.min(20, toNum - fromNum + 1));
  const bulkPreviewList = [];
  if (bulkCount > 0 && bulkCount <= 20) {
    for (let i = fromNum; i <= toNum; i++) {
      bulkPreviewList.push(`${bulkPrefix}${i}`);
    }
  }

  const handleSaveSubRooms = async () => {
    if (!activeProp) return;
    setSubmitting(true);
    try {
      if (tab === "single") {
        if (!singleNumber.trim()) {
          alert("Vui lòng nhập Tên/Số phòng (ví dụ: P.104, Phòng ban công 201)!");
          setSubmitting(false);
          return;
        }
        if (!singlePrice || Number(singlePrice) <= 0) {
          alert("Vui lòng nhập Giá thuê phòng hợp lệ!");
          setSubmitting(false);
          return;
        }

        const payload = {
          property_name: activeProp.property_name,
          room_number: singleNumber.trim(),
          title: `${activeProp.property_name} - ${singleNumber.trim()}`,
          price: Number(singlePrice),
          area_sqm: Number(singleArea) || 25,
          area: Number(singleArea) || 25,
          room_type: singleType,
          status: singleStatus,
          address: activeProp.address,
          location: activeProp.address,
          campus: activeProp.campus,
          contactPhone: user?.phone || "0907297338",
          electricityCostType: activeProp.electricityCostType,
          waterCost: activeProp.waterCost,
          extraFees: activeProp.sampleRoom?.extraFees || { wifi: 0, trash: 0, parking: 0 },
          amenities: activeProp.amenities || ["Gác lửng"],
          images: activeProp.sampleRoom?.images || [activeProp.image_url],
          image_url: activeProp.image_url,
          safe_badge: true,
          isSafeBadge: true,
          listingType: "safe",
          tenant: singleStatus === "rented" && singleTenantName.trim() ? {
            name: singleTenantName.trim(),
            phone: singleTenantPhone.trim(),
            startDate: new Date().toLocaleDateString("vi-VN"),
            depositAmount: Number(singlePrice)
          } : null,
          meterHistory: []
        };

        const createdRoom = await base44.entities.Room.create(payload);
        const savedRoom = createdRoom || { ...payload, _id: `room_${Date.now()}`, id: `room_${Date.now()}` };

        alert(`🎉 Đã thêm thành công phòng "${singleNumber.trim()}" vào khu trọ "${activeProp.property_name}"!`);
        onSuccess?.(savedRoom);
        onClose();
      } else {
        // Bulk mode
        if (fromNum > toNum) {
          alert("Số phòng bắt đầu phải nhỏ hơn hoặc bằng số phòng kết thúc!");
          setSubmitting(false);
          return;
        }
        if (bulkCount > 20) {
          alert("Chỉ được tạo tối đa 20 phòng mỗi lần!");
          setSubmitting(false);
          return;
        }
        if (!bulkPrice || Number(bulkPrice) <= 0) {
          alert("Vui lòng nhập Giá thuê chung cho các phòng!");
          setSubmitting(false);
          return;
        }

        const generatedRooms = [];
        const baseTs = Date.now();
        for (let i = fromNum; i <= toNum; i++) {
          const rNum = `${bulkPrefix}${i}`;
          const rObj = {
            property_name: activeProp.property_name,
            room_number: rNum,
            title: `${activeProp.property_name} - ${rNum}`,
            price: Number(bulkPrice),
            area_sqm: Number(bulkArea) || 25,
            area: Number(bulkArea) || 25,
            room_type: bulkType,
            status: "available",
            address: activeProp.address,
            location: activeProp.address,
            campus: activeProp.campus,
            contactPhone: user?.phone || "0907297338",
            electricityCostType: activeProp.electricityCostType,
            waterCost: activeProp.waterCost,
            extraFees: activeProp.sampleRoom?.extraFees || { wifi: 0, trash: 0, parking: 0 },
            amenities: activeProp.amenities || ["Gác lửng"],
            images: activeProp.sampleRoom?.images || [activeProp.image_url],
            image_url: activeProp.image_url,
            safe_badge: true,
            isSafeBadge: true,
            listingType: "safe",
            tenant: null,
            meterHistory: []
          };
          try {
            const created = await base44.entities.Room.create(rObj);
            generatedRooms.push(created || { ...rObj, _id: `room_${baseTs}_${i}`, id: `room_${baseTs}_${i}` });
          } catch (createErr) {
            console.warn("Lỗi tạo phòng bulk:", createErr);
            generatedRooms.push({ ...rObj, _id: `room_${baseTs}_${i}`, id: `room_${baseTs}_${i}` });
          }
        }

        alert(`🎉 Tuyệt vời! Đã tự động tạo nhanh ${generatedRooms.length} phòng (${bulkPreviewList.join(", ")}) vào khu trọ "${activeProp.property_name}"!`);
        onSuccess?.(generatedRooms);
        onClose();
      }
    } catch (err) {
      alert("Lỗi khi thêm phòng: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <span>Thêm phòng mới vào khu trọ</span>
              <span className="text-emerald-700 bg-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Tiết kiệm thời gian
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thêm số phòng riêng để quản lý khách ở & điện nước (kế thừa tự động địa chỉ)
            </p>
          </div>
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
          
          {/* 1. Chọn khu trọ / cơ sở */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#f97316]" /> Chọn khu trọ cần thêm phòng
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddProperty?.();
                }}
                className="text-xs font-bold text-[#f97316] hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Tạo trọ ở vị trí mới
              </button>
            </div>

            <select
              value={selectedPropName}
              onChange={(e) => {
                const nextVal = e.target.value;
                setSelectedPropName(nextVal);
                const found = propertyOptions.find(p => p.property_name === nextVal);
                if (found) {
                  setSinglePrice(String(found.price || 1800000));
                  setBulkPrice(String(found.price || 1800000));
                }
              }}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:outline-none focus:border-[#f97316]"
            >
              {propertyOptions.map(p => (
                <option key={p.property_name} value={p.property_name}>
                  🏠 {p.property_name} — {p.address}
                </option>
              ))}
            </select>

            {/* Thông tin kế thừa tự động */}
            {activeProp && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kế thừa tự động không cần nhập lại:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                  <div>📍 <strong>Địa chỉ:</strong> {activeProp.address}</div>
                  <div>🎓 <strong>Trường:</strong> {activeProp.campus}</div>
                  <div>⚡ <strong>Điện:</strong> {activeProp.electricityCostType}</div>
                  <div>💧 <strong>Nước:</strong> {activeProp.waterCost}</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Tabs chuyển đổi: 1 Phòng vs Hàng loạt */}
          <div className="flex p-1 bg-slate-200/80 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setTab("single")}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5",
                tab === "single" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <DoorOpen className="w-4 h-4 text-[#f97316]" />
              <span>Thêm 1 phòng đơn lẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("bulk")}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5",
                tab === "bulk" 
                  ? "bg-[#f97316] text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Thêm hàng loạt (Tạo cả dãy phòng)</span>
            </button>
          </div>

          {/* TAB 1: THÊM 1 PHÒNG */}
          {tab === "single" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên / Số phòng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={singleNumber}
                    onChange={(e) => setSingleNumber(e.target.value)}
                    placeholder="Ví dụ: P.104 hoặc Phòng ban công 201"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#f97316]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Dùng để quản lý khách ở & tiền điện nước</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá thuê phòng (VNĐ/tháng) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    placeholder="Ví dụ: 1800000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#f97316] focus:outline-none focus:border-[#f97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={singleArea}
                    onChange={(e) => setSingleArea(e.target.value)}
                    placeholder="25"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kiểu phòng</label>
                  <select
                    value={singleType}
                    onChange={(e) => setSingleType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                  >
                    <option value="Phòng trọ khép kín">Phòng trọ khép kín</option>
                    <option value="Phòng có gác lửng">Phòng có gác lửng</option>
                    <option value="Phòng ban công thoáng">Phòng ban công thoáng</option>
                    <option value="Mini house / Studio">Mini house / Studio</option>
                  </select>
                </div>
              </div>

              {/* Trạng thái phòng ban đầu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Trạng thái phòng hiện tại</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "available", label: "Còn phòng", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                    { id: "rented", label: "Đang cho thuê", color: "border-blue-500 bg-blue-50 text-blue-800" },
                    { id: "repairing", label: "Đang sửa", color: "border-amber-500 bg-amber-50 text-amber-800" }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSingleStatus(st.id)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border-2 transition",
                        singleStatus === st.id ? st.color : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nếu chọn đang thuê: cho nhập nhanh thông tin khách */}
              {singleStatus === "rented" && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thông tin người đang thuê phòng này:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Họ tên người thuê (vd: Nguyễn Văn A)"
                      value={singleTenantName}
                      onChange={(e) => setSingleTenantName(e.target.value)}
                      className="p-2 rounded-lg border border-blue-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Số điện thoại (vd: 0912 345 678)"
                      value={singleTenantPhone}
                      onChange={(e) => setSingleTenantPhone(e.target.value)}
                      className="p-2 rounded-lg border border-blue-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THÊM HÀNG LOẠT (BULK ROOMS) */}
          {tab === "bulk" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                <div>
                  <strong>Giải pháp tạo nhanh:</strong> Phù hợp cho dãy phòng cùng kiểu thiết kế. Hệ thống tự động tạo hàng loạt số phòng trong 1 giây, bạn không cần phải nhập từng phòng một!
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiền tố số phòng</label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="P."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none focus:border-[#f97316]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block text-center">vd: P. hoặc Phòng</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Từ số</label>
                  <input
                    type="number"
                    value={bulkFrom}
                    onChange={(e) => setBulkFrom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none focus:border-[#f97316]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block text-center">vd: 101</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Đến số</label>
                  <input
                    type="number"
                    value={bulkTo}
                    onChange={(e) => setBulkTo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none focus:border-[#f97316]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block text-center">vd: 105</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá thuê chung (VNĐ/tháng) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Ví dụ: 1800000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#f97316] focus:outline-none focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Diện tích mỗi phòng (m²)</label>
                  <input
                    type="number"
                    value={bulkArea}
                    onChange={(e) => setBulkArea(e.target.value)}
                    placeholder="25"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                  />
                </div>
              </div>

              {/* Live Preview các phòng sẽ được tạo */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Xem trước danh sách phòng sẽ tạo:</span>
                  <span className="text-emerald-700 font-black">{bulkPreviewList.length} phòng mới</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {bulkPreviewList.map((pName, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                      <DoorOpen className="w-3 h-3 text-[#f97316]" /> {pName}
                    </span>
                  ))}
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
            onClick={onClose} 
            className="rounded-full font-bold text-slate-600"
          >
            Hủy
          </Button>
          
          <Button 
            onClick={handleSaveSubRooms}
            disabled={submitting}
            className="rounded-full font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-8 flex items-center gap-2 shadow-md shadow-[#f97316]/20"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Đang tạo phòng..." : (tab === "single" ? "Thêm phòng ngay" : `⚡ Tạo ngay ${bulkPreviewList.length} phòng mới`)}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN PAGE COMPONENT ──
// ── MODAL CHỈNH SỬA THÔNG TIN CƠ SỞ / KHU TRỌ ──
const EditPropertyModal = ({ open, onClose, property, onSave }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [campus, setCampus] = useState("ĐH Cần Thơ");
  const [electricityCost, setElectricityCost] = useState("");
  const [waterCost, setWaterCost] = useState("");
  const [waterUnit, setWaterUnit] = useState("khối");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);

  useEffect(() => {
    if (open && property) {
      setName(property.name || "");
      setAddress(property.address || "");
      setCampus(property.campus || "ĐH Cần Thơ");
      
      const rawE = String(property.electricityCostType || "").replace(/\D/g, "");
      setElectricityCost(rawE || "");
      
      const rawW = String(property.waterCost || "");
      setWaterUnit(rawW.includes("người") ? "người" : "khối");
      const digitsW = rawW.replace(/\D/g, "");
      setWaterCost(digitsW || "");

      setImageUrl(property.image_url || "");
      setImages(property.sampleRoom?.images || (property.image_url ? [property.image_url] : []));
    }
  }, [open, property]);

  if (!open || !property) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập Tên khu trọ / Cơ sở!");
      return;
    }
    if (!address.trim()) {
      alert("Vui lòng nhập Địa chỉ cụ thể của khu trọ!");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        oldKey: property.key,
        oldName: property.name,
        oldAddress: property.address,
        newName: name.trim(),
        newAddress: address.trim(),
        newCampus: campus.trim(),
        newElectricityCost: electricityCost.trim() ? `${Number(electricityCost).toLocaleString('vi-VN')} đ / kWh` : property.electricityCostType,
        newWaterCost: waterCost.trim() ? `${Number(waterCost).toLocaleString('vi-VN')} VNĐ / ${waterUnit}` : property.waterCost,
        newImageUrl: images[0] || imageUrl || property.image_url,
        newImages: images.length > 0 ? images : [imageUrl || property.image_url]
      });
      onClose();
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div>
            <h3 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#f97316]" />
              <span>Chỉnh sửa thông tin Cơ sở / Khu trọ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đồng bộ thông tin tên, địa chỉ và chi phí cho toàn bộ {property.total} phòng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200/80 rounded-full transition text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tên cơ sở / Khu trọ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khu trọ Cô Ba, Nhà trọ Lê Khải..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#f97316]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Địa chỉ cụ thể (Số nhà, hẻm, tên đường, phường/xã) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: Hẻm 51, 3 Tháng 2, Ninh Kiều, Cần Thơ"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#f97316]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Gần trường Đại học / Cao đẳng</label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#f97316]"
            >
              <option value="ĐH Cần Thơ">ĐH Cần Thơ</option>
              <option value="ĐH FPT Cần Thơ">ĐH FPT Cần Thơ</option>
              <option value="ĐH Y Dược Cần Thơ">ĐH Y Dược Cần Thơ</option>
              <option value="ĐH Nam Cần Thơ">ĐH Nam Cần Thơ</option>
              <option value="CĐ Cần Thơ">CĐ Cần Thơ</option>
              <option value="Khu vực khác">Khu vực khác</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiền điện (VNĐ/kWh)</label>
              <input
                type="number"
                value={electricityCost}
                onChange={(e) => setElectricityCost(e.target.value)}
                placeholder="VD: 3500 hoặc 4000"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#f97316]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Tiền nước (VNĐ)</label>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setWaterUnit("khối")}
                    className={cn(
                      "px-1.5 py-0.5 rounded",
                      waterUnit === "khối" ? "bg-white text-orange-600 shadow-xs" : "text-slate-500"
                    )}
                  >
                    đ/khối
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterUnit("người")}
                    className={cn(
                      "px-1.5 py-0.5 rounded",
                      waterUnit === "người" ? "bg-white text-orange-600 shadow-xs" : "text-slate-500"
                    )}
                  >
                    đ/người
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={waterCost}
                onChange={(e) => setWaterCost(e.target.value)}
                placeholder={waterUnit === "người" ? "VD: 50000" : "VD: 15000"}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#f97316]"
              />
            </div>
          </div>

          {/* Ảnh khu trọ */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700">Hình ảnh đại diện khu trọ</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                <img
                  src={images[0] || imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}
                  className="w-full h-full object-cover"
                  alt="Ảnh khu trọ"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#f97316] font-bold text-xs flex items-center gap-1 border border-orange-200 transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Đổi ảnh từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center gap-1 border border-blue-200 transition"
                  >
                    <Camera className="w-3.5 h-3.5" /> Chụp camera
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Hoặc dán link ảnh trực tiếp (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#f97316]"
                />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Khi bấm lưu, các thông tin tên khu trọ, địa chỉ và đơn giá sẽ được tự động đồng bộ sang toàn bộ <strong>{property.total} phòng</strong> hiện có thuộc cơ sở này.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="rounded-full text-xs font-bold text-slate-600"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-6 shadow-md shadow-[#f97316]/20"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ── MODAL CHỈNH SỬA THÔNG TIN PHÒNG RIÊNG LẺ (SỐ PHÒNG, GIÁ, NGƯỜI Ở...) ──
const EditRoomModal = ({ open, onClose, room, propertyOptions = [], onSave }) => {
  const [roomNumber, setRoomNumber] = useState("");
  const [title, setTitle] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [isCustomProperty, setIsCustomProperty] = useState(false);
  const [price, setPrice] = useState("");
  const [area, setArea] = useState(25);
  const [roomType, setRoomType] = useState("Phòng trọ khép kín");
  const [status, setStatus] = useState("available");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);

  const AVAILABLE_AMENITIES = [
    "Máy lạnh", "Gác lửng", "Tủ lạnh", "Máy giặt", "Nóng lạnh",
    "Giường nệm", "Tủ quần áo", "Ban công", "Cửa sổ thoáng",
    "Bếp riêng", "Giờ giấc tự do", "Khóa vân tay", "Camera an ninh", "PCCC đạt chuẩn"
  ];

  const ROOM_TYPES = [
    "Phòng trọ khép kín",
    "Mini house / Studio",
    "Ký túc xá / Homestay",
    "Nhà nguyên căn",
    "Phòng ở ghép"
  ];

  useEffect(() => {
    if (open && room) {
      const initialNum = room.room_number || "";
      const initialProp = room.property_name || "";
      setRoomNumber(initialNum);
      setTitle(room.title || (initialProp ? `${initialProp} - ${initialNum}` : initialNum));
      setPropertyName(initialProp);
      setIsCustomProperty(false);
      setPrice(String(room.price || ""));
      setArea(Number(room.area_sqm || room.area || 25));
      setRoomType(room.room_type || "Phòng trọ khép kín");

      const st = room.status === "Trống" ? "available"
        : (room.status === "Đang thuê" ? "rented"
        : (room.status === "Đang sửa" ? "repairing"
        : (room.status || "available")));
      setStatus(st);

      setTenantName(room.tenant?.name || "");
      setTenantPhone(room.tenant?.phone || "");
      setAmenities(Array.isArray(room.amenities) && room.amenities.length > 0
        ? room.amenities
        : ["Máy lạnh", "Gác lửng"]);

      const initialImgs = Array.isArray(room.images) && room.images.length > 0
        ? room.images
        : (room.image_url ? [room.image_url] : []);
      setImages(initialImgs);
      setUrlInput("");
    }
  }, [open, room]);

  if (!open || !room) return null;

  const toggleAmenity = (item) => {
    setAmenities(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      if (file.size > 6 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" quá lớn (>6MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      alert("Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setImages(prev => [...prev, trimmed]);
    setUrlInput("");
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRoomNumberChange = (val) => {
    const oldNum = roomNumber;
    setRoomNumber(val);
    const currentProp = propertyName.trim();
    if (!title || title === oldNum || (currentProp && title === `${currentProp} - ${oldNum}`)) {
      setTitle(currentProp && val.trim() ? `${currentProp} - ${val.trim()}` : val.trim());
    }
  };

  const handleSyncTitle = () => {
    const cleanNum = roomNumber.trim();
    const cleanProp = propertyName.trim();
    if (cleanProp && cleanNum) {
      setTitle(`${cleanProp} - ${cleanNum}`);
    } else if (cleanNum) {
      setTitle(cleanNum);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = roomNumber.trim();
    if (!cleanNum) {
      alert("Vui lòng nhập Tên/Số phòng (ví dụ: P.102, A1, VIP-01)!");
      return;
    }
    if (!price || Number(price) <= 0) {
      alert("Vui lòng nhập Giá phòng hợp lệ (VNĐ/tháng)!");
      return;
    }

    setSubmitting(true);
    try {
      const cleanProp = propertyName.trim();
      const cleanTitle = title.trim() || (cleanProp ? `${cleanProp} - ${cleanNum}` : cleanNum);

      const updatedPayload = {
        ...room,
        room_number: cleanNum,
        title: cleanTitle,
        property_name: cleanProp || room.property_name,
        price: Number(price),
        area_sqm: Number(area) || 25,
        area: Number(area) || 25,
        room_type: roomType,
        status: status,
        amenities: amenities,
        images: images.length > 0 ? images : (room.images || []),
        image_url: images[0] || room.image_url,
        tenant: status === "rented" && tenantName.trim() ? {
          ...(room.tenant || {}),
          name: tenantName.trim(),
          phone: tenantPhone.trim(),
          startDate: room.tenant?.startDate || new Date().toLocaleDateString("vi-VN")
        } : (status === "available" ? null : room.tenant)
      };

      const matchedProp = propertyOptions.find(p => (p.property_name || p.name) === cleanProp);
      if (matchedProp) {
        if (matchedProp.address) {
          updatedPayload.address = matchedProp.address;
          updatedPayload.location = matchedProp.address;
        }
        if (matchedProp.campus) updatedPayload.campus = matchedProp.campus;
      }

      await onSave(updatedPayload);
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu phòng:", err);
      alert("Lỗi khi lưu thông tin phòng: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#f97316]">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-slate-900">
                  Chỉnh sửa thông tin phòng
                </h3>
                {roomNumber && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-600 text-white font-black text-xs shadow-sm">
                    {roomNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật số phòng, tên hiển thị, giá thuê, người ở và tiện nghi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200/80 rounded-full transition text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Định danh phòng */}
          <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-[#f97316]" />
              1. Định danh & Tên gọi phòng
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số phòng / Tên phòng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => handleRoomNumberChange(e.target.value)}
                    placeholder="VD: P.102, A1, VIP-01..."
                    required
                    className="w-full pl-3 pr-3 py-2 rounded-xl border border-orange-200 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mã phòng hiển thị nổi bật trên thẻ (VD: <b>P.102</b>, <b>A1</b>)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Thuộc Cơ sở / Khu trọ
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomProperty(!isCustomProperty)}
                    className="text-[11px] text-[#f97316] hover:underline font-bold"
                  >
                    {isCustomProperty ? "Chọn từ danh sách" : "+ Nhập tên khác"}
                  </button>
                </div>

                {isCustomProperty ? (
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="Nhập tên dãy/khu trọ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white font-medium"
                  />
                ) : (
                  <select
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white font-semibold"
                  >
                    {propertyOptions.map((p, idx) => {
                      const name = p.property_name || p.name;
                      return <option key={idx} value={name}>{name}</option>;
                    })}
                    {propertyName && !propertyOptions.some(p => (p.property_name || p.name) === propertyName) && (
                      <option value={propertyName}>{propertyName}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Tên hiển thị / Tiêu đề đầy đủ
                </label>
                <button
                  type="button"
                  onClick={handleSyncTitle}
                  className="text-[11px] text-[#f97316] hover:underline font-bold flex items-center gap-1"
                  title="Đặt tiêu đề chuẩn dạng [Khu trọ - Số phòng]"
                >
                  <RefreshCw className="w-3 h-3" />
                  Đặt chuẩn [Khu trọ - Số phòng]
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Khu trọ Cô Ba 1 - P.102 hoặc Phòng ban công A1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
              />
            </div>
          </div>

          {/* Section 2: Giá & Loại hình */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giá thuê (VNĐ/tháng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="VD: 2000000"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
              />
              <span className="text-[11px] text-[#f97316] font-bold mt-1 block">
                {price ? `${Number(price).toLocaleString('vi-VN')} đ` : "Chưa nhập"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diện tích (m²)
              </label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="VD: 25"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Loại hình phòng
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white"
              >
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Trạng thái & Khách thuê */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Trạng thái phòng hiện tại
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("available")}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5",
                  status === "available"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                ● Còn phòng
              </button>
              <button
                type="button"
                onClick={() => setStatus("rented")}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5",
                  status === "rented"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                ● Đang thuê
              </button>
              <button
                type="button"
                onClick={() => setStatus("repairing")}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5",
                  status === "repairing"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                ● Đang sửa
              </button>
            </div>

            {status === "rented" && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Họ tên khách thuê
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Số điện thoại khách
                  </label>
                  <input
                    type="text"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="VD: 0912 345 678"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Tiện nghi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tiện nghi & Trang bị phòng
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_AMENITIES.map(a => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      active
                        ? "bg-orange-50 border-orange-300 text-[#ea580c] font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {active ? `✓ ${a}` : `+ ${a}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Hình ảnh phòng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hình ảnh thực tế phòng ({images.length} ảnh)
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={img} alt={`Ảnh ${i+1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 h-8 gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#f97316]" />
                Tải ảnh từ máy
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 h-8 gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-[#f97316]" />
                Chụp từ Camera
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#f97316]"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddUrl}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold h-8 px-3"
              >
                Thêm link
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="rounded-full text-xs font-bold text-slate-600"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-6 shadow-md shadow-[#f97316]/20 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddPropertyOpen, setAddPropertyOpen] = useState(false);
  const [isAddSubRoomOpen, setAddSubRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  // Quản lý Chỉnh sửa Phòng riêng lẻ (P.101, A1...)
  const [editingSingleRoom, setEditingSingleRoom] = useState(null);
  const [isEditRoomOpen, setEditRoomOpen] = useState(false);
  const [selectedDetailRoom, setSelectedDetailRoom] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [passRequests, setPassRequests] = useState([]);

  // Dữ liệu thực tế của Chủ trọ
  const [realRooms, setRealRooms] = useState([]);
  const [loadingLandlord, setLoadingLandlord] = useState(false);
  const [roomFilter, setRoomFilter] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, rented: 0, repairing: 0 });

  // Quản lý cơ sở / khu vực theo địa chỉ (Tránh nhầm lẫn giữa các dãy trọ)
  const [selectedPropertyKey, setSelectedPropertyKey] = useState(null); // null = Danh sách các khu vực, 'key' = Danh sách phòng của khu vực, 'all' = Xem tất cả
  const [targetPropForAddRoom, setTargetPropForAddRoom] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  // Quản lý Sửa & Xóa Cơ sở / Khu trọ
  const [editingProperty, setEditingProperty] = useState(null);
  const [isEditPropertyOpen, setEditPropertyOpen] = useState(false);

  const handleEditProperty = (group) => {
    setEditingProperty(group);
    setEditPropertyOpen(true);
  };

  const handleDeleteProperty = async (group) => {
    if (!group) return;
    const confirmDelete = window.confirm(
      `⚠️ CẢNH BÁO XÓA CƠ SỞ:\n\nBạn có chắc chắn muốn xóa toàn bộ cơ sở "${group.name}"?\n📍 Địa chỉ: ${group.address}\n🚪 Tổng số phòng: ${group.total} phòng\n\nToàn bộ các phòng và lịch sử thuộc khu trọ này sẽ bị gỡ bỏ khỏi hệ thống!`
    );
    if (!confirmDelete) return;

    const targetRoomIds = new Set(group.rooms.map(r => String(r._id || r.id)));
    const userId = user?._id || user?.id || user?.email || "default";

    setRealRooms(prev => {
      const updated = prev.filter(r => !targetRoomIds.has(String(r._id || r.id)));
      saveStoredLandlordRooms(userId, updated);
      return updated;
    });

    if (selectedPropertyKey === group.key) {
      setSelectedPropertyKey(null);
    }

    try {
      for (const r of group.rooms) {
        const rId = r._id || r.id;
        if (rId && /^[0-9a-fA-F]{24}$/.test(String(rId))) {
          base44.entities.Room.delete(rId).catch(err => console.warn(err));
        }
      }
      alert(`Đã xóa thành công cơ sở "${group.name}" cùng toàn bộ ${group.total} phòng!`);
    } catch (err) {
      console.warn("Lỗi xóa cơ sở:", err);
      alert(`Đã xóa cơ sở "${group.name}"!`);
    }
  };

  const handleSavePropertyUpdate = async (updateData) => {
    const { oldKey, oldName, newName, newAddress, newCampus, newElectricityCost, newWaterCost, newImageUrl, newImages } = updateData;
    const userId = user?._id || user?.id || user?.email || "default";

    const targetGroup = propertyGroups.find(g => g.key === oldKey);
    if (!targetGroup) return;

    const targetRoomIds = new Set(targetGroup.rooms.map(r => String(r._id || r.id)));

    setRealRooms(prev => {
      const updated = prev.map(r => {
        const rId = String(r._id || r.id);
        if (targetRoomIds.has(rId)) {
          let updatedTitle = r.title;
          if (r.room_number) {
            updatedTitle = `${newName} - ${r.room_number}`;
          } else if (r.title === oldName) {
            updatedTitle = newName;
          }

          return {
            ...r,
            property_name: newName,
            title: updatedTitle,
            address: newAddress,
            location: newAddress,
            campus: newCampus,
            electricityCostType: newElectricityCost || r.electricityCostType,
            waterCost: newWaterCost || r.waterCost,
            image_url: newImageUrl || r.image_url,
            images: newImages && newImages.length > 0 ? newImages : r.images
          };
        }
        return r;
      });

      saveStoredLandlordRooms(userId, updated);
      return updated;
    });

    const newGroupKey = `${newName}:::${newAddress}`;
    if (selectedPropertyKey === oldKey) {
      setSelectedPropertyKey(newGroupKey);
    }

    try {
      for (const r of targetGroup.rooms) {
        const rId = r._id || r.id;
        if (rId && /^[0-9a-fA-F]{24}$/.test(String(rId))) {
          base44.entities.Room.update(rId, {
            property_name: newName,
            address: newAddress,
            campus: newCampus,
            electricityCostType: newElectricityCost || r.electricityCostType,
            waterCost: newWaterCost || r.waterCost,
            image_url: newImageUrl || r.image_url
          }).catch(err => console.warn(err));
        }
      }
    } catch (err) {
      console.warn("Lỗi sync backend:", err);
    }

    alert(`Đã cập nhật thành công thông tin cơ sở "${newName}" cho ${targetGroup.total} phòng!`);
  };

  // Gom nhóm danh sách phòng theo từng cơ sở / khu vực địa chỉ
  const propertyGroups = React.useMemo(() => {
    const map = new Map();

    (Array.isArray(realRooms) ? realRooms : []).forEach(room => {
      const propName = (room.property_name && room.property_name.trim()) 
        ? room.property_name.trim() 
        : (room.address && room.address.trim()) 
          ? room.address.trim() 
          : (room.title || "Khu trọ hiện tại");

      const address = (room.address && room.address.trim()) ? room.address.trim() : "Chưa cập nhật địa chỉ";
      const groupKey = `${propName}:::${address}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          name: propName,
          address: address,
          campus: room.campus || "ĐH Cần Thơ",
          image_url: room.images?.[0] || room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
          imagesCount: room.images?.length || 1,
          electricityCostType: room.electricityCostType || "Theo công tơ",
          waterCost: room.waterCost || "Theo đồng hồ",
          sampleRoom: room,
          rooms: []
        });
      }

      map.get(groupKey).rooms.push(room);
    });

    return Array.from(map.values()).map(group => {
      const total = group.rooms.length;
      const available = group.rooms.filter(r => r.status === "available" || r.status === "Trống").length;
      const rented = group.rooms.filter(r => r.status === "rented" || r.status === "Đang thuê").length;
      const repairing = group.rooms.filter(r => r.status === "repairing" || r.status === "Đang sửa").length;
      
      const prices = group.rooms.map(r => Number(r.price) || 0).filter(p => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      return {
        ...group,
        total,
        available,
        rented,
        repairing,
        minPrice,
        maxPrice
      };
    });
  }, [realRooms]);

  const selectedGroup = React.useMemo(() => {
    if (!selectedPropertyKey || selectedPropertyKey === "all") return null;
    return propertyGroups.find(g => g.key === selectedPropertyKey) || null;
  }, [propertyGroups, selectedPropertyKey]);

  const filteredPropertyGroups = React.useMemo(() => {
    if (!propertySearch.trim()) return propertyGroups;
    const q = propertySearch.toLowerCase().trim();
    return propertyGroups.filter(g => 
      g.name.toLowerCase().includes(q) || 
      g.address.toLowerCase().includes(q) || 
      g.campus.toLowerCase().includes(q)
    );
  }, [propertyGroups, propertySearch]);

  const handleOpenRoomDetail = (room) => {
    setSelectedDetailRoom(room);
    setDetailModalOpen(true);
  };

  const handleUpdateRoomFromDetail = (updatedRoom) => {
    const userId = user?._id || user?.id || user?.email || "default";
    const targetId = updatedRoom._id || updatedRoom.id;
    setRealRooms(prev => {
      const next = prev.map(r => ((r._id || r.id) === targetId) ? { ...r, ...updatedRoom } : r);
      saveStoredLandlordRooms(userId, next);
      return next;
    });
    setSelectedDetailRoom(updatedRoom);
  };

  const isDemoAccount = user?.email === "chutro@smartstay.vn";

  const getStoredLandlordRooms = (userId) => {
    try {
      const key = `smartstay_landlord_rooms_${userId || "default"}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Nếu không phải tài khoản demo chutro@smartstay.vn, loại bỏ các phòng mẫu có ID số 1, 2, 3 nhưng giữ ID Mongo và ID phòng vừa tạo
          if (!isDemoAccount) {
            return parsed.filter(r => {
              const idStr = String(r._id || r.id || "");
              return /^[0-9a-fA-F]{24}$/.test(idStr) || idStr.startsWith("room_");
            });
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc phòng từ localStorage:", e);
    }
    return null;
  };

  const saveStoredLandlordRooms = (userId, rooms) => {
    try {
      const key = `smartstay_landlord_rooms_${userId || "default"}`;
      localStorage.setItem(key, JSON.stringify(rooms));
    } catch (e) {
      console.warn("Lỗi lưu phòng vào localStorage:", e);
    }
  };

  const loadLandlordData = async () => {
    setLoadingLandlord(true);
    const userId = user?._id || user?.id || user?.email || "default";
    try {
      const [roomsRes, apptsData, statsRes] = await Promise.all([
        base44.entities.Room.myRooms(),
        base44.entities.Appointment.landlordList(),
        base44.entities.Room.landlordStats()
      ]);

      const stored = getStoredLandlordRooms(userId);

      if (isDemoAccount) {
        // Tài khoản demo: Ưu tiên lấy từ stored (đã lưu các thao tác chỉnh sửa/thêm/xóa của người dùng)
        const baseList = (stored && stored.length > 0) ? stored : mockRooms;
        if (roomsRes?.data && roomsRes.data.length > 0) {
          const backendIds = new Set(roomsRes.data.map(r => String(r._id || r.id)));
          const nonBackend = baseList.filter(r => !backendIds.has(String(r._id || r.id)));
          const merged = [...roomsRes.data, ...nonBackend];
          setRealRooms(merged);
          saveStoredLandlordRooms(userId, merged);
        } else {
          setRealRooms(baseList);
          saveStoredLandlordRooms(userId, baseList);
        }
      } else {
        // Tài khoản chủ trọ thật:
        if (roomsRes?.data && roomsRes.data.length > 0) {
          // QUAN TRỌNG: Kết hợp phòng trả về từ backend cùng các phòng mới tạo trong local stored để tránh mất phòng
          const backendIds = new Set(roomsRes.data.map(r => String(r._id || r.id)));
          const extraStored = (stored || []).filter(r => !backendIds.has(String(r._id || r.id)));
          const merged = [...roomsRes.data, ...extraStored];
          setRealRooms(merged);
          saveStoredLandlordRooms(userId, merged);
        } else if (stored && stored.length > 0) {
          setRealRooms(stored);
        } else {
          setRealRooms([]);
          saveStoredLandlordRooms(userId, []);
        }
      }

      // Cách ly lịch hẹn: Chủ trọ mới chưa có phòng và không có SĐT -> tuyệt đối không hiển thị lịch hẹn
      const landlordPhone = user?.phone ? String(user.phone).trim() : null;
      if (!isDemoAccount && (!roomsRes?.data || roomsRes.data.length === 0) && !landlordPhone) {
        setAppointments([]);
      } else {
        setAppointments(apptsData || []);
      }
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      } else if (!isDemoAccount && (!roomsRes?.data || roomsRes.data.length === 0)) {
        setStats({ total: 0, available: 0, rented: 0, repairing: 0 });
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu chủ trọ:", e);
      const stored = getStoredLandlordRooms(userId);
      if (stored && stored.length > 0) {
        setRealRooms(stored);
      } else if (isDemoAccount) {
        setRealRooms(mockRooms);
      } else {
        setRealRooms([]);
      }
    } finally {
      setLoadingLandlord(false);
    }
  };

  useEffect(() => {
    loadLandlordData();
  }, [user]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
      const isAdmin = user?.role === "admin" || user?.role === "employee";
      const uPhone = user?.phone ? String(user.phone).trim() : null;
      const uEmail = user?.email ? user.email.toLowerCase().trim() : null;
      const uId = user?._id || user?.id;
      const myRoomIds = new Set((realRooms || []).map(r => String(r._id || r.id)));

      const filtered = (data || []).filter(r => {
        if (r.status !== "pending_landlord") return false;
        if (isAdmin) return true;
        const matchPhone = uPhone && r.landlordPhone && String(r.landlordPhone).trim() === uPhone;
        const matchEmail = uEmail && r.landlordEmail && r.landlordEmail.toLowerCase().trim() === uEmail;
        const matchOwner = uId && r.owner && String(r.owner) === String(uId);
        const matchRoom = r.roomId && myRoomIds.has(String(r.roomId));
        return matchPhone || matchEmail || matchOwner || matchRoom;
      });
      setPassRequests(filtered);
    } catch (_) {
      setPassRequests([]);
    }
  }, [user, realRooms]);

  const handleOpenAddProperty = () => {
    setEditingRoom(null);
    setAddPropertyOpen(true);
  };

  const handleOpenAddSubRoom = (propName) => {
    if (propName && typeof propName === "string") {
      setTargetPropForAddRoom(propName);
    } else if (selectedPropertyKey && selectedPropertyKey !== "all") {
      const found = propertyGroups.find(g => g.key === selectedPropertyKey);
      if (found) setTargetPropForAddRoom(found.name);
    } else {
      setTargetPropForAddRoom("");
    }
    setAddSubRoomOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingSingleRoom(room);
    setEditRoomOpen(true);
  };

  const handleSaveRoomUpdate = async (updatedRoom) => {
    const rawId = updatedRoom._id || updatedRoom.id;
    const isMongoId = rawId && /^[0-9a-fA-F]{24}$/.test(String(rawId));
    const userId = user?._id || user?.id || user?.email || "default";

    // 1. Cập nhật ngay lập tức trong state realRooms & localStorage
    setRealRooms(prev => {
      const updated = prev.map(r => ((r._id || r.id) === rawId) ? { ...r, ...updatedRoom } : r);
      saveStoredLandlordRooms(userId, updated);
      return updated;
    });

    // 2. Nếu là phòng trên MongoDB, gọi API cập nhật backend
    if (isMongoId) {
      try {
        await base44.entities.Room.update(rawId, updatedRoom);
      } catch (err) {
        console.warn("Backend update error:", err);
      }
    }

    alert(`🎉 Đã cập nhật thành công phòng "${updatedRoom.room_number || updatedRoom.title}"!`);
  };

  const handleRoomSavedSuccess = (savedRoom, oldRoom) => {
    const userId = user?._id || user?.id || user?.email || "default";
    if (savedRoom) {
      setRealRooms(prev => {
        let updated;
        if (oldRoom) {
          const oldId = oldRoom._id || oldRoom.id;
          updated = prev.map(r => ((r._id || r.id) === oldId) ? { ...r, ...savedRoom, id: savedRoom._id || savedRoom.id || oldId } : r);
        } else {
          updated = [savedRoom, ...prev];
        }
        saveStoredLandlordRooms(userId, updated);
        return updated;
      });
    }
    loadLandlordData();
  };

  const handleSubRoomsSavedSuccess = (newRooms) => {
    const userId = user?._id || user?.id || user?.email || "default";
    const toAdd = Array.isArray(newRooms) ? newRooms : [newRooms];
    setRealRooms(prev => {
      const updated = [...toAdd, ...prev];
      saveStoredLandlordRooms(userId, updated);
      return updated;
    });
    if (toAdd.length > 0) {
      const first = toAdd[0];
      const pName = (first.property_name && first.property_name.trim()) || first.title || "";
      const pAddr = (first.address && first.address.trim()) || "";
      if (pName && pAddr && !selectedPropertyKey) {
        setSelectedPropertyKey(`${pName}:::${pAddr}`);
      }
    }
    loadLandlordData();
  };

  const handleDeleteRoom = async (room) => {
    const roomId = room._id || room.id;
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa phòng "${room.title}"?\n\nSau khi xóa, phòng sẽ bị gỡ bỏ khỏi hệ thống quản lý SmartStay.`
    );
    if (!confirmDelete) return;

    const userId = user?._id || user?.id || user?.email || "default";
    setRealRooms(prev => {
      const updated = prev.filter(r => (r._id || r.id) !== roomId);
      saveStoredLandlordRooms(userId, updated);
      return updated;
    });

    try {
      const isMongoId = roomId && /^[0-9a-fA-F]{24}$/.test(String(roomId));
      if (isMongoId) {
        await base44.entities.Room.delete(roomId);
      }
      alert(`Đã xóa phòng "${room.title}" thành công!`);
    } catch (err) {
      console.warn("Lỗi xóa phòng backend:", err);
      alert(`Đã xóa phòng "${room.title}" thành công!`);
    }
  };

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    const userId = user?._id || user?.id || user?.email || "default";
    setRealRooms(prev => {
      const updated = prev.map(r => (r._id === roomId || r.id === roomId) ? { ...r, status: newStatus } : r);
      saveStoredLandlordRooms(userId, updated);
      return updated;
    });

    try {
      const isMongoId = roomId && /^[0-9a-fA-F]{24}$/.test(String(roomId));
      if (isMongoId) {
        await base44.entities.Room.updateAvailability(roomId, newStatus);
      }
    } catch (err) {
      console.warn("Lỗi cập nhật trạng thái backend:", err.message);
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
    { id: "stays", label: "Quản lý Nhận phòng", icon: Key, badge: "Mới" },
    { id: "meter-grid", label: "Chốt điện nước (Excel)", icon: FileSpreadsheet, badge: "Excel" },
    { id: "rooms", label: "Phòng của tôi", icon: HomeIcon },
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
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                      {tab.badge}
                    </span>
                  )}
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
              <span>Xem trang Người thuê</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        
        {/* HEADER AREA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {activeTab === "rooms" && selectedGroup ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
                <button
                  type="button"
                  onClick={() => setSelectedPropertyKey(null)}
                  className="hover:text-[#f97316] flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cơ sở & Khu vực</span>
                </button>
                <span>/</span>
                <span className="text-[#ea580c] font-black">{selectedGroup.name}</span>
              </div>
              <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
                <span>{selectedGroup.name}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c]">
                  {selectedGroup.total} phòng
                </span>
              </h1>
            </div>
          ) : (
            <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
              {activeTab === "rooms" ? "Cơ sở & Khu trọ của tôi" : sidebarTabs.find(t => t.id === activeTab)?.label}
              {activeTab === "rooms" && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {propertyGroups.length} khu vực
                </span>
              )}
            </h1>
          )}

          {activeTab === "rooms" && (
            <div className="flex flex-wrap items-center gap-2.5">
              {selectedGroup && (
                <Button
                  onClick={() => setSelectedPropertyKey(null)}
                  variant="outline"
                  className="rounded-full border-slate-300 hover:border-slate-400 bg-white font-bold text-xs px-4 py-5 text-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Đổi khu vực</span>
                </Button>
              )}

              <Button 
                onClick={() => handleOpenAddSubRoom(selectedGroup?.name)} 
                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-5 py-5 shadow-lg shadow-[#f97316]/20 flex items-center gap-2"
                title="Thêm phòng mới (P.101, P.102...) vào khu trọ"
              >
                <Plus className="w-5 h-5" /> 
                <span>{selectedGroup ? "Thêm phòng vào khu này" : "Thêm phòng mới"}</span>
              </Button>

              <Button 
                onClick={handleOpenAddProperty} 
                variant="outline"
                className="rounded-full border-2 border-slate-300 hover:border-[#f97316] hover:text-[#f97316] bg-white font-bold px-4 py-5 shadow-sm flex items-center gap-2 text-slate-700"
                title="Đăng một khu trọ / cơ sở mới ở vị trí khác"
              >
                <MapPin className="w-4 h-4 text-[#f97316]" /> 
                <span>Thêm trọ vị trí mới</span>
              </Button>
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1">
          {activeTab === "overview" && (() => {
            const totalRoomsCount = stats.total || realRooms.length;
            const availableRoomsCount = stats.available || realRooms.filter(r => r.status === "available" || r.status === "Trống").length;
            const rentedRooms = realRooms.filter(r => r.status === "rented" || r.status === "Đang thuê");
            const rentedRoomsCount = stats.rented || rentedRooms.length;
            const repairingRoomsCount = stats.repairing || realRooms.filter(r => r.status === "repairing" || r.status === "Đang sửa").length;
            const occupancyRate = totalRoomsCount > 0 ? Math.round((rentedRoomsCount / totalRoomsCount) * 100) : 0;
            const estimatedMonthlyRevenue = rentedRooms.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
            const pendingAppointments = appointments.filter(a => a.status === "pending" || a.status === "pending_landlord");
            const curDate = new Date();
            const curMonth = curDate.getMonth() + 1;
            const curYear = curDate.getFullYear();

            return (
              <div className="space-y-6">
                {/* 1. HÀNG 4 THẺ THỐNG KÊ KPI TỔNG QUAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    icon={Building2} 
                    title="Tổng số phòng" 
                    value={totalRoomsCount} 
                    sub={`${propertyGroups.length} cơ sở đang quản lý`} 
                    colorClass="bg-blue-100 text-blue-600" 
                  />
                  <StatCard 
                    icon={Users} 
                    title="Đang cho thuê" 
                    value={rentedRoomsCount} 
                    sub={`Tỷ lệ lấp đầy: ${occupancyRate}%`} 
                    colorClass="bg-indigo-100 text-indigo-600" 
                  />
                  <StatCard 
                    icon={CheckCircle} 
                    title="Phòng còn trống" 
                    value={availableRoomsCount} 
                    sub="Sẵn sàng đón khách mới" 
                    colorClass="bg-emerald-100 text-emerald-600" 
                  />
                  <StatCard 
                    icon={Receipt} 
                    title={`Doanh thu phòng T${curMonth}/${curYear}`} 
                    value={`${estimatedMonthlyRevenue.toLocaleString("vi-VN")}đ`} 
                    sub={`Từ ${rentedRoomsCount} phòng đang thuê`} 
                    colorClass="bg-orange-100 text-[#f97316]" 
                  />
                </div>

                {/* 2. BỐ CỤC 2 CỘT CÂN ĐỐI (ĐÃ BỎ LỐI TẮT, KHÔNG ĐỂ TRỐNG TRƠN) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* ── CỘT TRÁI (2/3): TÌNH TRẠNG VẬN HÀNH & DANH SÁCH CƠ SỞ / KHÁCH THUÊ ── */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Card: Tổng quan Cơ sở & Tỷ lệ lấp đầy */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div>
                          <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#f97316]" />
                            <span>Cơ sở & Khu trọ đang vận hành</span>
                            <span className="text-xs bg-orange-100 text-[#ea580c] font-black px-2 py-0.5 rounded-full">
                              {propertyGroups.length} cơ sở
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tình trạng công suất khai thác và danh sách các dãy trọ
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("rooms")}
                            className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-600 h-8"
                          >
                            Xem tất cả phòng
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleOpenAddProperty}
                            className="rounded-xl text-xs font-bold bg-[#f97316] hover:bg-[#ea580c] text-white h-8 flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm cơ sở</span>
                          </Button>
                        </div>
                      </div>

                      {/* Thanh tiến độ trực quan tỷ lệ lấp đầy */}
                      {totalRoomsCount > 0 && (
                        <div className="mb-5 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">Công suất lấp đầy phòng toàn hệ thống:</span>
                            <span className="font-black text-indigo-600">{occupancyRate}% ({rentedRoomsCount}/{totalRoomsCount} phòng)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-indigo-500 transition-all duration-500" 
                              style={{ width: `${(rentedRoomsCount / totalRoomsCount) * 100}%` }} 
                              title={`Đang thuê: ${rentedRoomsCount} phòng`}
                            />
                            <div 
                              className="bg-emerald-400 transition-all duration-500" 
                              style={{ width: `${(availableRoomsCount / totalRoomsCount) * 100}%` }} 
                              title={`Còn trống: ${availableRoomsCount} phòng`}
                            />
                            <div 
                              className="bg-amber-400 transition-all duration-500" 
                              style={{ width: `${(repairingRoomsCount / totalRoomsCount) * 100}%` }} 
                              title={`Đang sửa: ${repairingRoomsCount} phòng`}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Đang thuê ({rentedRoomsCount})</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Còn trống ({availableRoomsCount})</span>
                            {repairingRoomsCount > 0 && (
                              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Đang sửa ({repairingRoomsCount})</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Danh sách các Cơ sở / Khu trọ */}
                      {propertyGroups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {propertyGroups.map((group) => {
                            const grpOccupancy = group.total > 0 ? Math.round((group.rented / group.total) * 100) : 0;
                            return (
                              <div 
                                key={group.key}
                                onClick={() => {
                                  setSelectedPropertyKey(group.key);
                                  setActiveTab("rooms");
                                }}
                                className="p-4 rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer bg-[#fdfbf7] flex flex-col justify-between group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                    <img 
                                      src={group.image_url} 
                                      alt={group.name} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#f97316] transition-colors">
                                      {group.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                      <span className="truncate">{group.address}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                        {group.rented}/{group.total} đã thuê ({grpOccupancy}%)
                                      </span>
                                      {group.available > 0 && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                                          {group.available} trống
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                                  <span className="text-slate-400">
                                    Giá từ: <b className="text-slate-700">{group.minPrice ? `${group.minPrice.toLocaleString("vi-VN")}đ` : "Thỏa thuận"}</b>
                                  </span>
                                  <span className="font-bold text-[#f97316] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                    <span>Vào quản lý</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* TRẠNG THÁI ONBOARDING THÂN THIỆN: DÀNH CHO TÀI KHOẢN MỚI CHƯA CÓ PHÒNG */
                        <div className="text-center py-8 px-4 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50 rounded-2xl border-2 border-dashed border-orange-200/80">
                          <div className="w-14 h-14 bg-orange-100 text-[#f97316] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <Sparkles className="w-7 h-7" />
                          </div>
                          <h4 className="font-heading font-black text-slate-900 text-lg mb-1">
                            Chào mừng bạn đến với Kênh Quản lý Chủ trọ!
                          </h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                            Bắt đầu quản lý dãy trọ chuyên nghiệp: thêm phòng, chốt số điện nước tự động và gửi hóa đơn Zalo kèm VietQR một chạm.
                          </p>

                          {/* 3 bước khởi tạo */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left mb-6">
                            <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-xs">
                              <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center mb-1.5">1</span>
                              <h5 className="font-bold text-slate-800 text-xs">Tạo cơ sở / khu trọ</h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">Đặt tên dãy trọ & địa chỉ tại Cần Thơ</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-xs">
                              <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center mb-1.5">2</span>
                              <h5 className="font-bold text-slate-800 text-xs">Thêm số phòng & giá</h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">Nhập phòng P.101, A1, VIP và giá thuê</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-xs">
                              <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center mb-1.5">3</span>
                              <h5 className="font-bold text-slate-800 text-xs">Chốt số & Thu tiền</h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">Tự động tính điện nước & xuất mã VietQR</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            onClick={handleOpenAddProperty}
                            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs h-10 px-6 shadow-md gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Tạo cơ sở trọ đầu tiên của bạn</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Card: Danh sách Khách thuê & Phòng đang ở */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                        <div>
                          <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <span>Khách thuê phòng đang lưu trú</span>
                            <span className="text-xs bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-full border border-indigo-200">
                              {rentedRooms.length} phòng đang ở
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Danh sách người thuê thực tế và trạng thái hợp đồng đang hoạt động
                          </p>
                        </div>
                        {rentedRooms.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("stays")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <span>Xác minh lưu trú</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {rentedRooms.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {rentedRooms.slice(0, 5).map(room => (
                            <div key={room._id || room.id} className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                                  {room.room_number || "Phòng"}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs truncate">
                                    {room.tenant?.name || "Khách thuê"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                    <span>SĐT: <b className="text-slate-700">{room.tenant?.phone || "Chưa có"}</b></span>
                                    <span>•</span>
                                    <span>Cơ sở: <b className="text-slate-700">{room.property_name || "Trọ"}</b></span>
                                    <span>•</span>
                                    <span>Giá: <b className="text-orange-600">{Number(room.price || 0).toLocaleString("vi-VN")}đ</b></span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRoomDetail(room)}
                                className="rounded-xl text-xs font-bold border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 h-8 px-3 shrink-0"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1 text-[#f97316]" />
                                Chi tiết
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-medium text-slate-500">Chưa có khách thuê nào đang lưu trú</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Khi có phòng chuyển trạng thái "Đang thuê", thông tin khách sẽ xuất hiện tại đây.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* ── CỘT PHẢI (1/3): LỊCH HẸN MỚI & CHỐT ĐIỆN NƯỚC / HỢP ĐỒNG ── */}
                  <div className="space-y-6">
                    
                    {/* Card: Lịch hẹn xem phòng mới cần duyệt */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9]">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <h3 className="font-heading font-black text-slate-900 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#f97316]" />
                          <span>Lịch hẹn xem phòng ({pendingAppointments.length})</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("requests")}
                          className="text-xs font-bold text-slate-500 hover:text-[#f97316] flex items-center gap-0.5"
                        >
                          <span>Xem tất cả</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {pendingAppointments.length > 0 ? (
                        <div className="space-y-3">
                          {pendingAppointments.slice(0, 3).map(appt => (
                            <div key={appt._id || appt.appointmentCode} className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-black text-slate-900">#{appt.appointmentCode}</span>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                                  Chờ duyệt
                                </span>
                              </div>
                              <p className="font-bold text-slate-800 text-xs truncate">{appt.roomId?.title || "Phòng trọ"}</p>
                              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                                <div>Khách: <b className="text-slate-700">{appt.studentName}</b> ({appt.studentPhone})</div>
                                <div>Hẹn lúc: <b className="text-[#f97316]">{appt.appointmentDate} - {appt.appointmentTime}</b></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                          <p className="text-xs font-semibold text-slate-600">Không có lịch hẹn chờ duyệt</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Yêu cầu xem phòng từ sinh viên sẽ hiển thị tại đây.</p>
                        </div>
                      )}
                    </div>

                    {/* Card: Bảng chốt số điện nước & Dòng tiền tháng này */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#f4ebd9] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-heading font-black text-slate-900 text-sm flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Kỳ thu tiền Tháng {curMonth}/{curYear}</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          Excel 2.0
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Doanh thu phòng dự kiến:</span>
                          <span className="font-bold text-slate-900">{estimatedMonthlyRevenue.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Phòng cần chốt điện nước:</span>
                          <span className="font-bold text-emerald-700">{rentedRoomsCount} phòng đang thuê</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setActiveTab("meter-grid")}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs h-9 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Mở bảng chốt điện nước Excel</span>
                      </Button>
                    </div>

                    {/* Card: Hợp đồng & Cọc an toàn */}
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#f4ebd9]">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Hợp đồng & Cọc phòng</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("contracts")}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          Chi tiết
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Theo dõi tiền cọc giữ chỗ, thời hạn kết thúc hợp đồng và bàn giao hiện trạng phòng minh bạch.
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            );
          })()}

          {activeTab === "rooms" && (
            <div className="space-y-6">

              {/* ════════════════════════════════════════════════════════════════════
                  CHẾ ĐỘ 1: PHÂN CHIA THEO KHU VỰC / CƠ SỞ THEO ĐỊA CHỈ
                  (Bấm vô từng khu vực thì mới mở danh sách phòng để tránh nhầm lẫn)
                 ════════════════════════════════════════════════════════════════════ */}
              {!selectedPropertyKey && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Banner giải thích & Thống kê tổng quan */}
                  <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white p-5 rounded-[24px] border border-orange-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#ea580c]">
                          Quản lý độc lập theo cơ sở
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-lg text-slate-900">
                        Danh sách các khu trọ & dãy phòng theo từng địa chỉ
                      </h3>
                      <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                        Phòng trọ được tự động phân nhóm theo từng địa chỉ & cơ sở. <strong>Bấm vào khu vực cần quản lý</strong> để xem danh sách phòng, người ở và chốt số điện nước riêng biệt, hoàn toàn không bị nhầm lẫn giữa các dãy trọ khác nhau.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPropertyKey("all");
                          setRoomFilter("all");
                          setRoomSearch("");
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-[#f97316] bg-white px-3.5 py-2 rounded-full border border-slate-200 hover:border-[#f97316] transition shadow-xs flex items-center gap-1.5"
                        title="Xem phẳng toàn bộ danh sách phòng của tất cả các dãy"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Xem tất cả ({realRooms.length} phòng)</span>
                      </button>
                    </div>
                  </div>

                  {/* Thanh công cụ tìm kiếm cơ sở */}
                  <div className="bg-white p-4 rounded-[22px] shadow-sm border border-[#f4ebd9] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 flex-1">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên khu trọ, địa chỉ, trường ĐH..."
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-xs font-medium w-full text-slate-800"
                      />
                      {propertySearch && (
                        <button type="button" onClick={() => setPropertySearch("")} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 self-center">
                      <span>Hiển thị: <strong className="text-slate-900">{filteredPropertyGroups.length}</strong> cơ sở khu trọ</span>
                    </div>
                  </div>

                  {/* Lưới các thẻ khu vực */}
                  {filteredPropertyGroups.length === 0 ? (
                    <div className="bg-white rounded-[24px] p-12 text-center border border-[#f4ebd9] flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                        <Building2 className="w-8 h-8 text-[#f97316]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base mb-1">
                        {propertySearch ? `Không tìm thấy cơ sở nào khớp với "${propertySearch}"` : "Bạn chưa có khu trọ nào"}
                      </h4>
                      <p className="text-slate-500 text-xs max-w-sm mb-4">
                        Hãy tạo khu trọ mới ở vị trí địa chỉ của bạn hoặc thêm phòng để bắt đầu quản lý.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleOpenAddProperty}
                          className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-[#f97316]/20"
                        >
                          <MapPin className="w-4 h-4 mr-1.5" /> Thêm khu trọ vị trí mới
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredPropertyGroups.map(group => {
                        return (
                          <div
                            key={group.key}
                            onClick={() => {
                              setSelectedPropertyKey(group.key);
                              setRoomFilter("all");
                              setRoomSearch("");
                            }}
                            className="group bg-white rounded-[24px] p-5 shadow-sm border border-[#f4ebd9] hover:border-[#f97316] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                          >
                            <div>
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative shadow-inner group-hover:scale-102 transition-transform">
                                  <img
                                    src={group.image_url}
                                    className="w-full h-full object-cover"
                                    alt={group.name}
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <ImageIcon className="w-2.5 h-2.5" /> {group.imagesCount}
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-[#ea580c] font-black text-xs">
                                      Khu vực / Dãy trọ
                                    </span>
                                    {group.campus && (
                                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        • {group.campus}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="font-heading font-black text-lg text-slate-900 group-hover:text-[#f97316] transition-colors line-clamp-1">
                                    {group.name}
                                  </h3>

                                  <div className="flex items-start gap-1.5 text-xs font-semibold text-slate-600 mt-1 line-clamp-2">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                    <span>{group.address}</span>
                                  </div>

                                  <div className="mt-2 text-xs font-bold text-slate-700">
                                    Giá phòng: <span className="text-[#f97316] font-black">{group.minPrice ? `${group.minPrice.toLocaleString('vi-VN')} đ` : "Chưa đặt"}</span>
                                    {group.maxPrice > group.minPrice && (
                                      <span className="text-slate-500 font-normal"> - {group.maxPrice.toLocaleString('vi-VN')} đ/tháng</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 4 ô thống kê con */}
                              <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                                <div className="text-center">
                                  <span className="block text-[11px] text-slate-400 font-bold">Tổng</span>
                                  <span className="font-black text-slate-900 text-sm">{group.total}</span>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                  <span className="block text-[11px] text-emerald-600 font-bold">Trống</span>
                                  <span className="font-black text-emerald-600 text-sm">{group.available}</span>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                  <span className="block text-[11px] text-blue-600 font-bold">Đang ở</span>
                                  <span className="font-black text-blue-600 text-sm">{group.rented}</span>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                  <span className="block text-[11px] text-amber-600 font-bold">Sửa</span>
                                  <span className="font-black text-amber-600 text-sm">{group.repairing}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons: Thêm phòng, Sửa, Xóa & Xem phòng */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddSubRoom(group.name);
                                  }}
                                  className="text-xs font-bold text-slate-600 hover:text-[#f97316] flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-orange-50 transition"
                                  title="Thêm phòng mới vào riêng dãy trọ này"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#f97316]" />
                                  <span>Thêm phòng</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProperty(group);
                                  }}
                                  className="text-xs font-bold text-slate-600 hover:text-[#f97316] flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-orange-50 transition"
                                  title="Chỉnh sửa tên, địa chỉ, đơn giá khu trọ này"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-[#f97316]" />
                                  <span>Sửa</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProperty(group);
                                  }}
                                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-rose-50 transition"
                                  title="Xóa toàn bộ khu trọ này và các phòng thuộc khu"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Xóa</span>
                                </button>
                              </div>

                              <Button
                                type="button"
                                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-black px-4 py-1.5 shadow-md shadow-orange-500/20 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0"
                              >
                                <span>Xem {group.total} phòng</span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════════════
                  CHẾ ĐỘ 2: DANH SÁCH PHÒNG CỦA KHU VỰC ĐÃ CHỌN (HOẶC TẤT CẢ)
                 ════════════════════════════════════════════════════════════════════ */}
              {selectedPropertyKey && (
                <div className="space-y-5 animate-in fade-in duration-200">

                  {/* Thanh điều hướng & Chuyển cơ sở nhanh */}
                  <div className="bg-white p-4 sm:p-5 rounded-[22px] shadow-sm border border-[#f4ebd9] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyKey(null)}
                          className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-[#f97316] transition flex items-center gap-1 font-bold text-xs"
                          title="Quay lại danh sách các khu trọ"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Danh sách khu vực</span>
                        </button>
                        <div>
                          <h2 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                            <span>{selectedGroup ? selectedGroup.name : "Toàn bộ danh sách phòng"}</span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c]">
                              {selectedGroup ? `${selectedGroup.total} phòng` : `${realRooms.length} phòng`}
                            </span>
                          </h2>
                          {selectedGroup && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{selectedGroup.address}</span>
                              {selectedGroup.campus && <span>• {selectedGroup.campus}</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedGroup && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleEditProperty(selectedGroup)}
                              className="rounded-full border-slate-300 hover:border-[#f97316] text-slate-700 hover:text-[#f97316] font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs"
                              title="Chỉnh sửa thông tin cơ sở này"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Sửa cơ sở</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleDeleteProperty(selectedGroup)}
                              className="rounded-full border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs"
                              title="Xóa toàn bộ cơ sở này"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Xóa cơ sở</span>
                            </Button>
                          </>
                        )}

                        <Button
                          onClick={() => handleOpenAddSubRoom(selectedGroup?.name)}
                          className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-4 py-2 shadow-md shadow-[#f97316]/20 flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{selectedGroup ? "Thêm phòng vào khu này" : "Thêm phòng mới"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Quick switcher tabs: Chuyển nhanh giữa các khu vực mà không cần lùi ra ngoài */}
                    {propertyGroups.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 overflow-x-auto text-xs pb-1">
                        <span className="font-bold text-slate-400 shrink-0 mr-1">Chuyển khu:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyKey(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition shrink-0"
                        >
                          🏢 Tất cả khu vực
                        </button>
                        {propertyGroups.map(g => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => {
                              setSelectedPropertyKey(g.key);
                              setRoomFilter("all");
                              setRoomSearch("");
                            }}
                            className={cn(
                              "px-3 py-1 rounded-lg font-bold transition shrink-0 flex items-center gap-1.5",
                              g.key === selectedPropertyKey
                                ? "bg-[#f97316] text-white shadow-xs"
                                : "bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#f97316]"
                            )}
                          >
                            <span>🏠 {g.name}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded-full",
                              g.key === selectedPropertyKey ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                            )}>
                              {g.total}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toolbar & Filters (Tính riêng cho phạm vi đang xem) */}
                  {(() => {
                    const activeRoomScope = selectedGroup ? selectedGroup.rooms : realRooms;
                    const countAll = activeRoomScope.length;
                    const countAvail = activeRoomScope.filter(r => r.status === "available" || r.status === "Trống").length;
                    const countRent = activeRoomScope.filter(r => r.status === "rented" || r.status === "Đang thuê").length;
                    const countRepair = activeRoomScope.filter(r => r.status === "repairing" || r.status === "Đang sửa").length;

                    return (
                      <div className="bg-white p-4 sm:p-5 rounded-[22px] shadow-sm border border-[#f4ebd9] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        {/* Filter tabs with count badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { id: "all", label: "Tất cả", count: countAll },
                            { id: "available", label: "Phòng trống", count: countAvail },
                            { id: "rented", label: "Đang thuê", count: countRent },
                            { id: "repairing", label: "Đang sửa", count: countRepair }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setRoomFilter(f.id)}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
                                roomFilter === f.id
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#f97316] hover:bg-orange-50/50"
                              )}
                            >
                              <span>{f.label}</span>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                roomFilter === f.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                              )}>
                                {f.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Search & Action Button */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 flex-1 md:flex-initial">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Tìm số phòng, người ở..."
                              value={roomSearch}
                              onChange={(e) => setRoomSearch(e.target.value)}
                              className="bg-transparent border-none focus:outline-none text-xs font-medium w-full sm:w-48 text-slate-800"
                            />
                            {roomSearch && (
                              <button type="button" onClick={() => setRoomSearch("")} className="text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Danh sách phòng dạng hàng dọc (Vertical List) */}
                  <div className="flex flex-col gap-3.5">
                    {(() => {
                      const activeRoomScope = selectedGroup ? selectedGroup.rooms : realRooms;
                      const filteredRooms = activeRoomScope.filter(r => {
                        const statusVal = r.status === "Trống" ? "available" : (r.status === "Đang thuê" ? "rented" : (r.status === "Đang sửa" ? "repairing" : (r.status || "available")));
                        const matchF = roomFilter === "all" || statusVal === roomFilter;
                        const matchS = !roomSearch || 
                          r.title?.toLowerCase().includes(roomSearch.toLowerCase()) || 
                          r.address?.toLowerCase().includes(roomSearch.toLowerCase()) || 
                          r.room_number?.toLowerCase().includes(roomSearch.toLowerCase()) || 
                          r.property_name?.toLowerCase().includes(roomSearch.toLowerCase()) ||
                          r.tenant?.name?.toLowerCase().includes(roomSearch.toLowerCase()) ||
                          r.tenant?.phone?.toLowerCase().includes(roomSearch.toLowerCase());
                        return matchF && matchS;
                      });

                      if (filteredRooms.length === 0) {
                        return (
                          <div className="bg-white rounded-[24px] p-12 text-center border border-[#f4ebd9] flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                              <DoorOpen className="w-8 h-8 text-[#f97316]" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-base mb-1">Không tìm thấy phòng phù hợp</h4>
                            <p className="text-slate-500 text-xs max-w-sm mb-4">
                              {roomSearch ? `Không có kết quả nào khớp với "${roomSearch}"` : "Hiện tại khu vực này chưa có phòng trọ nào trong trạng thái đã chọn."}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2.5">
                              <Button
                                onClick={() => handleOpenAddSubRoom(selectedGroup?.name)}
                                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-[#f97316]/20"
                              >
                                <Plus className="w-4 h-4 mr-1.5" /> Thêm phòng mới vào khu này
                              </Button>
                              <Button
                                onClick={() => setSelectedPropertyKey(null)}
                                variant="outline"
                                className="rounded-full border-slate-300 hover:border-[#f97316] text-slate-700 font-bold text-xs px-4 py-2.5"
                              >
                                <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" /> Quay lại danh sách khu vực
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return filteredRooms.map(room => {
                        const roomId = room._id || room.id;
                        const isAvail = room.status === "available" || room.status === "Trống";
                        const isRent = room.status === "rented" || room.status === "Đang thuê";
                        const isRepair = room.status === "repairing" || room.status === "Đang sửa";

                        return (
                          <div
                            key={roomId}
                            className="bg-white p-4 sm:p-5 rounded-[22px] shadow-sm border border-[#f4ebd9] hover:border-[#f97316]/40 hover:shadow-md transition-all flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
                          >
                            {/* Ảnh và thông tin phòng */}
                            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                              <div className="w-24 h-24 sm:w-32 sm:h-24 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative shadow-inner">
                                <img
                                  src={room.images?.[0] || room.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"}
                                  className="w-full h-full object-cover"
                                  alt={room.title}
                                />
                                {room.images?.length > 1 && (
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <ImageIcon className="w-2.5 h-2.5" /> {room.images.length}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {room.room_number && (
                                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-600 text-white font-black text-xs shadow-sm flex items-center gap-1">
                                      <DoorOpen className="w-3.5 h-3.5" />
                                      {room.room_number}
                                    </span>
                                  )}
                                  <h4 className="font-bold text-slate-900 text-base hover:text-[#f97316] transition line-clamp-1">
                                    {room.title}
                                  </h4>
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0",
                                    isAvail ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                    isRent ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                    "bg-amber-100 text-amber-700 border border-amber-200"
                                  )}>
                                    {isAvail ? "● Còn phòng" : (isRent ? "● Đang cho thuê" : "● Đang sửa")}
                                  </span>
                                </div>

                                {room.property_name && (
                                  <div className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                    <span className="text-slate-400">Thuộc dãy/khu:</span>
                                    <span className="text-[#ea580c] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 font-semibold">{room.property_name}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-semibold text-slate-500 mb-2">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[280px]">{room.address || room.campus}</span>
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>{room.area_sqm || room.area || 20}m²</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600">{room.room_type || "Phòng khép kín"}</span>
                                </div>

                                {/* Thông tin khách thuê & Tình trạng hóa đơn điện nước */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {room.tenant ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>Người ở: <strong className="text-indigo-900">{room.tenant.name}</strong></span>
                                      {room.tenant.phone && (
                                        <span className="text-indigo-500 font-normal">({room.tenant.phone})</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                                      <Users className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Chưa có người ở</span>
                                    </div>
                                  )}

                                  {/* Tình trạng đóng tiền tháng gần nhất */}
                                  {(() => {
                                    const latestBill = room.meterHistory?.[0];
                                    if (!latestBill) return null;
                                    const isPaid = latestBill.status === "paid";
                                    return (
                                      <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border",
                                        isPaid 
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      )}>
                                        <span>T{latestBill.month}:</span>
                                        <span>{isPaid ? "Đã đóng tiền" : `Chưa đóng (${Number(latestBill.total || 0).toLocaleString("vi-VN")}đ)`}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Tiện nghi phòng */}
                                {room.amenities && room.amenities.length > 0 && (
                                  <div className="hidden sm:flex flex-wrap gap-1.5">
                                    {room.amenities.slice(0, 4).map((a, i) => (
                                      <span key={i} className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100 font-medium">
                                        {a}
                                      </span>
                                    ))}
                                    {room.amenities.length > 4 && (
                                      <span className="text-[10px] text-slate-400 font-bold self-center">
                                        +{room.amenities.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Giá và Trạng thái nhanh */}
                            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                              <div className="text-left lg:text-right">
                                <div className="font-heading font-black text-[#f97316] text-xl">
                                  {Number(room.price || 0).toLocaleString("vi-VN")}đ
                                  <span className="text-xs text-slate-400 font-medium ml-1">/tháng</span>
                                </div>
                              </div>

                              {/* Quick availability toggle */}
                              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoomStatus(roomId, "available")}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition",
                                    isAvail ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                  )}
                                  title="Đổi sang Còn phòng"
                                >
                                  Còn phòng
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoomStatus(roomId, "rented")}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition",
                                    isRent ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                  )}
                                  title="Đổi sang Đã thuê"
                                >
                                  Đã thuê
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoomStatus(roomId, "repairing")}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition",
                                    isRepair ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                  )}
                                  title="Đổi sang Sửa chữa"
                                >
                                  Sửa chữa
                                </button>
                              </div>
                            </div>

                            {/* Nhóm nút thao tác: Xem chi tiết/Điện nước, Sửa, Xóa */}
                            <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-4 border-slate-100 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRoomDetail(room)}
                                className="rounded-xl border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 text-xs font-bold text-[#f97316] h-9 px-3 flex items-center gap-1.5 shadow-sm"
                                title="Xem chi tiết người ở, nhập số công tơ điện nước & tình trạng đóng tiền"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Chi tiết & Điện nước</span>
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRoom(room)}
                                className="rounded-xl border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 text-xs font-bold text-slate-700 h-9 px-3"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1 text-[#f97316]" />
                                Sửa
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRoom(room)}
                                className="rounded-xl border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-700 h-9 px-3"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* PHẦN 1: LỊCH HẸN XEM PHÒNG CỦA NGƯỜI THUÊ */}
              <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-[#f97316]" />
                  Lịch Hẹn Xem Phòng Của Người Thuê ({appointments.length})
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

{/* Tab Quản lý Nhận phòng & Xác minh Lưu trú */}
          {activeTab === "stays" && <LandlordStayManager rooms={realRooms} />}

          {/* Tab Bảng chốt số điện nước dạng Lưới Excel thông minh */}
          {activeTab === "meter-grid" && (
            <MeterGridManager 
              user={user}
              rooms={realRooms}
              onBackToDashboard={() => setActiveTab("overview")} 
              onNavigateToRooms={() => setActiveTab("rooms")}
            />
          )}

          {/* Tab Quản lý Hợp đồng & Cọc phòng */}
          {activeTab === "contracts" && <ContractsManager />}

          {/* Tab Hóa đơn & Thu tiền */}
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

      {/* Modal 1: Đăng khu trọ ở VỊ TRÍ MỚI (có banner cảnh báo to đùng đập vào mắt nếu chỉ muốn thêm phòng) */}
      <AddRoomModal 
        open={isAddPropertyOpen} 
        onClose={() => {
          setAddPropertyOpen(false);
          setEditingRoom(null);
        }} 
        user={user}
        onSuccess={handleRoomSavedSuccess}
        editingRoom={editingRoom}
        onSwitchToFastAdd={() => {
          setAddPropertyOpen(false);
          setAddSubRoomOpen(true);
        }}
      />

      {/* Modal 2: Thêm phòng mới (P.101, P.102...) vào khu trọ hiện có - cực nhanh không cần gõ lại địa chỉ */}
      <AddSubRoomModal
        open={isAddSubRoomOpen}
        onClose={() => setAddSubRoomOpen(false)}
        user={user}
        existingRooms={realRooms}
        initialPropertyName={targetPropForAddRoom}
        onSuccess={handleSubRoomsSavedSuccess}
        onOpenAddProperty={() => {
          setAddSubRoomOpen(false);
          setEditingRoom(null);
          setAddPropertyOpen(true);
        }}
      />

      {/* Modal Chỉnh sửa thông tin cơ sở / Khu trọ */}
      <EditPropertyModal
        open={isEditPropertyOpen}
        onClose={() => {
          setEditPropertyOpen(false);
          setEditingProperty(null);
        }}
        property={editingProperty}
        onSave={handleSavePropertyUpdate}
      />

      {/* Modal Chỉnh sửa thông tin phòng riêng lẻ (Số phòng P.101/A1, giá, người ở...) */}
      <EditRoomModal
        open={isEditRoomOpen}
        onClose={() => {
          setEditRoomOpen(false);
          setEditingSingleRoom(null);
        }}
        room={editingSingleRoom}
        propertyOptions={propertyGroups}
        onSave={handleSaveRoomUpdate}
      />

      {/* Modal chi tiết người ở, nhập công tơ điện nước & tình trạng hóa đơn */}
      <RoomTenantAndMeterModal 
        open={isDetailModalOpen} 
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailRoom(null);
        }} 
        room={selectedDetailRoom}
        onUpdateRoom={handleUpdateRoomFromDetail}
      />
    </div>
  );
}
