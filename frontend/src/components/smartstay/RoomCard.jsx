import React from "react";
import { MapPin, Maximize, BadgeCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function RoomCard({ room }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="relative h-44 overflow-hidden">
                <Image
                    src={room.image_url || (room.images && room.images[0]) || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}
                    alt={room.title}
                    className="w-full h-full"
                    fittingType="fill"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {room.safe_badge && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/80 text-background text-[10px] font-medium backdrop-blur">
                            <BadgeCheck className="w-3 h-3 text-emerald-400" />
                            Verified
                        </span>
                    )}
                    {room.has_pass && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/80 text-background text-[10px] font-medium backdrop-blur">
                            <ShieldCheck className="w-3 h-3 text-white" />
                            Cọc an toàn
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-1">{room.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" /> {room.area_sqm} m²
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5" /> {room.location || room.campus}
                    </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                    <div>
                        <span className="font-heading font-bold text-accent text-lg">
                           {room.price >= 1000000 ? `${(room.price / 1000000).toFixed(room.price % 1000000 === 0 ? 0 : 1)}tr` : `${(room.price / 1000)}k`}
                        </span>
                        <span className="text-xs text-muted-foreground"> /tháng</span>
                    </div>
                    <button className="px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-accent transition">
                        Xem phòng
                    </button>
                </div>
            </div>
        </div>
    );
}