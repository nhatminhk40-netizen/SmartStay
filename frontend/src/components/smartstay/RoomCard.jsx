import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Maximize, Columns, DoorOpen } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function RoomCard({ room }) {
    const roomId = room.id || room._id;

    // Tính toán số phòng trống và khoảng giá
    const availableRooms = room.available_rooms !== undefined 
        ? room.available_rooms 
        : (room.rooms_list ? room.rooms_list.filter(r => r.status === 'available').length : (room.status === 'available' || room.status === 'Trống' ? 1 : 0));
    
    const totalRooms = room.total_rooms || (room.rooms_list ? room.rooms_list.length : 1);
    
    const minPrice = room.price_min || (room.rooms_list && room.rooms_list.length > 0 ? Math.min(...room.rooms_list.map(r => r.price || room.price)) : room.price);
    const maxPrice = room.price_max || (room.rooms_list && room.rooms_list.length > 0 ? Math.max(...room.rooms_list.map(r => r.price || room.price)) : room.price);
    const hasPriceRange = minPrice && maxPrice && minPrice !== maxPrice;

    const displayTitle = room.property_name || room.title;

    return (
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
                <Link to={`/phong/${roomId}`} className="block relative h-48 overflow-hidden bg-slate-100">
                    <img
                        src={room.image_url || (room.images && room.images[0]) || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}
                        alt={displayTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
                        }}
                    />
                    
                    {/* Badge số phòng còn trống góc dưới phải ảnh */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                        {availableRooms > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-black shadow-md backdrop-blur-sm border border-emerald-400/30 animate-in fade-in">
                                <DoorOpen className="w-3.5 h-3.5 text-emerald-200" />
                                Còn {availableRooms} phòng trống
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 text-amber-300 text-[11px] font-bold shadow-md backdrop-blur-sm">
                                Hết phòng trống
                            </span>
                        )}
                    </div>
                </Link>

                <div className="p-4">
                    <Link to={`/phong/${roomId}`}>
                        <h3 className="font-heading font-black text-foreground text-base leading-snug line-clamp-1 hover:text-accent transition">
                            {displayTitle}
                        </h3>
                    </Link>

                    {room.property_name && room.title && room.title !== room.property_name && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {room.title}
                        </p>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Maximize className="w-3.5 h-3.5 text-slate-400" /> {room.area_sqm || 25} m²
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-accent" /> {room.location || room.campus}
                        </span>
                        {totalRooms > 1 && (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                Dãy {totalRooms} phòng
                            </span>
                        )}
                    </div>

                    {/* Tiện ích phòng */}
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                        {room.hasSeparateMeter && (
                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                Đồng hồ riêng
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            Giờ tự do
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0">
                <div className="mt-2 pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {hasPriceRange ? "Khoảng giá phòng:" : "Giá thuê:"}
                        </div>
                        <div className="flex items-baseline gap-1">
                            {hasPriceRange ? (
                                <span className="font-heading font-black text-accent text-base md:text-lg">
                                    {(minPrice / 1000000).toFixed(minPrice % 1000000 === 0 ? 0 : 1)}tr - {(maxPrice / 1000000).toFixed(maxPrice % 1000000 === 0 ? 0 : 1)}tr
                                </span>
                            ) : (
                                <span className="font-heading font-black text-accent text-lg">
                                    {room.price >= 1000000 ? `${(room.price / 1000000).toFixed(room.price % 1000000 === 0 ? 0 : 1)}tr` : `${(room.price / 1000)}k`}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">/tháng</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Link
                            to={`/so-sanh?ids=${roomId}`}
                            title="So sánh phòng này"
                            className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-accent hover:border-accent transition"
                        >
                            <Columns className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                            to={`/phong/${roomId}`}
                            className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-accent transition shadow-sm"
                        >
                            Xem phòng
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}