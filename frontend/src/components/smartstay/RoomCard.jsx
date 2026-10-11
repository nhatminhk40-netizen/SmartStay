import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Maximize, BadgeCheck, ShieldCheck, Flame, Info } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function RoomCard({ room }) {
    const roomId = room.id || room._id;

    return (
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
                <Link to={`/phong/${roomId}`} className="block relative h-44 overflow-hidden">
                    <Image
                        src={room.image_url || (room.images && room.images[0]) || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}
                        alt={room.title}
                        className="w-full h-full group-hover:scale-105 transition duration-500"
                        fittingType="fill"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {room.isDemo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold backdrop-blur shadow-sm">
                                <Info className="w-3 h-3" />
                                Minh họa
                            </span>
                        )}
                        {room.safe_badge && !room.isDemo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/90 text-white text-[10px] font-bold backdrop-blur shadow-sm">
                                <BadgeCheck className="w-3 h-3 text-emerald-300" />
                                Verified
                            </span>
                        )}
                        {room.has_pass && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/80 text-background text-[10px] font-medium backdrop-blur shadow-sm">
                                <ShieldCheck className="w-3 h-3 text-white" />
                                Cọc an toàn
                            </span>
                        )}
                    </div>
                </Link>

                <div className="p-4">
                    <Link to={`/phong/${roomId}`}>
                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-1 hover:text-accent transition">
                            {room.title}
                        </h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Maximize className="w-3.5 h-3.5" /> {room.area_sqm} m²
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-accent" /> {room.location || room.campus}
                        </span>
                    </div>

                    {/* Huy hiệu tiện ích an toàn */}
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                        {room.fireSafetyCertified && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                <Flame className="w-3 h-3" /> PCCC Đạt
                            </span>
                        )}
                        {room.hasSeparateMeter && (
                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                Đồng hồ riêng
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0">
                <div className="mt-2 pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                        <span className="font-heading font-bold text-accent text-lg">
                           {room.price >= 1000000 ? `${(room.price / 1000000).toFixed(room.price % 1000000 === 0 ? 0 : 1)}tr` : `${(room.price / 1000)}k`}
                        </span>
                        <span className="text-xs text-muted-foreground"> /tháng</span>
                    </div>
                    <Link
                        to={`/phong/${roomId}`}
                        className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-accent transition shadow-sm"
                    >
                        Xem phòng
                    </Link>
                </div>
            </div>
        </div>
    );
}