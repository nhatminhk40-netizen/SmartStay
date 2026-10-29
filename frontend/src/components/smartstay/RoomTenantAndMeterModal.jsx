import React, { useState, useEffect, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import {
  X, User, Phone, Mail, School, Calendar, ShieldCheck, Zap, Droplets,
  Wifi, Trash2, CheckCircle2, Clock, AlertCircle, Edit2, Plus, DollarSign,
  Send, Copy, Check, ExternalLink, ArrowRight, FileText, CheckCircle, RefreshCw,
  Lock, Printer, QrCode, CreditCard, Sparkles, Image as ImageIcon, Eye,
  Download, Loader2, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hàm chuyển số thành chữ tiếng Việt chuẩn xác (dùng cho Hóa đơn)
const docSoTienBangChu = (so) => {
  if (!so || isNaN(so) || so <= 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const docHangTram = (n, dayDu = true) => {
    let str = "";
    const tram = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const donVi = n % 10;
    if (dayDu || tram > 0) {
      str += " " + chuSo[tram] + " trăm";
      str += docHangChuc(chuc, donVi);
    } else {
      str += docHangChuc(chuc, donVi);
    }
    return str;
  };

  const docHangChuc = (chuc, donVi) => {
    let str = "";
    if (chuc > 1) {
      str += " " + chuSo[chuc] + " mươi";
      if (donVi === 1) str += " mốt";
      else if (donVi === 5) str += " lăm";
      else if (donVi > 0) str += " " + chuSo[donVi];
    } else if (chuc === 1) {
      str += " mười";
      if (donVi === 5) str += " lăm";
      else if (donVi > 0) str += " " + chuSo[donVi];
    } else if (donVi > 0) {
      str += " lẻ " + chuSo[donVi];
    }
    return str;
  };

  let str = "";
  const ty = Math.floor(so / 1000000000);
  let soDu = so % 1000000000;
  const trieu = Math.floor(soDu / 1000000);
  soDu = soDu % 1000000;
  const nghin = Math.floor(soDu / 1000);
  const dong = soDu % 1000;

  if (ty > 0) {
    str += docHangTram(ty, false) + " tỷ";
  }
  if (trieu > 0) {
    str += docHangTram(trieu, ty > 0) + " triệu";
  }
  if (nghin > 0) {
    str += docHangTram(nghin, trieu > 0 || ty > 0) + " nghìn";
  }
  if (dong > 0) {
    str += docHangTram(dong, nghin > 0 || trieu > 0 || ty > 0);
  }

  str = str.trim();
  if (!str) return "Không đồng";
  return str.charAt(0).toUpperCase() + str.slice(1) + " đồng chẵn";
};

export default function RoomTenantAndMeterModal({
  open,
  onClose,
  room,
  onUpdateRoom
}) {
  if (!open || !room) return null;

  const roomId = room._id || room.id;
  const basePrice = Number(room.price) || 0;

  // Lấy thời gian thực hiện tại (Tháng 10/2026)
  const now = new Date();
  const currentRealMonth = now.getMonth() + 1; // 10
  const currentRealYear = now.getFullYear();   // 2026

  // Tab con trong modal
  const [activeSubTab, setActiveSubTab] = useState("meters"); // 'meters' | 'history' | 'tenant'

  // Trích xuất đơn giá điện từ room (mặc định 3500)
  const elecRate = (() => {
    if (typeof room.electricityCostType === "number") return room.electricityCostType;
    const digits = String(room.electricityCostType || "").replace(/\D/g, "");
    return digits ? Number(digits) : 3500;
  })();

  // Trích xuất đơn giá nước từ room (mặc định 15000)
  const waterRate = (() => {
    if (typeof room.waterCost === "number") return room.waterCost;
    const digits = String(room.waterCost || "").replace(/\D/g, "");
    return digits ? Number(digits) : 15000;
  })();

  const isWaterByPerson = String(room.waterCost || "").toLowerCase().includes("người");
  const wifiFee = Number(room.extraFees?.wifi || 0);
  const trashFee = Number(room.extraFees?.trash || 0);

  // 1. Quản lý Khách thuê & Thông tin CCCD
  const [tenant, setTenant] = useState(room.tenant || null);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: room.tenant?.name || "",
    phone: room.tenant?.phone || "",
    email: room.tenant?.email || "",
    university: room.tenant?.university || "",
    idCard: room.tenant?.idCard || "",                       // Số CCCD (12 số)
    idCardIssueDate: room.tenant?.idCardIssueDate || "",     // Ngày cấp
    idCardIssuePlace: room.tenant?.idCardIssuePlace || "",   // Nơi cấp
    permanentAddress: room.tenant?.permanentAddress || "",   // Thường trú khai báo tạm trú
    idCardFront: room.tenant?.idCardFront || "",             // Ảnh mặt trước CCCD
    idCardBack: room.tenant?.idCardBack || "",               // Ảnh mặt sau CCCD
    startDate: room.tenant?.startDate || "",
    endDate: room.tenant?.endDate || "",
    depositAmount: room.tenant?.depositAmount || 0,
    notes: room.tenant?.notes || ""
  });

  // Modal xem ảnh CCCD phóng to
  const [zoomCccdPhoto, setZoomCccdPhoto] = useState(null);

  // 2. Lịch sử hóa đơn theo tháng (ĐÃ LOẠI BỎ CÁC THÁNG TƯƠNG LAI BỊ CACHE NHẦM)
  const [bills, setBills] = useState(() => {
    const raw = Array.isArray(room.meterHistory) ? room.meterHistory : [];
    // Lọc sạch mọi hóa đơn tương lai nếu vượt quá thời gian thực hiện tại
    return raw.filter(b => {
      if (!b) return false;
      if (b.year > currentRealYear) return false;
      if (b.year === currentRealYear && b.month > currentRealMonth) return false;
      return true;
    }).map(b => {
      // Bất kỳ hóa đơn nào của Tháng hiện tại khi mới nhập số phải ở trạng thái CHƯA THU
      if (b.year === currentRealYear && b.month === currentRealMonth) {
        return { ...b, status: "unpaid", paidDate: null };
      }
      return b;
    });
  });

  // 3. Tháng đang chọn để ghi số / lập hóa đơn
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);
  const [selectedYear, setSelectedYear] = useState(currentRealYear);

  // Helper tính số cũ tự động dựa trên tháng trước đó
  const getAutoOldReadings = (m, y, billsList) => {
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const prevBill = billsList.find(b => Number(b.month) === prevM && Number(b.year) === prevY);
    if (prevBill) {
      return {
        elecOld: prevBill.elecNew !== undefined && prevBill.elecNew !== "" ? Number(prevBill.elecNew) : Number(prevBill.elecOld),
        waterOld: prevBill.waterNew !== undefined && prevBill.waterNew !== "" ? Number(prevBill.waterNew) : Number(prevBill.waterOld),
        prevMonth: prevM,
        hasPrev: true
      };
    }
    // Tìm hóa đơn gần nhất trước tháng m
    const pastBills = billsList.filter(b => b.year < y || (b.year === y && b.month < m));
    if (pastBills.length > 0) {
      pastBills.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
      const nearest = pastBills[0];
      return {
        elecOld: nearest.elecNew !== undefined && nearest.elecNew !== "" ? Number(nearest.elecNew) : Number(nearest.elecOld),
        waterOld: nearest.waterNew !== undefined && nearest.waterNew !== "" ? Number(nearest.waterNew) : Number(nearest.waterOld),
        prevMonth: nearest.month,
        hasPrev: true
      };
    }
    return {
      elecOld: 1120, // Mốc cơ sở ban đầu
      waterOld: 82,
      prevMonth: prevM,
      hasPrev: false
    };
  };

  // State của Form nhập chỉ số
  const [meterForm, setMeterForm] = useState({
    month: currentRealMonth,
    year: currentRealYear,
    elecOld: 1205,
    elecNew: "",
    waterOld: 86,
    waterNew: "",
    prevMonthInfo: currentRealMonth - 1,
    isExisting: false
  });

  // Đồng bộ meterForm khi selectedMonth / bills thay đổi
  useEffect(() => {
    const existing = bills.find(b => Number(b.month) === Number(selectedMonth) && Number(b.year) === Number(selectedYear));
    if (existing) {
      setMeterForm({
        month: selectedMonth,
        year: selectedYear,
        elecOld: existing.elecOld ?? 0,
        elecNew: existing.elecNew ?? "",
        waterOld: existing.waterOld ?? 0,
        waterNew: existing.waterNew ?? "",
        prevMonthInfo: selectedMonth === 1 ? 12 : selectedMonth - 1,
        isExisting: true
      });
    } else {
      const prev = getAutoOldReadings(selectedMonth, selectedYear, bills);
      setMeterForm({
        month: selectedMonth,
        year: selectedYear,
        elecOld: prev.elecOld,
        elecNew: "", // Mở tháng mới -> để trống sẵn sàng nhập
        waterOld: prev.waterOld,
        waterNew: "", // Để trống sẵn sàng nhập
        prevMonthInfo: prev.prevMonth,
        isExisting: false
      });
    }
  }, [selectedMonth, selectedYear, bills]);

  // Danh sách các tháng khả dụng trong Dropdown:
  // Bao gồm các tháng đã có hóa đơn + tháng hiện tại + tháng sau (nếu tháng hiện tại đã chốt xong)
  const availableMonths = useMemo(() => {
    const set = new Set();
    // 1. Thêm các tháng đã có hóa đơn
    bills.forEach(b => {
      set.add(`${b.year}_${b.month}`);
    });
    // 2. Luôn có tháng hiện tại
    set.add(`${currentRealYear}_${currentRealMonth}`);

    // 3. Nếu tháng hiện tại đã chốt xong -> mở khóa tháng tiếp theo!
    const isCurrentRecorded = bills.some(b => Number(b.month) === currentRealMonth && Number(b.year) === currentRealYear);
    if (isCurrentRecorded) {
      const nextM = currentRealMonth === 12 ? 1 : currentRealMonth + 1;
      const nextY = currentRealMonth === 12 ? currentRealYear + 1 : currentRealYear;
      set.add(`${nextY}_${nextM}`);
    }

    // Chuyển thành danh sách và sắp xếp giảm dần (tháng mới nhất lên đầu)
    const list = Array.from(set).map(item => {
      const [y, m] = item.split('_').map(Number);
      return { month: m, year: y };
    });
    list.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
    return list;
  }, [bills, currentRealMonth, currentRealYear]);

  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Modal xem và in Hóa đơn / Phiếu thu
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [modalQrUrl, setModalQrUrl] = useState("");

  useEffect(() => {
    if (!viewingInvoice) return;
    const amount = Number(viewingInvoice.total) || 0;
    const roomClean = String(room?.room_number || "P101").replace(/[^a-zA-Z0-9]/g, "");
    const addInfo = `TT TIEN TRO P${roomClean} T${viewingInvoice.month}`;
    const qrPayload = `https://img.vietqr.io/image/MB-0907297338-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=LE%20KHAI`;

    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(url => {
      setModalQrUrl(url);
    }).catch(err => {
      console.error("Lỗi tạo QR:", err);
    });
  }, [viewingInvoice, room]);
  const invoiceCardRef = useRef(null);
  const [isCapturingImage, setIsCapturingImage] = useState(false);

  // Tính toán số tiêu thụ & thành tiền theo thời gian thực
  const elecUsage = meterForm.elecNew !== "" ? Math.max(0, Number(meterForm.elecNew) - Number(meterForm.elecOld)) : 0;
  const elecCost = elecUsage * elecRate;

  const waterUsage = meterForm.waterNew !== "" ? Math.max(0, Number(meterForm.waterNew) - Number(meterForm.waterOld)) : 0;
  const waterCost = isWaterByPerson ? waterRate : (waterUsage * waterRate);

  const monthTotal = basePrice + elecCost + waterCost + wifiFee + trashFee;

  // LƯU CHỈ SỐ CÔNG TƠ & TẠO HÓA ĐƠN THÁNG (CẬP NHẬT TỰ ĐỘNG CHO THÁNG SAU)
  const handleSaveMeters = () => {
    if (meterForm.elecNew === "" || meterForm.waterNew === "") {
      alert("Vui lòng nhập chỉ số mới của cả Đồng hồ Điện và Nước!");
      return;
    }
    if (Number(meterForm.elecNew) < Number(meterForm.elecOld)) {
      alert(`Số điện mới (${meterForm.elecNew}) không được nhỏ hơn số cũ (${meterForm.elecOld})!`);
      return;
    }
    if (Number(meterForm.waterNew) < Number(meterForm.waterOld)) {
      alert(`Số nước mới (${meterForm.waterNew}) không được nhỏ hơn số cũ (${meterForm.waterOld})!`);
      return;
    }

    const updatedBills = [...bills];
    const existingIndex = updatedBills.findIndex(b => Number(b.month) === Number(meterForm.month) && Number(b.year) === Number(meterForm.year));

    const billObj = {
      month: Number(meterForm.month),
      year: Number(meterForm.year),
      elecOld: Number(meterForm.elecOld),
      elecNew: Number(meterForm.elecNew),
      elecUsage,
      elecCost,
      waterOld: Number(meterForm.waterOld),
      waterNew: Number(meterForm.waterNew),
      waterUsage,
      waterCost,
      roomCost: basePrice,
      wifiCost: wifiFee,
      trashCost: trashFee,
      total: monthTotal,
      status: "unpaid", // Mới nhập số & tạo hóa đơn -> LUÔN LÀ CHƯA THU để gửi khách đóng tiền
      paidDate: null,
      dueDate: `10/${meterForm.month}/${meterForm.year}`,
      createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      updatedBills[existingIndex] = { ...updatedBills[existingIndex], ...billObj };
    } else {
      updatedBills.unshift(billObj);
    }

    // Sắp xếp giảm dần theo thời gian
    updatedBills.sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
    setBills(updatedBills);

    // Đồng bộ lại phòng & LocalStorage
    const updatedRoom = {
      ...room,
      meterHistory: updatedBills,
      tenant: tenant
    };
    onUpdateRoom?.(updatedRoom);

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  // Đổi trạng thái đóng tiền (Đã đóng <-> Chưa đóng)
  const handleToggleBillStatus = (m, y) => {
    const updatedBills = bills.map(b => {
      if (b.month === m && b.year === y) {
        const isPaid = b.status === "paid";
        return {
          ...b,
          status: isPaid ? "unpaid" : "paid",
          paidDate: isPaid ? null : new Date().toLocaleDateString("vi-VN")
        };
      }
      return b;
    });

    setBills(updatedBills);
    const updatedRoom = {
      ...room,
      meterHistory: updatedBills,
      tenant
    };
    onUpdateRoom?.(updatedRoom);
  };

  // Lưu thông tin khách thuê & CCCD
  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name.trim() || !tenantForm.phone.trim()) {
      alert("Vui lòng nhập tên và số điện thoại của người thuê!");
      return;
    }

    const updatedTenant = {
      name: tenantForm.name,
      phone: tenantForm.phone,
      email: tenantForm.email,
      university: tenantForm.university,
      idCard: tenantForm.idCard,
      idCardIssueDate: tenantForm.idCardIssueDate,
      idCardIssuePlace: tenantForm.idCardIssuePlace,
      permanentAddress: tenantForm.permanentAddress,
      idCardFront: tenantForm.idCardFront,
      idCardBack: tenantForm.idCardBack,
      startDate: tenantForm.startDate,
      endDate: tenantForm.endDate,
      depositAmount: Number(tenantForm.depositAmount) || 0,
      notes: tenantForm.notes
    };

    setTenant(updatedTenant);
    setIsEditingTenant(false);

    const updatedRoom = {
      ...room,
      status: "Đang thuê",
      tenant: updatedTenant
    };
    onUpdateRoom?.(updatedRoom);
    alert("🎉 Đã lưu thông tin khách thuê và Căn cước công dân (CCCD) thành công!");
  };

  // Mở Hóa đơn hiện tại của form đang chọn
  const handleOpenCurrentInvoice = () => {
    const currentBill = {
      month: meterForm.month,
      year: meterForm.year,
      elecOld: meterForm.elecOld,
      elecNew: meterForm.elecNew || meterForm.elecOld,
      elecUsage,
      elecCost,
      waterOld: meterForm.waterOld,
      waterNew: meterForm.waterNew || meterForm.waterOld,
      waterUsage,
      waterCost,
      roomCost: basePrice,
      wifiCost: wifiFee,
      trashCost: trashFee,
      total: monthTotal,
      status: "unpaid", // Hóa đơn đang lập luôn ở trạng thái Chưa thu
      dueDate: `10/${meterForm.month}/${meterForm.year}`
    };
    setViewingInvoice(currentBill);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fdfbf7] rounded-[28px] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#f4ebd9] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* ── HEADER MODAL ── */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-black text-lg sm:text-xl text-slate-900">
                {room.property_name ? `${room.property_name} - ` : ""}{room.room_number || room.title}
              </h3>
              <span className={cn(
                "text-xs px-2.5 py-0.5 rounded-full font-bold",
                tenant ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {tenant ? `• Đang có khách (${tenant.name})` : "• Phòng trống"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {room.address} • Giá niêm yết: <b className="text-amber-700 font-bold">{basePrice.toLocaleString()} đ/tháng</b>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── TABS ĐIỀU HƯỚNG ── */}
        <div className="px-5 sm:px-6 pt-3 bg-white border-b border-slate-100 flex gap-2 shrink-0 overflow-x-auto">
          {[
            { id: "meters", label: "1. Nhập số Điện & Nước (Công tơ)", icon: Zap },
            { id: "history", label: `2. Hóa đơn theo tháng (${bills.filter(b => b.status === 'unpaid').length} chưa thu)`, icon: Clock },
            { id: "tenant", label: `3. Thông tin người ở & CCCD ${tenant ? `(${tenant.name})` : ""}`, icon: User },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap",
                  active
                    ? "bg-[#f97316] text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── NỘI DUNG TỪNG TAB ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: GHI CHỈ SỐ ĐIỆN & NƯỚC (CÓ KHÓA SỐ CŨ & NHẢY SỐ TỰ ĐỘNG)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "meters" && (
            <div className="space-y-4">
              
              {/* Thanh chọn Tháng / Năm thực tế */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                    #{meterForm.month}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Ghi chỉ số Tháng {meterForm.month}/{meterForm.year}</span>
                      {meterForm.isExisting ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Đã có hóa đơn
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Tự kế thừa số cũ Tháng {meterForm.prevMonthInfo}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chủ trọ chỉ cần nhập <b>Số mới</b>, hệ thống tự động khóa số cũ và tính tiền ngay lập tức
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-bold text-slate-500">Chọn tháng:</span>
                  <select
                    value={`${selectedYear}_${selectedMonth}`}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split('_').map(Number);
                      setSelectedMonth(m);
                      setSelectedYear(y);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-black text-xs text-slate-800 focus:outline-none focus:border-[#f97316] shadow-xs cursor-pointer"
                  >
                    {availableMonths.map(item => (
                      <option key={`${item.year}_${item.month}`} value={`${item.year}_${item.month}`}>
                        Tháng {item.month}/{item.year} {item.month === currentRealMonth && item.year === currentRealYear ? "(Hiện tại)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2 BOX NHẬP CÔNG TƠ ĐIỆN & NƯỚC (SỐ CŨ BỊ KHÓA LẠI TUYỆT ĐỐI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. CÔNG TƠ ĐIỆN */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 fill-amber-500" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">Công tơ Điện (kWh)</span>
                        <span className="text-[11px] text-slate-500 font-medium">Đơn giá: <b className="text-amber-700">{elecRate.toLocaleString()} đ/kWh</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* SỐ CŨ - ĐÃ BỊ KHÓA LẠI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Số cũ (T{meterForm.prevMonthInfo})</span>
                        </label>
                      </div>
                      <input 
                        type="number" 
                        value={meterForm.elecOld}
                        readOnly
                        disabled
                        title={`Số cũ này tự động chốt từ Tháng ${meterForm.prevMonthInfo}, không thể sửa thủ công`}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-500 text-sm cursor-not-allowed select-none"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">🔒 Đã khóa tự động</span>
                    </div>

                    {/* SỐ MỚI - ĐỂ CHỦ TRỌ NHẬP */}
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Số mới (Tháng {meterForm.month}) *</label>
                      <input 
                        type="number" 
                        value={meterForm.elecNew}
                        onChange={(e) => setMeterForm({ ...meterForm, elecNew: e.target.value })}
                        placeholder={`VD: ${Number(meterForm.elecOld) + 85}`}
                        className="w-full p-2.5 rounded-xl border-2 border-amber-400 bg-amber-50/20 font-mono font-black text-amber-950 text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                      />
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">Chủ trọ nhập số này</span>
                    </div>
                  </div>

                  {/* Kết quả tính tiền điện */}
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-600">Tiêu thụ:</span> <b className="text-amber-900 font-bold">{elecUsage} kWh</b>
                    </div>
                    <div>
                      <span className="text-slate-600">Thành tiền:</span> <b className="text-[#ea580c] text-sm font-black ml-1">{elecCost.toLocaleString()} đ</b>
                    </div>
                  </div>
                </div>

                {/* 2. CÔNG TƠ NƯỚC */}
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Droplets className="w-4 h-4 fill-blue-500" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">Đồng hồ Nước ({isWaterByPerson ? "Người" : "Khối m³"})</span>
                        <span className="text-[11px] text-slate-500 font-medium">Đơn giá: <b className="text-blue-700">{waterRate.toLocaleString()} đ/{isWaterByPerson ? "người" : "khối"}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* SỐ CŨ - ĐÃ BỊ KHÓA LẠI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Số cũ (T{meterForm.prevMonthInfo})</span>
                        </label>
                      </div>
                      <input 
                        type="number" 
                        value={meterForm.waterOld}
                        readOnly
                        disabled
                        title={`Số cũ này tự động chốt từ Tháng ${meterForm.prevMonthInfo}, không thể sửa thủ công`}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-500 text-sm cursor-not-allowed select-none"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">🔒 Đã khóa tự động</span>
                    </div>

                    {/* SỐ MỚI - ĐỂ CHỦ TRỌ NHẬP */}
                    <div>
                      <label className="block text-xs font-bold text-blue-700 mb-1">Số mới (Tháng {meterForm.month}) *</label>
                      <input 
                        type="number" 
                        value={meterForm.waterNew}
                        onChange={(e) => setMeterForm({ ...meterForm, waterNew: e.target.value })}
                        disabled={isWaterByPerson}
                        placeholder={isWaterByPerson ? "Khoán người" : `VD: ${Number(meterForm.waterOld) + 5}`}
                        className="w-full p-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/20 font-mono font-black text-blue-950 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs disabled:opacity-60"
                      />
                      <span className="text-[10px] text-blue-700 font-bold block mt-1">Chủ trọ nhập số này</span>
                    </div>
                  </div>

                  {/* Kết quả tính tiền nước */}
                  <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-600">Tiêu thụ:</span> <b className="text-blue-900 font-bold">{waterUsage} khối (m³)</b>
                    </div>
                    <div>
                      <span className="text-slate-600">Thành tiền:</span> <b className="text-blue-700 text-sm font-black ml-1">{waterCost.toLocaleString()} đ</b>
                    </div>
                  </div>
                </div>

              </div>

              {/* TỔNG KẾT PHIẾU THU & NÚT LẬP HÓA ĐƠN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 text-sm">Bảng chi tiết phiếu thu Tháng {meterForm.month}/{meterForm.year}:</span>
                  <span className="text-xs font-semibold text-slate-500">Khách thuê: <b className="text-slate-900">{tenant?.name || "Chưa có khách"}</b></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">1. Tiền phòng:</span>
                    <span className="font-bold text-slate-800 text-sm">{basePrice.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-amber-700 block">2. Tiền điện ({elecUsage} kWh):</span>
                    <span className="font-black text-amber-800 text-sm">{elecCost.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-100">
                    <span className="text-sky-700 block">3. Tiền nước ({waterUsage} m³):</span>
                    <span className="font-black text-sky-800 text-sm">{waterCost.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block">4. Phụ phí Wifi & Rác:</span>
                    <span className="font-black text-emerald-800 text-sm">{(wifiFee + trashFee).toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Tổng tiền phải thu Tháng {meterForm.month}:</span>
                    <div className="font-heading font-black text-2xl text-[#f97316]">
                      {monthTotal.toLocaleString()} VNĐ
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Nút Xem hóa đơn chi tiết */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenCurrentInvoice}
                      className="rounded-xl border-slate-300 font-bold text-xs h-10 text-slate-800 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Xem hóa đơn</span>
                    </Button>

                    {/* Nút Lưu chỉ số & Tạo hóa đơn */}
                    <Button
                      type="button"
                      onClick={handleSaveMeters}
                      className="rounded-xl font-black bg-[#f97316] hover:bg-[#ea580c] text-white px-5 shadow-md shadow-orange-500/20 text-xs h-10 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu chỉ số & Tạo hóa đơn</span>
                    </Button>
                  </div>
                </div>

                {saveSuccessNotice && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đã lưu chỉ số & phát hành hóa đơn Tháng {meterForm.month}/{meterForm.year}! Tháng tiếp theo đã sẵn sàng kế thừa số mới này.</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleOpenCurrentInvoice}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Xem hóa đơn ngay ➔
                    </Button>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: LỊCH SỬ HÓA ĐƠN THEO THÁNG (CÓ NÚT XEM HÓA ĐƠN TỪNG THÁNG)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Danh sách đóng tiền theo từng tháng</h4>
                  <p className="text-xs text-slate-500">Xem ngay tháng nào đã đóng, tháng nào chưa đóng. Bấm để xem hóa đơn chi tiết.</p>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-sm">Chưa có lịch sử hóa đơn nào.</p>
                  <p className="text-xs mt-1">Hãy chuyển sang tab "1. Nhập số Điện & Nước" để ghi số và tạo hóa đơn đầu tiên.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((b, idx) => {
                    const isPaid = b.status === "paid";
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white",
                          isPaid ? "border-slate-200" : "border-orange-300 bg-orange-50/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shrink-0",
                            isPaid ? "bg-slate-100 text-slate-600" : "bg-[#f97316] text-white"
                          )}>
                            <span className="text-[9px] uppercase tracking-wider font-semibold">Tháng</span>
                            <span className="text-base leading-none">{b.month}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm">
                                Tiền phòng Tháng {b.month}/{b.year}
                              </h5>
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {isPaid ? "✓ ĐÃ ĐÓNG" : "⚠ CHƯA ĐÓNG"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span>Điện: <b>{b.elecUsage} kWh</b> ({b.elecCost?.toLocaleString()}đ)</span>
                              <span>•</span>
                              <span>Nước: <b>{b.waterUsage} m³</b> ({b.waterCost?.toLocaleString()}đ)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="font-heading font-black text-lg text-slate-900">
                              {Number(b.total).toLocaleString()} đ
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {isPaid ? `Đã thu: ${b.paidDate || "Đúng hạn"}` : `Hạn đóng: ${b.dueDate || `10/${b.month}`}`}
                            </span>
                          </div>

                          {/* Nút Xem Hóa đơn */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingInvoice(b)}
                            className="rounded-xl border-slate-300 text-xs font-bold text-blue-700 hover:bg-blue-50 h-9"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" /> Xem HĐ
                          </Button>

                          {/* Nút Đổi trạng thái Thu tiền */}
                          <Button
                            size="sm"
                            onClick={() => handleToggleBillStatus(b.month, b.year)}
                            className={cn(
                              "rounded-xl text-xs font-bold h-9",
                              isPaid 
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700" 
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            )}
                          >
                            {isPaid ? "Đổi sang Chưa thu" : "✓ Đánh dấu ĐÃ THU"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: THÔNG TIN NGƯỜI Ở & LƯU TRỮ CĂN CƯỚC CÔNG DÂN (CCCD)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "tenant" && (
            <div className="space-y-4">
              
              {tenant && !isEditingTenant ? (
                /* CHẾ ĐỘ XEM THÔNG TIN KHÁCH & CCCD */
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#f97316] flex items-center justify-center font-black text-lg">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-lg text-slate-900">{tenant.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">Khách thuê phòng • Đang lưu trú</p>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingTenant(true)}
                      className="rounded-xl border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Sửa thông tin & CCCD
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* Khối 1: Thông tin liên lạc */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Thông tin liên lạc</span>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>SĐT: <a href={`tel:${tenant.phone}`} className="text-emerald-700 font-bold hover:underline">{tenant.phone}</a></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span>Email: <b className="text-slate-800">{tenant.email || "Chưa cập nhật"}</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <School className="w-4 h-4 text-purple-500" />
                        <span>Trường / Cơ quan: <b className="text-slate-800">{tenant.university || "Chưa cập nhật"}</b></span>
                      </div>
                    </div>

                    {/* Khối 2: Hợp đồng & Tiền cọc */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Hợp đồng & Cọc phòng</span>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-[#f97316]" />
                        <span>Thời hạn: <b className="text-slate-800">{tenant.startDate || "01/08/2026"} ➔ {tenant.endDate || "01/08/2027"}</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Tiền cọc giữ chân: <b className="text-[#f97316] font-bold">{Number(tenant.depositAmount || basePrice).toLocaleString()} đ</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Ghi chú: {tenant.notes || "Không có"}</span>
                      </div>
                    </div>

                  </div>

                  {/* KHỐI 3: THÔNG TIN CĂN CƯỚC CÔNG DÂN (CCCD) & KHAI BÁO TẠM TRÚ */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Thông tin Căn cước công dân (CCCD / Đăng ký tạm trú)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {tenant.idCard ? "Đã lưu CCCD" : "Chưa có CCCD"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block">Số Căn cước (12 số):</span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {tenant.idCard || "Chưa nhập số CCCD"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ngày cấp:</span>
                        <span className="font-bold text-slate-800">
                          {tenant.idCardIssueDate || "Chưa nhập"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Nơi cấp:</span>
                        <span className="font-bold text-slate-800">
                          {tenant.idCardIssuePlace || "Cục Cảnh sát QLHC về TTXH"}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-slate-500 block">Hộ khẩu thường trú (để khai báo Công an):</span>
                        <span className="font-bold text-slate-800">
                          {tenant.permanentAddress || "Chưa cập nhật địa chỉ thường trú"}
                        </span>
                      </div>
                    </div>

                    {/* Ảnh CCCD 2 mặt */}
                    <div className="pt-2 border-t border-amber-200/50">
                      <span className="text-xs font-bold text-slate-700 block mb-2">Ảnh chụp CCCD 2 mặt:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Mặt trước */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white p-2 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Mặt trước</span>
                          {tenant.idCardFront ? (
                            <div className="relative group cursor-pointer" onClick={() => setZoomCccdPhoto(tenant.idCardFront)}>
                              <img src={tenant.idCardFront} alt="CCCD Mặt trước" className="h-28 w-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white rounded-lg">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-24 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                              <span>Chưa có ảnh</span>
                            </div>
                          )}
                        </div>

                        {/* Mặt sau */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white p-2 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Mặt sau</span>
                          {tenant.idCardBack ? (
                            <div className="relative group cursor-pointer" onClick={() => setZoomCccdPhoto(tenant.idCardBack)}>
                              <img src={tenant.idCardBack} alt="CCCD Mặt sau" className="h-28 w-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white rounded-lg">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-24 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                              <span>Chưa có ảnh</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* CHẾ ĐỘ THÊM / CHỈNH SỬA KHÁCH THUÊ & CCCD */
                <form onSubmit={handleSaveTenant} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {tenant ? "Cập nhật thông tin khách thuê & CCCD" : "+ Thêm khách thuê vào phòng này"}
                      </h4>
                      <p className="text-xs text-slate-500">Điền thông tin và Căn cước công dân để quản lý và khai báo tạm trú</p>
                    </div>
                    {tenant && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingTenant(false)} className="rounded-full text-xs font-bold text-slate-600">
                        Hủy
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách thuê *</label>
                      <input 
                        type="text" 
                        required
                        value={tenantForm.name}
                        onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                      <input 
                        type="tel" 
                        required
                        value={tenantForm.phone}
                        onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                        placeholder="nguyenvana@gmail.com"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường học / Nơi làm việc</label>
                      <input 
                        type="text" 
                        value={tenantForm.university}
                        onChange={(e) => setTenantForm({ ...tenantForm, university: e.target.value })}
                        placeholder="Ví dụ: ĐH Cần Thơ / FPT Cần Thơ"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    {/* ── CÁC TRƯỜNG THÔNG TIN CCCD MỚI ĐƯỢC THÊM ── */}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span>Thông tin Căn cước công dân (CCCD)</span>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD (12 chữ số) *</label>
                      <input 
                        type="text" 
                        maxLength={12}
                        value={tenantForm.idCard}
                        onChange={(e) => setTenantForm({ ...tenantForm, idCard: e.target.value.replace(/\D/g, "") })}
                        placeholder="Ví dụ: 092098001234"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày cấp CCCD</label>
                      <input 
                        type="text" 
                        value={tenantForm.idCardIssueDate}
                        onChange={(e) => setTenantForm({ ...tenantForm, idCardIssueDate: e.target.value })}
                        placeholder="Ví dụ: 15/04/2021"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nơi cấp CCCD</label>
                      <input 
                        type="text" 
                        value={tenantForm.idCardIssuePlace}
                        onChange={(e) => setTenantForm({ ...tenantForm, idCardIssuePlace: e.target.value })}
                        placeholder="Cục Cảnh sát QLHC về TTXH"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hộ khẩu thường trú</label>
                      <input 
                        type="text" 
                        value={tenantForm.permanentAddress}
                        onChange={(e) => setTenantForm({ ...tenantForm, permanentAddress: e.target.value })}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    {/* Ảnh CCCD 2 mặt */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Link ảnh Mặt trước CCCD</label>
                      <input 
                        type="text" 
                        value={tenantForm.idCardFront}
                        onChange={(e) => setTenantForm({ ...tenantForm, idCardFront: e.target.value })}
                        placeholder="https://... ảnh mặt trước"
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Link ảnh Mặt sau CCCD</label>
                      <input 
                        type="text" 
                        value={tenantForm.idCardBack}
                        onChange={(e) => setTenantForm({ ...tenantForm, idCardBack: e.target.value })}
                        placeholder="https://... ảnh mặt sau"
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    {/* Hợp đồng & Cọc */}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                        Thời hạn thuê & Tiền cọc
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
                      <input 
                        type="number" 
                        value={tenantForm.depositAmount}
                        onChange={(e) => setTenantForm({ ...tenantForm, depositAmount: e.target.value })}
                        placeholder="2500000"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm text-[#f97316] focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu vào ở</label>
                      <input 
                        type="text" 
                        value={tenantForm.startDate}
                        onChange={(e) => setTenantForm({ ...tenantForm, startDate: e.target.value })}
                        placeholder="01/08/2026"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hết hạn hợp đồng</label>
                      <input 
                        type="text" 
                        value={tenantForm.endDate}
                        onChange={(e) => setTenantForm({ ...tenantForm, endDate: e.target.value })}
                        placeholder="01/08/2027"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm</label>
                      <input 
                        type="text" 
                        value={tenantForm.notes}
                        onChange={(e) => setTenantForm({ ...tenantForm, notes: e.target.value })}
                        placeholder="VD: Khách làm ca đêm, có xe SH..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button 
                      type="submit" 
                      className="rounded-xl font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-6 text-xs h-10 shadow-md shadow-orange-500/20"
                    >
                      {tenant ? "Lưu thay đổi thông tin khách & CCCD" : "+ Xác nhận thêm khách vào phòng"}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Phòng: <b className="text-slate-800">{room.room_number || room.title}</b> · Trạng thái: <b className={tenant ? "text-blue-600" : "text-emerald-600"}>{tenant ? "Đang cho thuê" : "Còn trống"}</b>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-full text-xs font-bold text-slate-600"
          >
            Đóng cửa sổ
          </Button>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL HÓA ĐƠN TIỀN TRỌ (HỖ TRỢ COPY ẢNH GỬI ZALO & XUẤT PDF)
         ══════════════════════════════════════════════════════════════════ */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
          
          {/* CSS tối ưu cho in ấn và xuất PDF */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-invoice-modal, #printable-invoice-modal * {
                visibility: visible !important;
              }
              #printable-invoice-modal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                margin: 0 !important;
                padding: 20px !important;
              }
              .no-print-area {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-200 relative">
            
            {/* Thanh trên cùng: Nút đóng & Tiêu đề phụ */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 no-print-area" data-html2canvas-ignore="true">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#f97316]" />
                <span>Hóa đơn điện tử phòng {room.room_number || room.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── KHU VỰC THẺ HÓA ĐƠN ĐƯỢC CHỤP ẢNH & IN ẤN (invoiceCardRef) ── */}
            <div 
              id="printable-invoice-modal"
              ref={invoiceCardRef} 
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              {/* Header Hóa đơn */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#f97316] font-black text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SmartStay Utility Billing</span>
                </div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  PHIẾU THU TIỀN PHÒNG & ĐIỆN NƯỚC
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kỳ thanh toán: <b className="text-slate-800">Tháng {viewingInvoice.month}/{viewingInvoice.year}</b> • Mã số: <b className="font-mono text-slate-700">PT-{viewingInvoice.year}{viewingInvoice.month < 10 ? `0${viewingInvoice.month}` : viewingInvoice.month}-{room.room_number || 'P101'}</b>
                </p>
              </div>

              {/* Thông tin bên thuê & bên cho thuê */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Bên cho thuê (Chủ trọ):</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{room.property_name || "Nhà trọ SmartStay"}</span>
                  <span className="text-slate-500 block text-[11px]">{room.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Bên thuê phòng:</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{tenant?.name || "Khách thuê"} - {room.room_number || room.title}</span>
                  <span className="text-slate-500 block text-[11px]">SĐT: {tenant?.phone || "Chưa có"}</span>
                  {tenant?.idCard && (
                    <span className="text-[11px] text-slate-600 font-mono block">CCCD: {tenant.idCard}</span>
                  )}
                </div>
              </div>

              {/* BẢNG KÊ CHI TIẾT CÁC KHOẢN (TABLE) */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="py-2 px-3 text-left">Khoản mục</th>
                      <th className="py-2 px-3 text-left">Chỉ số / Diễn giải</th>
                      <th className="py-2 px-3 text-right">Đơn giá</th>
                      <th className="py-2 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">1. Tiền thuê phòng</td>
                      <td className="py-2 px-3 text-slate-500">Định kỳ 1 tháng</td>
                      <td className="py-2 px-3 text-right">{basePrice.toLocaleString()} đ</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{basePrice.toLocaleString()} đ</td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 font-bold text-amber-900">2. Tiền điện</td>
                      <td className="py-2 px-3 text-amber-800 font-mono">
                        {viewingInvoice.elecOld} ➔ {viewingInvoice.elecNew} ({viewingInvoice.elecUsage} kWh)
                      </td>
                      <td className="py-2 px-3 text-right text-amber-900">{elecRate.toLocaleString()} đ</td>
                      <td className="py-2 px-3 text-right font-black text-amber-900">{viewingInvoice.elecCost?.toLocaleString()} đ</td>
                    </tr>
                    <tr className="bg-sky-50/40">
                      <td className="py-2 px-3 font-bold text-sky-900">3. Tiền nước</td>
                      <td className="py-2 px-3 text-sky-800 font-mono">
                        {viewingInvoice.waterOld} ➔ {viewingInvoice.waterNew} ({viewingInvoice.waterUsage} m³)
                      </td>
                      <td className="py-2 px-3 text-right text-sky-900">{waterRate.toLocaleString()} đ</td>
                      <td className="py-2 px-3 text-right font-black text-sky-900">{viewingInvoice.waterCost?.toLocaleString()} đ</td>
                    </tr>
                    {(wifiFee > 0 || trashFee > 0) && (
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">4. Dịch vụ chung</td>
                        <td className="py-2 px-3 text-slate-500">Wifi ({wifiFee.toLocaleString()}đ) + Rác ({trashFee.toLocaleString()}đ)</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{(wifiFee + trashFee).toLocaleString()} đ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng cộng & Bằng chữ */}
              <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/90">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-sm">TỔNG CỘNG THANH TOÁN:</span>
                  <span className="font-heading font-black text-2xl text-[#f97316]">
                    {Number(viewingInvoice.total).toLocaleString()} VNĐ
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 italic">
                  (Bằng chữ: <b>{docSoTienBangChu(Number(viewingInvoice.total))}</b>)
                </div>
              </div>

              {/* Thông tin chuyển khoản, MÃ VIETQR THẬT và Con dấu */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs gap-3">
                <div className="space-y-1 flex-1 text-left w-full sm:w-auto">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Tài khoản thanh toán:</span>
                  <span className="text-slate-600 block">Ngân hàng: <b>MB Bank (Quân Đội)</b></span>
                  <span className="text-slate-600 block">Số tài khoản: <b className="font-mono text-slate-900 text-sm">0907297338</b> (LE KHAI)</span>
                  <span className="text-slate-500 block text-[11px]">Nội dung CK: <b className="font-mono text-orange-600 font-bold">TT TIEN TRO {room.room_number || 'P101'} T{viewingInvoice.month}</b></span>
                </div>

                {/* Mã QR VietQR thanh toán quét trực tiếp - Tạo bằng QRCode Base64 đảm bảo 100% không bao giờ bể ảnh */}
                <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">MB Bank</span>
                    <span className="text-[9px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">VietQR</span>
                  </div>
                  {modalQrUrl ? (
                    <img 
                      src={modalQrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-24 h-24 object-contain rounded-lg shadow-2xs"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-slate-50 rounded-lg">
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    </div>
                  )}
                  <span className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-tight">Quét mã trả tiền</span>
                </div>

                {/* Con dấu trạng thái: KHÔNG CÓ DẤU TÍCH ĐÃ THU KHI MỚI GHI SỐ */}
                <div className={cn(
                  "px-3.5 py-2 rounded-2xl border-2 font-black text-xs uppercase tracking-widest text-center shrink-0 rotate-[-6deg]",
                  viewingInvoice.status === "paid"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/90 shadow-xs"
                    : "border-orange-500 text-orange-600 bg-orange-50/90 shadow-xs"
                )}>
                  {viewingInvoice.status === "paid" ? "✓ ĐÃ THU ĐỦ" : "⚠ CHƯA THU"}
                </div>
              </div>

              {/* Lời cảm ơn chân thành */}
              <div className="text-center text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                Cảm ơn bạn đã đồng hành cùng khu trọ! Vui lòng thanh toán trước ngày {viewingInvoice.dueDate || `10/${viewingInvoice.month}`}.
              </div>
            </div>

            {/* ── CÁC NÚT HÀNH ĐỘNG: COPY ẢNH GỬI ZALO, TẢI ẢNH, XUẤT PDF, COPY TEXT ── */}
            <div className="flex items-center justify-end gap-2 pt-4 flex-wrap no-print-area" data-html2canvas-ignore="true">
              
              {/* Nút 1: COPY ẢNH GỬI ZALO (TÍNH NĂNG CHÍNH ĐƯỢC YÊU CẦU) */}
              <Button
                type="button"
                disabled={isCapturingImage}
                onClick={async () => {
                  if (!invoiceCardRef.current) return;
                  try {
                    setIsCapturingImage(true);
                    const canvas = await html2canvas(invoiceCardRef.current, {
                      scale: 2,
                      useCORS: true,
                                            backgroundColor: "#ffffff",
                      logging: false
                    });
                    canvas.toBlob(async (blob) => {
                      if (!blob) {
                        alert("Không thể chụp ảnh, vui lòng thử nút Tải ảnh hoặc In PDF!");
                        setIsCapturingImage(false);
                        return;
                      }
                      try {
                        if (navigator.clipboard && window.ClipboardItem) {
                          await navigator.clipboard.write([
                            new ClipboardItem({ "image/png": blob })
                          ]);
                          alert("🎉 ĐÃ SAO CHÉP ẢNH HÓA ĐƠN VÀO BỘ NHỚ TẠM!\n\n👉 Bây giờ bạn chỉ cần mở khung chat Zalo của khách và bấm Ctrl + V (Dán) để gửi ảnh hóa đơn nét căng ngay lập tức.");
                        } else {
                          // Fallback tự động tải file ảnh
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `Hoa_Don_Thang_${viewingInvoice.month}_${room.room_number || 'P101'}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                          alert("Đã tự động tải file ảnh về máy! Bạn có thể kéo thả ảnh này vào Zalo để gửi cho khách.");
                        }
                      } catch (err) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `Hoa_Don_Thang_${viewingInvoice.month}_${room.room_number || 'P101'}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert("Đã tự động tải file ảnh về máy! Bạn có thể kéo thả ảnh này vào Zalo để gửi cho khách.");
                      } finally {
                        setIsCapturingImage(false);
                      }
                    }, "image/png");
                  } catch (e) {
                    console.error("Lỗi html2canvas:", e);
                    setIsCapturingImage(false);
                    alert("Không thể chụp ảnh tự động. Bạn hãy bấm 'Tải ảnh PNG' hoặc 'In hóa đơn' nhé!");
                  }
                }}
                className="rounded-xl font-black bg-[#f97316] hover:bg-[#ea580c] text-white text-xs h-9 shadow-md shadow-orange-500/20 flex items-center gap-1.5"
              >
                {isCapturingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo ảnh...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Copy ảnh gửi Zalo</span>
                  </>
                )}
              </Button>

              {/* Nút 2: TẢI ẢNH (.PNG) VỀ MÁY */}
              <Button
                type="button"
                variant="outline"
                disabled={isCapturingImage}
                onClick={async () => {
                  if (!invoiceCardRef.current) return;
                  try {
                    setIsCapturingImage(true);
                    const canvas = await html2canvas(invoiceCardRef.current, {
                      scale: 2,
                      useCORS: true,
                                            backgroundColor: "#ffffff",
                      logging: false
                    });
                    const dataUrl = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = dataUrl;
                    a.download = `Hoa_Don_Thang_${viewingInvoice.month}_${room.room_number || 'P101'}.png`;
                    a.click();
                    alert("🎉 Đã tải file ảnh hóa đơn PNG về máy!");
                  } catch (e) {
                    console.error("Lỗi tải ảnh:", e);
                  } finally {
                    setIsCapturingImage(false);
                  }
                }}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải ảnh PNG</span>
              </Button>

              {/* Nút 3: IN / XUẤT PDF */}
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-purple-600" />
                <span>In / Xuất PDF</span>
              </Button>

              {/* Nút 4: COPY NỘI DUNG VĂN BẢN ZALO */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const msg = `📋 HÓA ĐƠN TIỀN TRỌ THÁNG ${viewingInvoice.month}/${viewingInvoice.year} - PHÒNG ${room.room_number || 'P.101'}\n` +
                    `• Khách thuê: ${tenant?.name || 'Bạn'}\n` +
                    `• Tiền phòng: ${basePrice.toLocaleString()} đ\n` +
                    `• Điện (${viewingInvoice.elecOld} -> ${viewingInvoice.elecNew}): ${viewingInvoice.elecUsage} kWh = ${viewingInvoice.elecCost?.toLocaleString()} đ\n` +
                    `• Nước (${viewingInvoice.waterOld} -> ${viewingInvoice.waterNew}): ${viewingInvoice.waterUsage} m³ = ${viewingInvoice.waterCost?.toLocaleString()} đ\n` +
                    `• Dịch vụ (Wifi, Rác): ${(wifiFee + trashFee).toLocaleString()} đ\n` +
                    `👉 TỔNG CỘNG: ${Number(viewingInvoice.total).toLocaleString()} VNĐ (${docSoTienBangChu(Number(viewingInvoice.total))})\n` +
                    `💳 STK: 0907297338 MB Bank (LE KHAI)\n` +
                    `⏰ Hạn đóng: ${viewingInvoice.dueDate || `10/${viewingInvoice.month}`}`;
                  navigator.clipboard.writeText(msg);
                  alert("Đã sao chép nội dung văn bản hóa đơn!");
                }}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100 h-9 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy chữ</span>
              </Button>

              {/* Nút Đóng */}
              <Button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="rounded-xl font-bold text-xs bg-slate-900 text-white h-9 px-4"
              >
                Đóng
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Modal phóng to ảnh CCCD */}
      {zoomCccdPhoto && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setZoomCccdPhoto(null)}>
          <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-2 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setZoomCccdPhoto(null)} 
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={zoomCccdPhoto} alt="CCCD Phóng to" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
}
