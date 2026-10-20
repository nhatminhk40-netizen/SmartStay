import React from "react";
import { Eye, Edit2, Wallet, CalendarPlus, AlertTriangle, CheckCircle2, Clock, MoreVertical, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContractList({
  contracts = [],
  loading = false,
  onAction,
  onCreateNew
}) {
  const now = Date.now();

  const depositStatusMap = {
    unpaid: { label: "Chưa thu cọc", class: "bg-rose-100 text-rose-700 border-rose-200" },
    paid: { label: "Đã thu cọc", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    refunded: { label: "Đã hoàn cọc", class: "bg-blue-100 text-blue-800 border-blue-200" },
    partial_refund: { label: "Hoàn một phần", class: "bg-purple-100 text-purple-800 border-purple-200" },
    withheld: { label: "Giữ lại cọc", class: "bg-amber-100 text-amber-800 border-amber-200" }
  };

  const contractStatusMap = {
    active: { label: "Đang hiệu lực", class: "bg-emerald-100 text-emerald-800" },
    pending: { label: "Chờ duyệt", class: "bg-amber-100 text-amber-800" },
    ended: { label: "Đã kết thúc", class: "bg-slate-100 text-slate-600" },
    cancelled: { label: "Đã hủy", class: "bg-rose-100 text-rose-700" }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] p-12 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Đang tải danh sách hợp đồng & cọc...</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3 text-orange-500">
          <FileText className="w-8 h-8" />
        </div>
        <h4 className="font-heading font-black text-lg text-slate-900 mb-1">
          Chưa có hợp đồng nào
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mb-5">
          Tạo hợp đồng thuê phòng để dễ dàng quản lý kỳ hạn, số tiền cọc bảo đảm và lịch thanh toán hàng tháng.
        </p>
        <Button
          onClick={onCreateNew}
          className="rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-5 shadow-md shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tạo hợp đồng đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#fdfbf7] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4 pl-6">Phòng trọ</th>
              <th className="p-4">Khách thuê</th>
              <th className="p-4">Thời hạn thuê</th>
              <th className="p-4">Giá thuê / tháng</th>
              <th className="p-4">Tiền cọc</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 pr-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {contracts.map((c) => {
              const depositInfo = depositStatusMap[c.deposit?.status] || depositStatusMap.unpaid;
              const statusInfo = contractStatusMap[c.status] || contractStatusMap.active;

              const endDate = c.endDate ? new Date(c.endDate).getTime() : null;
              const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
              const isExpiringSoon = c.status === "active" && daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
              const isOverdue = c.status === "active" && daysLeft !== null && daysLeft < 0;

              return (
                <tr key={c._id || c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Phòng trọ */}
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-900 line-clamp-1 max-w-[200px]" title={c.room?.title}>
                      {c.room?.title || "Phòng trọ"}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">
                      {c.room?.address || "TP. Cần Thơ"}
                    </div>
                  </td>

                  {/* Khách thuê */}
                  <td className="p-4">
                    <div className="font-bold text-slate-900">
                      {c.tenant?.fullName || "Khách thuê"}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {c.tenant?.phone || c.tenant?.email || "Chưa có SĐT"}
                    </div>
                  </td>

                  {/* Thời hạn thuê */}
                  <td className="p-4">
                    <div className="font-semibold text-slate-700">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "---"}
                      {" ➔ "}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "---"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({c.durationMonths} tháng)
                      </span>
                      {isExpiringSoon && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse border border-amber-300">
                          <Clock className="w-2.5 h-2.5" /> Còn {daysLeft} ngày
                        </span>
                      )}
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                          Quá hạn {Math.abs(daysLeft)} ngày
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Giá thuê */}
                  <td className="p-4 font-black text-slate-900">
                    {Number(c.monthlyRent).toLocaleString("vi-VN")} đ
                    <div className="text-[10px] text-slate-400 font-normal">
                      Thu ngày {c.paymentDay || 5}/tháng
                    </div>
                  </td>

                  {/* Tiền cọc */}
                  <td className="p-4">
                    <div className="font-black text-emerald-600">
                      {Number(c.deposit?.amount || 0).toLocaleString("vi-VN")} đ
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${depositInfo.class}`}>
                      {depositInfo.label}
                    </span>
                  </td>

                  {/* Trạng thái hợp đồng */}
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onAction("detail", c)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>

                    {c.status === "active" && (
                      <>
                        {c.deposit?.status === "unpaid" && (
                          <button
                            type="button"
                            onClick={() => onAction("deposit", c)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition inline-flex items-center gap-1 border border-emerald-200"
                            title="Thu tiền cọc"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            Thu cọc
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onAction("renew", c)}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition inline-flex items-center gap-1 border border-orange-200"
                          title="Gia hạn hợp đồng"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Gia hạn
                        </button>

                        <button
                          type="button"
                          onClick={() => onAction("end", c)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition inline-flex items-center gap-1 border border-rose-200"
                          title="Kết thúc & Hoàn cọc"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Hoàn cọc
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
