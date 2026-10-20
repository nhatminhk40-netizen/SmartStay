import React, { useState } from "react";
import { X, CalendarPlus, Loader2, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function RenewContractModal({ open, onClose, onSuccess, contract }) {
  if (!open || !contract) return null;

  const [additionalMonths, setAdditionalMonths] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentEndDate = contract.endDate ? new Date(contract.endDate) : new Date();
  const baseDate = currentEndDate.getTime() < Date.now() ? new Date() : new Date(currentEndDate);
  const newEndDate = new Date(baseDate);
  newEndDate.setMonth(newEndDate.getMonth() + Number(additionalMonths || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!additionalMonths || Number(additionalMonths) < 1) {
      setErrorMsg("Số tháng gia hạn phải lớn hơn hoặc bằng 1.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      await base44.contracts.renew(contract._id || contract.id, {
        additionalMonths: Number(additionalMonths)
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Không thể gia hạn hợp đồng.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden border border-[#f4ebd9]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Gia hạn hợp đồng thuê
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#fdfbf7]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* So sánh ngày hết hạn cũ và mới */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Ngày hết hạn hiện tại:</span>
              <span className="font-bold text-slate-800">
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString("vi-VN") : "Chưa xác định"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-orange-600 font-bold">Ngày kết thúc mới sau gia hạn:</span>
              <span className="font-black text-sm text-orange-600">
                {newEndDate.toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Số tháng gia hạn thêm *
            </Label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAdditionalMonths(m)}
                  className={`h-10 rounded-xl text-xs font-bold border transition ${
                    additionalMonths === m
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  +{m} tháng
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              required
              value={additionalMonths}
              onChange={(e) => setAdditionalMonths(e.target.value)}
              className="h-10 rounded-xl text-xs"
              placeholder="Hoặc tự nhập số tháng khác..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận gia hạn"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
