import React from "react";
import { SlidersHorizontal, MapPin, Wallet, Users, VolumeOff, Check, Snowflake, Box, Droplets, Layers, RotateCw, Shirt } from "lucide-react";
import { CAMPUSES, AMENITIES } from "@/lib/smartstayData";
import { cn } from "@/lib/utils";

const AMENITY_ICONS = {
  "Máy lạnh": Snowflake,
  "Tủ lạnh": Box,
  "Máy nước nóng": Droplets,
  "Gác lửng": Layers,
  "Máy giặt": RotateCw,
  "Tủ quần áo": Shirt,
  "Cách âm": VolumeOff,
};

export default function FilterBar({ campus, setCampus, priceRange, setPriceRange, seekingRoommate, setSeekingRoommate, onSeekingRoommate, selectedAmenities, toggleAmenity, soundproof, setSoundproof }) {
  const max = 6000000;
  const [minP, maxP] = priceRange;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-5 shadow-xl shadow-slate-200/20">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
        <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">Bộ lọc phòng</h3>
      </div>

      {/* Campus */}
      <div className="mb-5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <MapPin className="w-3.5 h-3.5" /> Khu vực / Campus
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CAMPUSES.map((c) => (
            <button
              key={c}
              onClick={() => setCampus(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                campus === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="mb-5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <Wallet className="w-3.5 h-3.5" /> Mức giá (VND/tháng)
        </label>
        <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-2">
          <span>{(minP / 1000000).toFixed(1)}tr</span>
          <span className="text-slate-400">→</span>
          <span>{maxP >= max ? "6tr+" : (maxP / 1000000).toFixed(1) + "tr"}</span>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={100000}
          value={maxP}
          onChange={(e) => setPriceRange([Math.min(minP, +e.target.value), Math.max(minP, +e.target.value)])}
          className="w-full accent-emerald-600"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={100000}
          value={minP}
          onChange={(e) => setPriceRange([Math.min(+e.target.value, maxP), Math.max(+e.target.value, maxP)])}
          className="w-full accent-indigo-600 -mt-2"
        />
      </div>

      {/* Amenities */}
      <div className="mb-5 pt-4 border-t border-slate-100">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <Check className="w-3.5 h-3.5" /> Tiện nghi phòng
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITIES.map((a) => {
            const active = selectedAmenities.includes(a.id);
            const Icon = AMENITY_ICONS[a.id];
            return (
              <button
                key={a.id}
                onClick={() => toggleAmenity(a.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all",
                  active ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <span className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  {active ? <Check className="w-3 h-3" /> : (Icon ? <Icon className="w-3 h-3" /> : null)}
                </span>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Soundproof toggle */}
      <div className="mb-5 pt-4 border-t border-slate-100">
        <button
          onClick={() => setSoundproof(!soundproof)}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
            soundproof ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 text-left">
            <VolumeOff className={cn("w-4 h-4", soundproof ? "text-white" : "text-slate-400")} />
            <div>
              <div className={cn("text-sm font-bold", soundproof ? "text-white" : "text-slate-900")}>Phòng cách âm</div>
              <div className={cn("text-[11px]", soundproof ? "text-slate-300" : "text-slate-500")}>Lọc phòng có cách âm</div>
            </div>
          </div>
          <div className={cn("w-11 h-6 rounded-full p-0.5 transition-colors", soundproof ? "bg-emerald-500" : "bg-slate-200")}>
            <div className={cn("w-5 h-5 rounded-full bg-white transition-transform", soundproof && "translate-x-5")} />
          </div>
        </button>
      </div>

      {/* Roommate toggle */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={onSeekingRoommate}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
            seekingRoommate ? "bg-indigo-50 border-indigo-500" : "bg-white border-slate-200 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 text-left">
            <Users className={cn("w-4 h-4", seekingRoommate ? "text-indigo-600" : "text-slate-400")} />
            <div>
              <div className="text-sm font-bold text-slate-900">Tìm bạn ở ghép</div>
              <div className="text-[11px] text-slate-500">Bật để ghép thói quen sinh hoạt</div>
            </div>
          </div>
          <div className={cn(
            "w-11 h-6 rounded-full p-0.5 transition-colors",
            seekingRoommate ? "bg-indigo-600" : "bg-slate-200"
          )}>
            <div className={cn("w-5 h-5 rounded-full bg-white transition-transform", seekingRoommate && "translate-x-5")} />
          </div>
        </button>
      </div>
    </div>
  );
}