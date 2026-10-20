import React from "react";
import { FileCheck2, ClockAlert, Wallet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContractStats({ stats = {}, onFilterExpiring, onFilterUnpaid }) {
  const {
    activeCount = 0,
    expiringSoonCount = 0,
    totalHoldingDeposit = 0,
    unpaidDepositCount = 0
  } = stats;

  const statCards = [
    {
      id: "active",
      title: "Hợp đồng đang hiệu lực",
      value: activeCount,
      sub: "Phòng đang có khách thuê",
      icon: FileCheck2,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
      iconBg: "bg-emerald-500 text-white"
    },
    {
      id: "expiring",
      title: "Sắp hết hạn (30 ngày)",
      value: expiringSoonCount,
      sub: expiringSoonCount > 0 ? "Cần liên hệ gia hạn sớm" : "Không có hợp đồng gấp",
      icon: ClockAlert,
      colorClass: expiringSoonCount > 0 ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-400/50" : "bg-slate-50 text-slate-600 border-slate-200",
      iconBg: expiringSoonCount > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-slate-400 text-white",
      isWarning: expiringSoonCount > 0,
      onClick: onFilterExpiring
    },
    {
      id: "deposit",
      title: "Tổng tiền cọc đang giữ",
      value: `${(totalHoldingDeposit / 1000000).toFixed(1)}M`,
      rawValue: `${Number(totalHoldingDeposit).toLocaleString('vi-VN')} đ`,
      sub: "Bảo đảm an toàn tài sản",
      icon: Wallet,
      colorClass: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-600 text-white"
    },
    {
      id: "unpaid",
      title: "Tiền cọc chưa thu",
      value: unpaidDepositCount,
      sub: unpaidDepositCount > 0 ? "Khách chưa đóng cọc" : "Đã thu đủ 100%",
      icon: AlertCircle,
      colorClass: unpaidDepositCount > 0 ? "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-400/50" : "bg-slate-50 text-slate-600 border-slate-200",
      iconBg: unpaidDepositCount > 0 ? "bg-rose-500 text-white" : "bg-slate-400 text-white",
      onClick: onFilterUnpaid
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "bg-white rounded-[22px] p-5 shadow-sm border transition-all duration-200 flex flex-col justify-between",
              item.colorClass,
              item.onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {item.title}
              </span>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", item.iconBg)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-black text-2xl md:text-3xl text-slate-900">
                  {item.value}
                </span>
                {item.rawValue && (
                  <span className="text-xs font-semibold text-slate-500">
                    ({item.rawValue})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
                {item.isWarning && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />}
                <span className={cn(item.isWarning ? "text-amber-700 font-bold" : "text-slate-500")}>
                  {item.sub}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
