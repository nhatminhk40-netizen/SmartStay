import React from "react";
import { ShieldCheck, TrendingUp, Users, MapPin, Maximize, Star, Snowflake, Box, Droplets, Layers, RotateCw, Shirt, VolumeOff } from "lucide-react";
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

function formatPrice(p) {
  return p >= 1000000 ? `${(p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1)}tr` : `${(p / 1000)}k`;
}

export default function RoomCard({ room, onOpen }) {
  const amenities = room.amenities || [];

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        <img src={room.image_url} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {room.safe_badge && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold shadow-md">
              <ShieldCheck className="w-3 h-3" /> Safe
            </span>
          )}
          {room.is_boosted && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-bold shadow-md">
              <TrendingUp className="w-3 h-3" /> Lên đầu
            </span>
          )}
          {room.has_pass && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 text-slate-900 text-[10px] font-bold shadow-md">
              Pass · còn {room.pass_months_left} tháng
            </span>
          )}
        </div>
        {room.seeking_roommate && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 text-indigo-600 text-[10px] font-bold">
            <Users className="w-3 h-3" /> Tìm ghép
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-sm font-display font-extrabold">
          {formatPrice(room.price)}<span className="text-[10px] font-body font-normal text-slate-300">/tháng</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-slate-900 text-sm leading-tight line-clamp-1">{room.title}</h3>
          <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold shrink-0">
            <Star className="w-3 h-3 fill-amber-500" /> {(room._avgRating || 4.5).toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <MapPin className="w-3 h-3" /> {room.location} · {room.campus}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {room.area_sqm}m²</span>
          <span className="text-slate-300">·</span>
          <span>{room.room_type}</span>
        </div>

        {/* Amenity icons */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-slate-100">
            {amenities.map((a) => {
              const Icon = AMENITY_ICONS[a];
              if (!Icon) return null;
              return (
                <span key={a} className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-500" title={a}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}