import React, { useState } from "react";
import { X, Wallet, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function DepositModal({ open, onClose, onSuccess, contract }) {
  if (!open || !contract) return null;

  const [status, setStatus] = useState(contract.deposit?.status === "paid" ? "paid" : "paid");
  const [amount, setAmount] = useState(contract.deposit?.amount || contract.monthlyRent || 0);
  const [paymentMethod, setPaymentMethod] = useState(contract.deposit?.paymentMethod || "transfer");
  const [note, setNote] = useState(contract.deposit?.note || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      await base44.contracts.updateDeposit(contract._id || contract.id, {
        status,
        amount: Number(amount),
        paymentMethod,
        paidAt: new Date().toISOString(),
        note: note.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Không thể cập nhật trạng thái tiền cọc.");
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
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Thu tiền cọc phòng
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

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Số tiền cọc thực thu (VNĐ) *</Label>
            <Input
              type="number"
              min={0}
              step={50000}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 rounded-xl text-sm font-black text-emerald-600"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Trạng thái xác nhận</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-orange-500"
            >
              <option value="paid">✓ Đã thu đủ tiền cọc (Đang giữ cọc)</option>
              <option value="unpaid">Chưa thu cọc (Khách vẫn nợ)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Phương thức thanh toán</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "transfer", label: "Chuyển khoản NH" },
                { id: "cash", label: "Tiền mặt trực tiếp" }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`h-10 rounded-xl text-xs font-bold border transition ${
                    paymentMethod === m.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Ghi chú biên lai thu cọc</Label>
            <Input
              type="text"
              placeholder="VD: Nhận CK Vietcombank lúc 10h, mã GD 123456"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 rounded-xl text-xs"
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
                  Đang lưu...
                </>
              ) : (
                "Xác nhận đã thu cọc"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
