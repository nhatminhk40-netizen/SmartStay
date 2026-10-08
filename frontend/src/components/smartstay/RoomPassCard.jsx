import React from "react";
import { MapPin, CalendarClock, KeyRound, Phone } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function RoomPassCard({ item }) {
    return (
        <div className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition">
            <div className="relative h-36 bg-secondary">
                <Image
                    src={item.image || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"}
                    alt={item.title}
                    className="w-full h-full"
                    fittingType="fill"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium">
                    <KeyRound className="w-3 h-3" /> Pass phòng
                </span>
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {item.location}
                    </span>
                    {item.available_date && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" /> {item.available_date}
                        </span>
                    )}
                </div>
                <div className="mt-2">
                    <span className="font-heading font-bold text-accent text-lg">{item.price}</span>
                    <span className="text-xs text-muted-foreground"> /tháng</span>
                </div>
                {item.note && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.note}</p>
                )}
                {item.contact && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-foreground font-medium">
                        <Phone className="w-3 h-3" /> {item.contact}
                    </p>
                )}
            </div>
        </div>
    );
}