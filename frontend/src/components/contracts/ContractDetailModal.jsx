import React from "react";
import { X, Calendar, DollarSign, Home, User, Phone, Mail, FileText, CheckCircle2, Clock, AlertTriangle, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContractDetailModal({ open, onClose, contract, onAction }) {
  if (!open || !contract) return null;

  const now = Date.now();
  const endDate = contract.endDate ? new Date(contract.endDate).getTime() : null;
  const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = contract.status === "active" && daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
  const isOverdue = contract.status === "active" && daysLeft !== null && daysLeft < 0;

  const depositStatusMap = {
    unpaid: { label: "Chưa thu cọc", class: "bg-rose-100 text-rose-700 border-rose-200" },
    paid: { label: "Đã thu cọc (Đang giữ)", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    refunded: { label: "Đã hoàn cọc 100%", class: "bg-blue-100 text-blue-800 border-blue-200" },
    partial_refund: { label: "Hoàn cọc một phần", class: "bg-purple-100 text-purple-800 border-purple-200" },
    withheld: { label: "Giữ lại cọc (Bù hư hại)", class: "bg-amber-100 text-amber-800 border-amber-200" }
  };

  const contractStatusMap = {
    active: { label: "Đang hiệu lực", class: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    pending: { label: "Chờ kích hoạt", class: "bg-amber-100 text-amber-800 border-amber-300" },
    ended: { label: "Đã kết thúc", class: "bg-slate-100 text-slate-700 border-slate-300" },
    cancelled: { label: "Đã hủy", class: "bg-rose-100 text-rose-700 border-rose-300" }
  };

  const depositInfo = depositStatusMap[contract.deposit?.status] || depositStatusMap.unpaid;
  const statusInfo = contractStatusMap[contract.status] || contractStatusMap.active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden border border-[#f4ebd9] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-[#fdfbf7]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${depositInfo.class}`}>
                {depositInfo.label}
              </span>
              <span className="text-xs text-slate-400">Mã: {contract._id || contract.id}</span>
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900">
              Chi tiết hợp đồng thuê phòng
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fdfbf7]">
          {/* Cảnh báo nếu sắp hết hạn */}
          {isExpiringSoon && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                <span>Hợp đồng sẽ đáo hạn trong <strong>{daysLeft} ngày tới</strong>. Bạn có thể gia hạn ngay.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction("renew", contract);
                }}
                className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg text-[11px] hover:bg-amber-700 transition"
              >
                Gia hạn
              </button>
            </div>
          )}

          {isOverdue && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Hợp đồng đã quá hạn {Math.abs(daysLeft)} ngày. Vui lòng thanh lý hoặc gia hạn hợp đồng.</span>
              </div>
            </div>
          )}

          {/* Thông tin phòng & Khách thuê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase">
                <Home className="w-4 h-4 text-orange-600" />
                <span>Thông tin phòng trọ</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{contract.room?.title || "Phòng trọ"}</p>
              <p className="text-xs text-slate-500">{contract.room?.address || "TP. Cần Thơ"}</p>
              <p className="text-xs text-slate-600">
                Khu vực: <strong>{contract.room?.campus || "FPT Cần Thơ"}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase">
                <User className="w-4 h-4 text-orange-600" />
                <span>Bên thuê (Người thuê)</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{contract.tenant?.fullName || "Người thuê"}</p>
              <div className="space-y-1 text-xs text-slate-600">
                {contract.tenant?.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contract.tenant.phone}</span>
                  </p>
                )}
                {contract.tenant?.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contract.tenant.email}</span>
                  </p>
                )}
                {(contract.tenant?.studentId || contract.tenant?.idCard) && (
                  <p className="text-slate-500">CCCD / Mã định danh: {contract.tenant?.idCard || contract.tenant?.studentId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Thời hạn & Lịch thanh toán */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Thời hạn thuê & Lịch thu tiền
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày bắt đầu:</span>
                <span className="font-bold text-slate-800">
                  {contract.startDate ? new Date(contract.startDate).toLocaleDateString("vi-VN") : "---"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày kết thúc:</span>
                <span className="font-bold text-slate-800">
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString("vi-VN") : "---"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời hạn:</span>
                <span className="font-bold text-slate-800">{contract.durationMonths} tháng</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày thu tiền định kỳ:</span>
                <span className="font-bold text-orange-600">Ngày {contract.paymentDay || 5} hàng tháng</span>
              </div>
            </div>
          </div>

          {/* Bảng chi phí & Tiền cọc */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Bảng chi phí & Tiền cọc
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Giá thuê hàng tháng:</span>
                <span className="font-black text-sm text-slate-900">
                  {Number(contract.monthlyRent).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tiền cọc phòng:</span>
                <span className="font-black text-sm text-emerald-600">
                  {Number(contract.deposit?.amount || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Giá điện:</span>
                <span className="font-bold text-slate-800">
                  {Number(contract.electricPrice || 3500).toLocaleString("vi-VN")} đ/kWh
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Giá nước:</span>
                <span className="font-bold text-slate-800">
                  {Number(contract.waterPrice || 20000).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Chi tiết khấu trừ cọc (nếu đã kết thúc) */}
            {contract.deposit?.deductions && contract.deposit.deductions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-rose-600 block mb-1.5">
                  Khoản khấu trừ khi thanh lý:
                </span>
                <div className="space-y-1">
                  {contract.deposit.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-rose-50/60 p-2 rounded-lg text-rose-900">
                      <span>• {d.reason}</span>
                      <span className="font-bold">- {Number(d.amount).toLocaleString("vi-VN")} đ</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs pt-2 font-bold text-slate-800">
                  <span>Số tiền cọc thực tế đã hoàn trả cho khách:</span>
                  <span className="text-emerald-600 text-sm font-black">
                    {Number(contract.deposit.refundedAmount || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            )}

            {contract.deposit?.note && (
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                Ghi chú cọc: {contract.deposit.note}
              </p>
            )}
          </div>

          {/* Điều khoản */}
          {contract.terms && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Điều khoản hợp đồng
              </span>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {contract.terms}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-[#fdfbf7]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Đóng
          </Button>

          {contract.status === "active" && (
            <div className="flex items-center gap-2">
              {contract.deposit?.status === "unpaid" && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAction("deposit", contract);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Thu cọc ngay
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onAction("renew", contract);
                }}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
              >
                Gia hạn
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onClose();
                  onAction("end", contract);
                }}
                className="rounded-xl text-xs font-bold"
              >
                Thanh lý & Hoàn cọc
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
