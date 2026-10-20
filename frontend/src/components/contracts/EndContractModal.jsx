import React, { useState } from "react";
import { X, AlertTriangle, Plus, Trash2, ArrowRight, Loader2, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function EndContractModal({ open, onClose, onSuccess, contract }) {
  if (!open || !contract) return null;

  const initialDeposit = contract.deposit?.amount || 0;
  const [deductions, setDeductions] = useState([
    // Mặc định trống hoặc có sẵn gợi ý nếu có hư hại
  ]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  // Tính toán số tiền khấu trừ và số tiền hoàn trả cho khách
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const refundedAmount = Math.max(0, initialDeposit - totalDeductions);

  const handleAddDeduction = () => {
    setDeductions((prev) => [
      ...prev,
      { reason: "", amount: 100000 }
    ]);
  };

  const handleRemoveDeduction = (index) => {
    setDeductions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeductionChange = (index, field, value) => {
    setDeductions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      await base44.contracts.end(contract._id || contract.id, {
        deductions,
        note: note.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Không thể kết thúc hợp đồng.");
      setConfirmStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden border border-[#f4ebd9] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Thanh lý hợp đồng & Hoàn cọc
              </h3>
              <p className="text-[11px] text-slate-500">
                {contract.room?.title || "Phòng trọ"} • {contract.tenant?.fullName || "Khách thuê"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fdfbf7]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bảng tính cọc & hoàn tiền */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Tiền cọc ban đầu đang giữ:</span>
              <span className="font-bold text-slate-900">{initialDeposit.toLocaleString("vi-VN")} VNĐ</span>
            </div>
            <div className="flex items-center justify-between text-xs text-rose-600">
              <span className="flex items-center gap-1 font-semibold">
                <span>Tổng các khoản trừ hư hao / nợ:</span>
              </span>
              <span className="font-bold">- {totalDeductions.toLocaleString("vi-VN")} VNĐ</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase">Tiền cọc thực tế hoàn lại cho khách:</span>
              <span className="text-base font-black text-emerald-600">
                {refundedAmount.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                totalDeductions === 0 
                  ? "bg-emerald-100 text-emerald-800" 
                  : refundedAmount > 0 
                  ? "bg-purple-100 text-purple-800" 
                  : "bg-rose-100 text-rose-800"
              }`}>
                {totalDeductions === 0 
                  ? "✓ Hoàn đủ 100% tiền cọc" 
                  : refundedAmount > 0 
                  ? `Hoàn một phần (Giữ lại ${totalDeductions.toLocaleString("vi-VN")}đ sửa chữa)` 
                  : "Giữ lại toàn bộ tiền cọc do hư hao vượt quá mức"}
              </span>
            </div>
          </div>

          {/* Danh sách các khoản trừ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-slate-700">
                Các khoản trừ tiền cọc (Hư hại đồ đạc, điện nước phát sinh)
              </Label>
              <button
                type="button"
                onClick={handleAddDeduction}
                className="text-[11px] font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm khoản trừ
              </button>
            </div>

            {deductions.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white/70 text-center text-xs text-slate-400">
                Không có khoản khấu trừ nào (Khách nhận lại trọn vẹn 100% tiền cọc).
              </div>
            ) : (
              <div className="space-y-2">
                {deductions.map((d, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <Input
                      type="text"
                      placeholder="Lý do khấu trừ (VD: Hỏng vòi sen, nợ 10 số điện...)"
                      value={d.reason}
                      onChange={(e) => handleDeductionChange(index, "reason", e.target.value)}
                      className="h-9 text-xs rounded-lg flex-1"
                      required
                    />
                    <div className="relative w-28 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        step={10000}
                        placeholder="Số tiền"
                        value={d.amount}
                        onChange={(e) => handleDeductionChange(index, "amount", e.target.value)}
                        className="h-9 text-xs rounded-lg font-bold text-rose-600 pr-5"
                        required
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">đ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeduction(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Ghi chú biên bản thanh lý & bàn giao
            </Label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã kiểm tra phòng, đồ đạc bàn giao đầy đủ, chìa khóa đã thu hồi..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Cảnh báo hành động */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span>
              Khi kết thúc hợp đồng, phòng <strong>{contract.room?.title}</strong> sẽ tự động được chuyển về trạng thái <strong>"Phòng trống"</strong> để sẵn sàng đón khách thuê mới.
            </span>
          </div>

          {confirmStep && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 animate-in zoom-in-95">
              <p className="font-bold">⚠️ Bạn có chắc chắn muốn kết thúc hợp đồng này?</p>
              <p className="text-[11px] mt-1 text-rose-700">
                Thao tác này sẽ đóng hợp đồng và cập nhật lịch sử cọc. Nhấn "Xác nhận kết thúc" lần nữa để hoàn tất.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirmStep) setConfirmStep(false);
                else onClose();
              }}
              disabled={submitting}
              className="rounded-xl text-xs font-bold"
            >
              {confirmStep ? "Quay lại chỉnh sửa" : "Đóng"}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={`rounded-xl text-xs font-bold px-5 text-white ${
                confirmStep ? "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : confirmStep ? (
                "Xác nhận kết thúc & Hoàn cọc"
              ) : (
                "Tiếp tục kết thúc hợp đồng"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
