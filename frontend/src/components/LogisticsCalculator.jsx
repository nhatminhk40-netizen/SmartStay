import React, { useState } from "react";
import { X, Truck, MapPin, Navigation, Calculator, Check } from "lucide-react";
import { LOGISTICS_VEHICLES } from "@/lib/smartstayData";
import { cn } from "@/lib/utils";

export default function LogisticsCalculator({ open, onClose }) {
  const [vehicle, setVehicle] = useState(LOGISTICS_VEHICLES[1].id);
  const [distance, setDistance] = useState(8);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const selected = LOGISTICS_VEHICLES.find((v) => v.id === vehicle);
  const total = selected.basePrice + selected.perKm * distance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base">Logistics / Chuyển trọ</div>
              <div className="text-[11px] text-slate-300">Giá niêm yết rõ ràng theo km</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* Vehicle selection */}
          <label className="text-xs font-semibold text-slate-500 mb-2 block">Chọn loại xe</label>
          <div className="space-y-2 mb-5">
            {LOGISTICS_VEHICLES.map((v) => (
              <button
                key={v.id}
                onClick={() => { setVehicle(v.id); setSubmitted(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  vehicle === v.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <span className="text-2xl">{v.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                  <div className="text-[11px] text-slate-500">{v.capacity}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{(v.basePrice / 1000)}k</div>
                  <div className="text-[10px] text-slate-400">+{(v.perKm / 1000)}k/km</div>
                </div>
              </button>
            ))}
          </div>

          {/* Distance */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
            <Navigation className="w-3.5 h-3.5" /> Khoảng cách di chuyển
          </label>
          <div className="flex items-center gap-3 mb-5">
            <input
              type="range"
              min={1}
              max={30}
              value={distance}
              onChange={(e) => { setDistance(+e.target.value); setSubmitted(false); }}
              className="flex-1 accent-emerald-600"
            />
            <span className="w-16 text-right font-bold text-slate-900 text-sm">{distance} km</span>
          </div>

          {/* Cost breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
              <Calculator className="w-3.5 h-3.5" /> Bảng giá niêm yết
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Phí cơ bản ({selected.name})</span>
                <span className="font-semibold">{selected.basePrice.toLocaleString("vi")}đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{selected.perKm.toLocaleString("vi")}đ × {distance}km</span>
                <span className="font-semibold">{(selected.perKm * distance).toLocaleString("vi")}đ</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-900">Tổng cộng</span>
                <span className="font-display font-extrabold text-emerald-600 text-lg">{total.toLocaleString("vi")}đ</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 flex items-center justify-center gap-2"
          >
            {submitted ? <><Check className="w-4 h-4" /> Đã ghi nhận yêu cầu</> : "Đặt xe chuyển trọ"}
          </button>
          {submitted && (
            <p className="text-center text-[11px] text-slate-400 mt-2">POST /logistics-request · trạng thái: chờ tài xế xác nhận</p>
          )}
        </div>
      </div>
    </div>
  );
}