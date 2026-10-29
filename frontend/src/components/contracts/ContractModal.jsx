import React, { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Home, User, ShieldCheck, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function ContractModal({ open, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData);

  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [roomId, setRoomId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationMonths, setDurationMonths] = useState(6);
  const [monthlyRent, setMonthlyRent] = useState(2000000);
  const [depositAmount, setDepositAmount] = useState(2000000);
  const [depositStatus, setDepositStatus] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [paymentDay, setPaymentDay] = useState(5);
  const [electricPrice, setElectricPrice] = useState(3500);
  const [waterPrice, setWaterPrice] = useState(20000);
  const [terms, setTerms] = useState(
    "Hai bên cam kết thực hiện đúng nội quy phòng trọ, thanh toán tiền thuê trước ngày quy định hàng tháng, không gây ồn ào sau 23h và bảo quản thiết bị trong phòng."
  );

  // Tính ngày kết thúc tự động
  const calculateEndDate = (start, months) => {
    if (!start || !months) return "";
    const d = new Date(start);
    if (isNaN(d.getTime())) return "";
    d.setMonth(d.getMonth() + Number(months));
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Load phòng & khách thuê
  useEffect(() => {
    if (!open) return;
    setErrorMsg("");
    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        const [roomsList, tenantsList] = await Promise.all([
          base44.contracts.lookupRooms(),
          base44.contracts.lookupTenants()
        ]);
        setRooms(roomsList || []);
        setTenants(tenantsList || []);

        if (initialData) {
          setRoomId(initialData.room?._id || initialData.room?.id || initialData.room || "");
          setTenantId(initialData.tenant?._id || initialData.tenant?.id || initialData.tenant || "");
          setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "");
          setDurationMonths(initialData.durationMonths || 6);
          setMonthlyRent(initialData.monthlyRent || 0);
          setDepositAmount(initialData.deposit?.amount || 0);
          setDepositStatus(initialData.deposit?.status || "unpaid");
          setPaymentMethod(initialData.deposit?.paymentMethod || "transfer");
          setPaymentDay(initialData.paymentDay || 5);
          setElectricPrice(initialData.electricPrice || 3500);
          setWaterPrice(initialData.waterPrice || 20000);
          setTerms(initialData.terms || "");
        } else {
          // Reset mặc định khi tạo mới
          const firstAvailableRoom = (roomsList || []).find(r => r.status !== "rented") || (roomsList || [])[0];
          if (firstAvailableRoom) {
            setRoomId(firstAvailableRoom._id || firstAvailableRoom.id);
            setMonthlyRent(firstAvailableRoom.price || 2000000);
            setDepositAmount(firstAvailableRoom.price || 2000000);
          }
          if (tenantsList && tenantsList[0]) {
            setTenantId(tenantsList[0]._id || tenantsList[0].id);
          }
        }
      } catch (err) {
        setErrorMsg("Không thể tải danh sách phòng và khách thuê: " + err.message);
      } finally {
        setLoadingLookups(false);
      }
    };

    loadLookups();
  }, [open, initialData]);

  // Khi chọn phòng, tự động cập nhật giá thuê gợi ý và tiền cọc
  const handleRoomChange = (e) => {
    const selectedId = e.target.value;
    setRoomId(selectedId);
    const found = rooms.find(r => (r._id || r.id) === selectedId);
    if (found && found.price) {
      setMonthlyRent(found.price);
      setDepositAmount(found.price);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!roomId) {
      setErrorMsg("Vui lòng chọn phòng trọ.");
      return;
    }
    if (!tenantId) {
      setErrorMsg("Vui lòng chọn khách thuê.");
      return;
    }
    if (!startDate) {
      setErrorMsg("Vui lòng chọn ngày bắt đầu hợp đồng.");
      return;
    }
    if (Number(durationMonths) < 1) {
      setErrorMsg("Thời hạn hợp đồng tối thiểu là 1 tháng.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roomId,
        tenantId,
        startDate,
        durationMonths: Number(durationMonths),
        monthlyRent: Number(monthlyRent),
        depositAmount: Number(depositAmount),
        depositStatus,
        paymentMethod,
        paymentDay: Number(paymentDay),
        electricPrice: Number(electricPrice),
        waterPrice: Number(waterPrice),
        terms
      };

      if (isEdit) {
        await base44.contracts.update(initialData._id || initialData.id, payload);
      } else {
        await base44.contracts.create(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Thao tác không thành công.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-[#f4ebd9]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div>
            <h3 className="font-heading font-black text-lg text-slate-900">
              {isEdit ? "Chỉnh sửa hợp đồng thuê phòng" : "Tạo hợp đồng thuê phòng mới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý kỳ hạn, số tiền cọc và điều khoản pháp lý rõ ràng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Chọn phòng & Khách thuê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Home className="w-3.5 h-3.5 text-orange-600" />
                <span>Phòng trọ *</span>
              </Label>
              <select
                required
                value={roomId}
                onChange={handleRoomChange}
                disabled={isEdit || loadingLookups}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-100"
              >
                {rooms.length === 0 ? (
                  <option value="">Đang tải phòng...</option>
                ) : (
                  rooms.map((r) => {
                    const isRented = r.status === "rented";
                    return (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.title} - {Number(r.price).toLocaleString("vi-VN")}đ {isRented ? "(Đang thuê)" : "(Phòng trống)"}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-orange-600" />
                <span>Bên thuê (Người thuê) *</span>
              </Label>
              <select
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                disabled={isEdit || loadingLookups}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-orange-500 disabled:bg-slate-100"
              >
                {tenants.length === 0 ? (
                  <option value="">Đang tải danh sách khách...</option>
                ) : (
                  tenants.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.fullName} - {t.phone || t.email} ({t.campus || "Cần Thơ"})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Kỳ hạn & Ngày kết thúc tự tính */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Thời hạn thuê & Chu kỳ thanh toán
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Thời hạn (Tháng) *</Label>
                <div className="flex gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    required
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                  <div className="flex gap-1">
                    {[6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMonths(m)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                          durationMonths === m
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {m}T
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Ngày kết thúc (Tự tính)</Label>
                <div className="h-10 px-3 rounded-xl bg-orange-50/70 border border-orange-200 text-orange-800 text-xs font-black flex items-center">
                  {calculateEndDate(startDate, durationMonths) || "Chưa xác định"}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Ngày thu tiền trọ định kỳ:</span>
              <div className="flex items-center gap-1.5">
                <span>Ngày</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  className="w-14 h-8 px-2 text-center rounded-lg border border-slate-200 text-xs font-bold"
                />
                <span className="text-slate-500">hàng tháng</span>
              </div>
            </div>
          </div>

          {/* Tiền thuê & Tiền cọc */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Chi phí & Tiền cọc bảo đảm
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Giá thuê (VNĐ/tháng) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="h-10 text-xs rounded-xl font-bold text-orange-600"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Tiền cọc phòng (VNĐ) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-10 text-xs rounded-xl font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Trạng thái thu cọc</Label>
                <select
                  value={depositStatus}
                  onChange={(e) => setDepositStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="unpaid">Chưa thu cọc (Khách nợ)</option>
                  <option value="paid">Đã thu cọc (Đang giữ)</option>
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-600 mb-1 block">Hình thức nhận cọc</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="transfer">Chuyển khoản ngân hàng</option>
                  <option value="cash">Tiền mặt tại phòng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <Label className="text-[10px] font-semibold text-slate-500 mb-1 block">Giá điện (VNĐ/kWh)</Label>
                <Input
                  type="number"
                  min={0}
                  value={electricPrice}
                  onChange={(e) => setElectricPrice(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-slate-500 mb-1 block">Giá nước (VNĐ/tháng hoặc m³)</Label>
                <Input
                  type="number"
                  min={0}
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Điều khoản & Cam kết */}
          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Điều khoản hợp đồng bổ sung</Label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-orange-500"
              placeholder="Ghi chú điều khoản về giờ giấc, thiết bị bàn giao..."
            />
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs font-bold px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || loadingLookups}
              className="rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-6 shadow-md shadow-orange-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : isEdit ? (
                "Lưu thay đổi"
              ) : (
                "Ký & Kích hoạt hợp đồng"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
