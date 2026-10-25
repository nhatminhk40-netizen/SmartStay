import React, { useState, useEffect } from "react";
import {
  X, User, Phone, Mail, School, Calendar, ShieldCheck, Zap, Droplets,
  Wifi, Trash2, CheckCircle2, Clock, AlertCircle, Edit2, Plus, DollarSign,
  Send, Copy, Check, ExternalLink, ArrowRight, FileText, CheckCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RoomTenantAndMeterModal({
  open,
  onClose,
  room,
  onUpdateRoom
}) {
  if (!open || !room) return null;

  const roomId = room._id || room.id;
  const basePrice = Number(room.price) || 0;

  // Tab con trong modal
  const [activeSubTab, setActiveSubTab] = useState("meters"); // 'meters' | 'tenant' | 'history'

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

  // 1. Quản lý Khách thuê
  const [tenant, setTenant] = useState(room.tenant || null);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: room.tenant?.name || "",
    phone: room.tenant?.phone || "",
    email: room.tenant?.email || "",
    university: room.tenant?.university || "",
    startDate: room.tenant?.startDate || "",
    endDate: room.tenant?.endDate || "",
    depositAmount: room.tenant?.depositAmount || 0,
    notes: room.tenant?.notes || ""
  });

  // 2. Lịch sử hóa đơn theo tháng (Đã đóng / Chưa đóng) - Mặc định hoàn toàn trống nếu chưa có
  const [bills, setBills] = useState(Array.isArray(room.meterHistory) ? room.meterHistory : []);

  // 3. Form nhập công tơ mét tháng hiện tại (Mặc định 0 và ngày tháng hiện tại)
  const latestBill = bills[0] || null;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [meterForm, setMeterForm] = useState({
    month: currentMonth,
    year: currentYear,
    elecOld: latestBill ? (latestBill.elecNew ?? latestBill.elecOld ?? 0) : 0,
    elecNew: latestBill ? (latestBill.elecNew ?? 0) : 0,
    waterOld: latestBill ? (latestBill.waterNew ?? latestBill.waterOld ?? 0) : 0,
    waterNew: latestBill ? (latestBill.waterNew ?? 0) : 0,
  });

  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Tính toán số tiêu thụ & thành tiền
  const elecUsage = Math.max(0, Number(meterForm.elecNew) - Number(meterForm.elecOld));
  const elecCost = elecUsage * elecRate;

  const waterUsage = Math.max(0, Number(meterForm.waterNew) - Number(meterForm.waterOld));
  const waterCost = isWaterByPerson ? waterRate : (waterUsage * waterRate);

  const monthTotal = basePrice + elecCost + waterCost + wifiFee + trashFee;

  // Lưu chỉ số công tơ mét & Cập nhật hóa đơn tháng
  const handleSaveMeters = () => {
    const updatedBills = [...bills];
    const existingIndex = updatedBills.findIndex(b => b.month === Number(meterForm.month) && b.year === Number(meterForm.year));

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
      status: existingIndex !== -1 ? updatedBills[existingIndex].status : "unpaid",
      dueDate: `10/${meterForm.month}/${meterForm.year}`
    };

    if (existingIndex !== -1) {
      updatedBills[existingIndex] = { ...updatedBills[existingIndex], ...billObj };
    } else {
      updatedBills.unshift(billObj);
    }

    setBills(updatedBills);

    // Đồng bộ lại phòng
    const updatedRoom = {
      ...room,
      meterHistory: updatedBills,
      tenant: tenant
    };
    onUpdateRoom?.(updatedRoom);

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Đổi trạng thái đóng tiền (Đã đóng <-> Chưa đóng)
  const handleToggleBillStatus = (month, year) => {
    const updatedBills = bills.map(b => {
      if (b.month === month && b.year === year) {
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

  // Lưu thông tin khách thuê
  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name.trim() || !tenantForm.phone.trim()) {
      alert("Vui lòng nhập tên và số điện thoại của người thuê!");
      return;
    }

    const updatedTenant = {
      name: tenantForm.name.trim(),
      phone: tenantForm.phone.trim(),
      email: tenantForm.email.trim(),
      university: tenantForm.university.trim(),
      startDate: tenantForm.startDate,
      endDate: tenantForm.endDate,
      depositAmount: Number(tenantForm.depositAmount) || basePrice,
      notes: tenantForm.notes.trim()
    };

    setTenant(updatedTenant);
    setIsEditingTenant(false);

    const updatedRoom = {
      ...room,
      status: "rented", // Tự động chuyển phòng sang Đang cho thuê
      tenant: updatedTenant,
      meterHistory: bills
    };
    onUpdateRoom?.(updatedRoom);
  };

  // Trả phòng (Xóa khách thuê)
  const handleRemoveTenant = () => {
    if (!window.confirm(`Xác nhận khách ${tenant.name} đã trả phòng này?\nPhòng sẽ được chuyển về trạng thái 'Còn phòng'.`)) return;

    setTenant(null);
    setIsEditingTenant(false);

    const updatedRoom = {
      ...room,
      status: "available",
      tenant: null,
      meterHistory: bills
    };
    onUpdateRoom?.(updatedRoom);
  };

  // Copy hóa đơn gửi Zalo/SMS cho khách
  const handleCopyZaloInvoice = (bill) => {
    const text = `🏡 [SMARTSTAY] THÔNG BÁO TIỀN PHÒNG THÁNG ${bill.month}/${bill.year}
Phòng: ${room.title}
Khách thuê: ${tenant?.name || "Bạn thuê"}

1. Tiền phòng: ${Number(bill.roomCost).toLocaleString()} đ
2. Tiền điện (${bill.elecOld} -> ${bill.elecNew} = ${bill.elecUsage} kWh x ${elecRate.toLocaleString()}đ): ${Number(bill.elecCost).toLocaleString()} đ
3. Tiền nước (${bill.waterOld} -> ${bill.waterNew} = ${bill.waterUsage} m³ x ${waterRate.toLocaleString()}đ): ${Number(bill.waterCost).toLocaleString()} đ
4. Internet / Wifi: ${Number(bill.wifiCost).toLocaleString()} đ
5. Rác & Vệ sinh: ${Number(bill.trashCost).toLocaleString()} đ
----------------------------
👉 TỔNG CỘNG: ${Number(bill.total).toLocaleString()} đ
Trạng thái: ${bill.status === "paid" ? "✅ ĐÃ THANH TOÁN" : "⏳ CHƯA THANH TOÁN (Hạn trước " + (bill.dueDate || "10 hàng tháng") + ")"}

Chủ trọ: ${room.contactPhone || "Vui lòng liên hệ chủ trọ"}`;

    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-[26px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-slate-100">
        
        {/* ── HEADER MODAL ── */}
        <div className="px-6 py-4 bg-[#fdfbf7] border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-heading font-black text-slate-900 text-lg sm:text-xl truncate">
                {room.title}
              </h3>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0",
                tenant ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              )}>
                {tenant ? "● Đang có khách ở" : "● Phòng trống"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
              {room.address || room.campus} · {room.area_sqm || room.area || 20}m² · Đơn giá: <b className="text-[#f97316]">{Number(basePrice).toLocaleString()}đ/tháng</b>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/phong-tro/${roomId}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Mở trang xem tin phòng của sinh viên"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang tin</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── TAB NAVIGATION ── */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("meters")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5",
              activeSubTab === "meters"
                ? "bg-[#f97316] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Nhập số Điện & Nước (Công tơ mét)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5",
              activeSubTab === "history"
                ? "bg-[#f97316] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Tình trạng đóng tiền theo tháng ({bills.filter(b => b.status === "unpaid").length > 0 ? `${bills.filter(b => b.status === "unpaid").length} chưa đóng` : "Đã xong"})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("tenant")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5",
              activeSubTab === "tenant"
                ? "bg-[#f97316] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>3. Thông tin người ở ({tenant ? tenant.name : "Chưa có"})</span>
          </button>
        </div>

        {/* ── MODAL BODY (SCROLLABLE) ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#fdfbf7]">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: NHẬP SỐ ĐIỆN NƯỚC (CÔNG TƠ MÉT)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "meters" && (
            <div className="space-y-5">
              
              {/* Thanh chọn tháng & thông báo */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f97316] flex items-center justify-center font-black">
                    #{meterForm.month}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ghi chỉ số tháng {meterForm.month}/{meterForm.year}</h4>
                    <p className="text-xs text-slate-500">Chủ trọ nhập số công tơ mét mới, hệ thống tự động tính thành tiền ngay lập tức</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={meterForm.month}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const existing = bills.find(b => b.month === m && b.year === meterForm.year);
                      setMeterForm(prev => ({
                        ...prev,
                        month: m,
                        elecOld: existing ? existing.elecOld : (bills[0]?.elecNew || 1205),
                        elecNew: existing ? existing.elecNew : (bills[0]?.elecNew ? bills[0].elecNew + 80 : 1290),
                        waterOld: existing ? existing.waterOld : (bills[0]?.waterNew || 86),
                        waterNew: existing ? existing.waterNew : (bills[0]?.waterNew ? bills[0].waterNew + 5 : 91),
                      }));
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 focus:outline-none focus:border-[#f97316]"
                  >
                    {[11, 10, 9, 8, 7, 6].map(m => (
                      <option key={m} value={m}>Tháng {m}/2026</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2 BOX NHẬP CÔNG TƠ MÉT ĐIỆN & NƯỚC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. CÔNG TƠ ĐIỆN */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 fill-amber-500" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">Công tơ Điện (kWh)</span>
                        <span className="text-[11px] text-slate-500 font-medium">Đơn giá: <b className="text-amber-700">{elecRate.toLocaleString()} đ / kWh</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Số cũ (tháng trước)</label>
                      <input 
                        type="number" 
                        value={meterForm.elecOld}
                        onChange={(e) => setMeterForm({ ...meterForm, elecOld: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Số mới (tháng này) *</label>
                      <input 
                        type="number" 
                        value={meterForm.elecNew}
                        onChange={(e) => setMeterForm({ ...meterForm, elecNew: e.target.value })}
                        className="w-full p-2.5 rounded-xl border-2 border-amber-400 bg-amber-50/30 font-black text-amber-900 text-sm focus:outline-none focus:border-amber-600"
                        placeholder="Nhập số trên đồng hồ"
                      />
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
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Droplets className="w-4 h-4 fill-blue-500" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">Đồng hồ Nước ({isWaterByPerson ? "Người" : "Khối m³"})</span>
                        <span className="text-[11px] text-slate-500 font-medium">Đơn giá: <b className="text-blue-700">{waterRate.toLocaleString()} đ / {isWaterByPerson ? "người" : "khối"}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Số cũ (tháng trước)</label>
                      <input 
                        type="number" 
                        value={meterForm.waterOld}
                        onChange={(e) => setMeterForm({ ...meterForm, waterOld: e.target.value })}
                        disabled={isWaterByPerson}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-700 mb-1">Số mới (tháng này) *</label>
                      <input 
                        type="number" 
                        value={meterForm.waterNew}
                        onChange={(e) => setMeterForm({ ...meterForm, waterNew: e.target.value })}
                        disabled={isWaterByPerson}
                        className="w-full p-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/30 font-black text-blue-900 text-sm focus:outline-none focus:border-blue-600 disabled:opacity-60"
                        placeholder="Nhập số trên đồng hồ"
                      />
                    </div>
                  </div>

                  {/* Kết quả tính tiền nước */}
                  <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-600">{isWaterByPerson ? "Hình thức:" : "Tiêu thụ:"}</span> <b className="text-blue-900 font-bold">{isWaterByPerson ? "Khoán theo đầu người" : `${waterUsage} khối (m³)`}</b>
                    </div>
                    <div>
                      <span className="text-slate-600">Thành tiền:</span> <b className="text-blue-700 text-sm font-black ml-1">{waterCost.toLocaleString()} đ</b>
                    </div>
                  </div>
                </div>

              </div>

              {/* TỔNG KẾT PHIẾU THU THÁNG */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 text-sm">Bảng chi tiết phiếu thu tháng {meterForm.month}/{meterForm.year}:</span>
                  <span className="text-xs font-semibold text-slate-500">Khách thuê: <b className="text-slate-900">{tenant?.name || "Chưa gán khách"}</b></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">1. Tiền phòng:</span>
                    <span className="font-bold text-slate-800 text-sm">{basePrice.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">2. Tiền điện ({elecUsage} kWh):</span>
                    <span className="font-bold text-amber-700 text-sm">{elecCost.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">3. Tiền nước ({waterUsage} khối):</span>
                    <span className="font-bold text-blue-700 text-sm">{waterCost.toLocaleString()} đ</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">4. Wifi & Rác:</span>
                    <span className="font-bold text-emerald-700 text-sm">{(wifiFee + trashFee).toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Tổng tiền phải thu tháng {meterForm.month}:</span>
                    <div className="font-heading font-black text-2xl text-[#f97316]">
                      {monthTotal.toLocaleString()} VNĐ
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveMeters}
                      className="rounded-xl font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-5 shadow-md shadow-orange-500/20 text-xs h-10 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu chỉ số & Tạo hóa đơn</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopyZaloInvoice({
                        month: meterForm.month,
                        year: meterForm.year,
                        roomCost: basePrice,
                        elecOld: meterForm.elecOld,
                        elecNew: meterForm.elecNew,
                        elecUsage,
                        elecCost,
                        waterOld: meterForm.waterOld,
                        waterNew: meterForm.waterNew,
                        waterUsage,
                        waterCost,
                        wifiCost: wifiFee,
                        trashCost: trashFee,
                        total: monthTotal,
                        status: "unpaid"
                      })}
                      className="rounded-xl border-slate-300 font-bold text-xs h-10 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      {copiedInvoice ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedInvoice ? "Đã copy!" : "Copy gửi Zalo"}</span>
                    </Button>
                  </div>
                </div>

                {saveSuccessNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Đã lưu chỉ số công tơ mét & cập nhật hóa đơn tháng {meterForm.month}/{meterForm.year} thành công!</span>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: LỊCH SỬ ĐÓNG TIỀN THEO THÁNG (ĐÃ ĐÓNG / CHƯA ĐÓNG)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Danh sách đóng tiền theo từng tháng</h4>
                  <p className="text-xs text-slate-500">Xem ngay tháng nào đã đóng, tháng nào chưa đóng. Nhấn vào trạng thái để đổi nhanh.</p>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                  <p className="font-bold text-slate-800 text-sm">Chưa có hóa đơn nào cho phòng này</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Hãy chuyển sang tab "Chỉ số điện nước" để nhập số công tơ mét và tạo hóa đơn đầu tiên.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill, index) => {
                    const isPaid = bill.status === "paid";
                    return (
                      <div
                        key={`${bill.month}-${bill.year}`}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                          isPaid ? "bg-white border-slate-200" : "bg-orange-50/50 border-orange-200/80 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-heading shrink-0 shadow-inner",
                            isPaid ? "bg-slate-100 text-slate-700" : "bg-orange-500 text-white shadow-orange-500/30"
                          )}>
                            <span className="text-[10px] uppercase font-bold leading-tight">Tháng</span>
                            <span className="text-base font-black leading-none">{bill.month}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">Tiền phòng Tháng {bill.month}/{bill.year}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                isPaid ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                              )}>
                                {isPaid ? "✓ ĐÃ ĐÓNG" : "⚠ CHƯA ĐÓNG"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1 font-medium">
                              <span>Điện: <b className="text-amber-800">{bill.elecUsage} kWh</b> ({Number(bill.elecCost).toLocaleString()}đ)</span>
                              <span>•</span>
                              <span>Nước: <b className="text-blue-800">{bill.waterUsage} m³</b> ({Number(bill.waterCost).toLocaleString()}đ)</span>
                              {isPaid && bill.paidDate && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold">Đã thu: {bill.paidDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <div className="font-heading font-black text-lg text-slate-900">
                              {Number(bill.total).toLocaleString()} đ
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isPaid ? "Đã thanh toán đủ" : `Hạn đóng: ${bill.dueDate || "10 hàng tháng"}`}
                            </span>
                          </div>

                          {/* Nút 1-chạm đổi trạng thái đóng tiền */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleToggleBillStatus(bill.month, bill.year)}
                              className={cn(
                                "rounded-xl font-bold text-xs h-9 px-3.5 transition",
                                isPaid
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              )}
                            >
                              {isPaid ? "Đổi sang Chưa thu" : "✓ Đánh dấu ĐÃ THU"}
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleCopyZaloInvoice(bill)}
                              className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                              title="Copy tin nhắn hóa đơn gửi Zalo cho khách"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: THÔNG TIN KHÁCH THUÊ (NGƯỜI Ở)
             ══════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "tenant" && (
            <div className="space-y-4">
              
              {/* Nếu đã có khách và không ở chế độ sửa */}
              {tenant && !isEditingTenant ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#f97316] flex items-center justify-center font-black text-xl">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-slate-900 text-lg flex items-center gap-2">
                          <span>{tenant.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                            Đang ở
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{tenant.university || "Sinh viên tại Cần Thơ"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTenantForm({
                            name: tenant.name,
                            phone: tenant.phone,
                            email: tenant.email || "",
                            university: tenant.university || "",
                            startDate: tenant.startDate || "",
                            endDate: tenant.endDate || "",
                            depositAmount: tenant.depositAmount || basePrice,
                            notes: tenant.notes || ""
                          });
                          setIsEditingTenant(true);
                        }}
                        className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 h-8 px-3"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa thông tin
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveTenant}
                        className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold h-8 px-3"
                      >
                        Khách trả phòng
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Thông tin liên lạc</span>
                      <div className="flex items-center gap-2 text-slate-600 font-semibold">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>SĐT: <a href={`tel:${tenant.phone}`} className="text-emerald-700 font-bold hover:underline">{tenant.phone}</a></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span>Email: <b className="text-slate-800">{tenant.email || "Chưa cập nhật"}</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <School className="w-4 h-4 text-purple-500" />
                        <span>Trường: <b className="text-slate-800">{tenant.university || "ĐH Cần Thơ"}</b></span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">Hợp đồng & Tiền cọc</span>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-[#f97316]" />
                        <span>Thời hạn: <b className="text-slate-800">{tenant.startDate} ➔ {tenant.endDate}</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Tiền cọc giữ chân: <b className="text-[#f97316] font-bold">{Number(tenant.depositAmount || basePrice).toLocaleString()} đ</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Ghi chú: {tenant.notes || "Không có ghi chú thêm"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM THÊM / SỬA KHÁCH THUÊ */
                <form onSubmit={handleSaveTenant} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{tenant ? "Cập nhật thông tin khách thuê" : "+ Thêm / Gán khách thuê vào phòng này"}</h4>
                      <p className="text-xs text-slate-500">Nhập thông tin người ở để quản lý và gửi thông báo hóa đơn tự động</p>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường học / Nơi làm việc</label>
                      <input 
                        type="text" 
                        value={tenantForm.university}
                        onChange={(e) => setTenantForm({ ...tenantForm, university: e.target.value })}
                        placeholder="Ví dụ: ĐH Cần Thơ / FPT Cần Thơ"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
                      <input 
                        type="number" 
                        value={tenantForm.depositAmount}
                        onChange={(e) => setTenantForm({ ...tenantForm, depositAmount: e.target.value })}
                        placeholder="Ví dụ: 2500000"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm text-[#f97316] focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu vào ở</label>
                      <input 
                        type="text" 
                        value={tenantForm.startDate}
                        onChange={(e) => setTenantForm({ ...tenantForm, startDate: e.target.value })}
                        placeholder="Ví dụ: 01/08/2026"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hết hạn hợp đồng</label>
                      <input 
                        type="text" 
                        value={tenantForm.endDate}
                        onChange={(e) => setTenantForm({ ...tenantForm, endDate: e.target.value })}
                        placeholder="Ví dụ: 01/08/2027"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-[#f97316]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button 
                      type="submit" 
                      className="rounded-xl font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-6 text-xs h-10 shadow-md shadow-orange-500/20"
                    >
                      {tenant ? "Lưu thay đổi thông tin khách" : "+ Xác nhận thêm khách vào phòng"}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Phòng: <b className="text-slate-800">{room.title}</b> · Trạng thái: <b className={tenant ? "text-blue-600" : "text-emerald-600"}>{tenant ? "Đang cho thuê" : "Còn phòng"}</b>
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
    </div>
  );
}
