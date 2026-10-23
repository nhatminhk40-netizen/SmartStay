import React, { useState, useEffect } from "react";
import {
  Receipt, Plus, CheckCircle, Clock, AlertCircle, FileText,
  DollarSign, Zap, Droplets, Camera, ExternalLink, Search, RefreshCw, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InvoiceManager() {
  const [bills, setBills] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Modal xem ảnh công tơ

  // Form tạo hóa đơn mới
  const [formData, setFormData] = useState({
    contractId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: "",
    electricPrevious: 0,
    electricCurrent: 0,
    electricPhoto: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
    waterPrevious: 0,
    waterCurrent: 0,
    waterPhoto: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    otherFees: [
      { name: "Tiền rác & Vệ sinh", amount: 30000 },
      { name: "Internet / Wifi", amount: 50000 }
    ],
    note: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsData, contractsRes] = await Promise.all([
        base44.bills.landlordList(),
        base44.contracts.list()
      ]);
      setBills(billsData || []);
      setContracts(contractsRes?.data || contractsRes || []);
    } catch (err) {
      console.error("Lỗi tải hóa đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính toán thời gian thực khi chọn hợp đồng & nhập số điện nước
  const selectedContract = contracts.find(c => c._id === formData.contractId || c.id === formData.contractId);
  const rentPrice = selectedContract?.monthlyRent || 0;
  const electricPrice = selectedContract?.electricPrice || 3500;
  const waterPrice = selectedContract?.waterPrice || 20000;

  const electricUsage = Math.max(0, (Number(formData.electricCurrent) || 0) - (Number(formData.electricPrevious) || 0));
  const electricTotal = electricUsage * electricPrice;

  const waterUsage = Math.max(0, (Number(formData.waterCurrent) || 0) - (Number(formData.waterPrevious) || 0));
  const waterTotal = waterUsage * waterPrice;

  const otherTotal = formData.otherFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const estimatedTotal = rentPrice + electricTotal + waterTotal + otherTotal;

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!formData.contractId) {
      alert("Vui lòng chọn hợp đồng thuê phòng!");
      return;
    }
    setSubmitting(true);
    setStatusMessage("");
    try {
      const res = await base44.bills.create(formData);
      if (res.success) {
        setStatusMessage("Lập hóa đơn thành công!");
        setCreateOpen(false);
        loadData();
      } else {
        alert(res.message || "Không thể tạo hóa đơn.");
      }
    } catch (err) {
      alert("Lỗi khi tạo hóa đơn: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBill = async (billId) => {
    if (!confirm("Bạn xác nhận đã nhận đủ tiền phòng & điện nước của hóa đơn này?")) return;
    try {
      const res = await base44.bills.confirm(billId);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Xác nhận thất bại.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch = search === "" ||
      b.room?.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant?.phone?.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-[#f4ebd9] shadow-sm">
        <div>
          <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#f97316]" />
            Hóa đơn Tiền trọ & Điện nước minh bạch
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Gắn ảnh chụp đồng hồ điện & nước thực tế, bảo vệ quyền lợi sinh viên và chủ trọ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-full border-slate-200 text-slate-600 font-bold"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} /> Tải lại
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold shadow-md shadow-[#f97316]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Lập hóa đơn mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white p-1 rounded-full border border-[#f4ebd9]">
          {[
            { id: "all", label: "Tất cả" },
            { id: "unpaid", label: "Chưa thu" },
            { id: "paid", label: "Khách đã chuyển" },
            { id: "confirmed", label: "Đã hoàn tất" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                filterStatus === f.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-[#f97316]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto bg-white border border-[#f4ebd9] rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên khách, phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs font-medium w-44"
          />
        </div>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold bg-white rounded-[24px] border border-[#f4ebd9]">
          Đang tải danh sách hóa đơn...
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#f4ebd9]">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-[#f97316] flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-900 text-lg">Chưa có hóa đơn nào</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bấm nút "Lập hóa đơn mới" ở trên để ghi chỉ số điện nước và gửi hóa đơn minh bạch cho người thuê.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBills.map(bill => {
            const isUnpaid = bill.status === "unpaid";
            const isPaid = bill.status === "paid";
            const isConfirmed = bill.status === "confirmed";

            return (
              <div
                key={bill._id}
                className="bg-white rounded-[24px] p-5 border border-[#f4ebd9] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">
                          Tháng {bill.month}/{bill.year}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                          isConfirmed ? "bg-emerald-100 text-emerald-800" :
                          isPaid ? "bg-blue-100 text-blue-800" :
                          "bg-amber-100 text-amber-800"
                        )}>
                          {isConfirmed ? "Đã thu tiền" : isPaid ? "Khách đã thanh toán" : "Chưa thu"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        Phòng: {bill.room?.title || "Phòng trọ"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Khách: <span className="font-semibold text-slate-700">{bill.tenant?.fullName || "Chưa rõ"}</span> ({bill.tenant?.phone || "N/A"})
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-400">Tổng tiền</div>
                      <div className="font-heading font-black text-xl text-[#f97316]">
                        {Number(bill.totalAmount).toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>

                  {/* Chi tiết điện nước minh bạch */}
                  <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                    {/* Điện */}
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
                      <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-600" /> Điện: {bill.electric?.usage || 0} kWh
                        </span>
                        <span>{Number(bill.electric?.total || 0).toLocaleString()}đ</span>
                      </div>
                      <div className="text-[11px] text-amber-700/80">
                        Số cũ: {bill.electric?.previousNumber || 0} ➔ Số mới: {bill.electric?.currentNumber || 0}
                      </div>
                      {bill.electric?.meterPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({ title: "Ảnh chụp công tơ điện", url: bill.electric.meterPhotoUrl })}
                          className="mt-2 text-[10px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 underline"
                        >
                          <Camera className="w-3 h-3" /> Xem ảnh công tơ điện
                        </button>
                      )}
                    </div>

                    {/* Nước */}
                    <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100/60">
                      <div className="flex items-center justify-between font-bold text-cyan-900 mb-1">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-cyan-600" /> Nước: {bill.water?.usage || 0} m³
                        </span>
                        <span>{Number(bill.water?.total || 0).toLocaleString()}đ</span>
                      </div>
                      <div className="text-[11px] text-cyan-700/80">
                        Số cũ: {bill.water?.previousNumber || 0} ➔ Số mới: {bill.water?.currentNumber || 0}
                      </div>
                      {bill.water?.meterPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({ title: "Ảnh chụp đồng hồ nước", url: bill.water.meterPhotoUrl })}
                          className="mt-2 text-[10px] font-bold text-cyan-800 hover:text-cyan-900 flex items-center gap-1 underline"
                        >
                          <Camera className="w-3 h-3" /> Xem ảnh đồng hồ nước
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tiền phòng & Phụ phí */}
                  <div className="text-[11px] text-slate-500 flex justify-between px-1">
                    <span>Tiền phòng gốc: <b>{Number(bill.monthlyRent).toLocaleString()}đ</b></span>
                    <span>Phụ phí khác: <b>{Number(bill.otherFees?.reduce((s, i) => s + (i.amount || 0), 0) || 0).toLocaleString()}đ</b></span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    Hạn: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("vi-VN") : "Trong 5 ngày"}
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto({ title: "Biên lai thanh toán của khách", url: bill.paymentProofUrl })}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Xem biên lai
                      </button>
                    )}

                    {isPaid && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmBill(bill._id)}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Xác nhận đã nhận tiền
                      </Button>
                    )}

                    {isConfirmed && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Hoàn tất
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TẠO HÓA ĐƠN MỚI */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fdfbf7]">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900">Lập Hóa Đơn Tiền Trọ & Điện Nước</h3>
                <p className="text-xs text-slate-500 font-semibold">Minh bạch chỉ số và ảnh chụp công tơ thực tế</p>
              </div>
              <button onClick={() => setCreateOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
              {/* Chọn Hợp đồng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn phòng / Hợp đồng đang hiệu lực *
                </label>
                <select
                  required
                  value={formData.contractId}
                  onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:border-[#f97316] focus:outline-none"
                >
                  <option value="">-- Chọn hợp đồng thuê phòng --</option>
                  {contracts.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.room?.title || "Phòng trọ"} - Khách: {c.tenant?.fullName || "Sinh viên"} ({Number(c.monthlyRent).toLocaleString()}đ/tháng)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tháng & Năm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tháng</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Năm</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Chỉ số ĐIỆN & Ảnh công tơ */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" /> Chỉ số điện (Đơn giá: {electricPrice.toLocaleString()}đ/kWh)
                  </span>
                  <span className="text-xs font-black text-amber-800">
                    Dùng: {electricUsage} kWh = {electricTotal.toLocaleString()}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Chỉ số cũ</label>
                    <input
                      type="number"
                      value={formData.electricPrevious}
                      onChange={(e) => setFormData({ ...formData, electricPrevious: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-amber-200 bg-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Chỉ số mới</label>
                    <input
                      type="number"
                      value={formData.electricCurrent}
                      onChange={(e) => setFormData({ ...formData, electricCurrent: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-amber-200 bg-white font-bold text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> URL Ảnh chụp đồng hồ điện (Minh bạch)
                  </label>
                  <input
                    type="text"
                    value={formData.electricPhoto}
                    onChange={(e) => setFormData({ ...formData, electricPhoto: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-amber-200 bg-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* Chỉ số NƯỚC & Ảnh công tơ */}
              <div className="p-4 bg-cyan-50/70 border border-cyan-200/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-950 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" /> Chỉ số nước (Đơn giá: {waterPrice.toLocaleString()}đ/m³)
                  </span>
                  <span className="text-xs font-black text-cyan-800">
                    Dùng: {waterUsage} m³ = {waterTotal.toLocaleString()}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-900 mb-1">Chỉ số cũ</label>
                    <input
                      type="number"
                      value={formData.waterPrevious}
                      onChange={(e) => setFormData({ ...formData, waterPrevious: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-cyan-200 bg-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-900 mb-1">Chỉ số mới</label>
                    <input
                      type="number"
                      value={formData.waterCurrent}
                      onChange={(e) => setFormData({ ...formData, waterCurrent: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-cyan-200 bg-white font-bold text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-cyan-900 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> URL Ảnh chụp đồng hồ nước (Minh bạch)
                  </label>
                  <input
                    type="text"
                    value={formData.waterPhoto}
                    onChange={(e) => setFormData({ ...formData, waterPhoto: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-cyan-200 bg-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* Tóm tắt ước tính */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Tổng thanh toán dự kiến</div>
                  <div className="text-sm font-semibold">
                    Tiền phòng ({rentPrice.toLocaleString()}đ) + Điện ({electricTotal.toLocaleString()}đ) + Nước ({waterTotal.toLocaleString()}đ) + Khác ({otherTotal.toLocaleString()}đ)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-black text-2xl text-[#f97316]">
                    {estimatedTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-8 shadow-lg shadow-[#f97316]/20"
                >
                  {submitting ? "Đang lưu..." : "Phát hành hóa đơn"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH CÔNG TƠ / BIÊN LAI */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <h4 className="font-bold text-slate-900">{selectedPhoto.title}</h4>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img src={selectedPhoto.url} alt="Proof" className="max-h-full object-contain rounded-xl shadow-sm" />
            </div>
            <div className="p-3 bg-white text-right">
              <Button size="sm" onClick={() => setSelectedPhoto(null)} className="rounded-full font-bold">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
