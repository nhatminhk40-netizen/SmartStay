import React from "react";
import { MapPin, Wallet, ShieldCheck, FileText, Phone } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function TransferCard({ item }) {
    return (
        <div className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition">
            <div className="relative h-36 bg-secondary">
                <Image
                    src={item.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"}
                    alt={item.title}
                    className="w-full h-full"
                    fittingType="fill"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/80 text-background text-[10px] font-medium backdrop-blur">
                    <ShieldCheck className="w-3 h-3" /> Sang nhượng
                </span>
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {item.location}
                    </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-foreground">
                        <Wallet className="w-3.5 h-3.5" /> {item.price}tr/tháng
                    </span>
                    {item.deposit != null && (
                        <span className="inline-flex items-center gap-1 text-accent">
                            <FileText className="w-3.5 h-3.5" /> Cọc {item.deposit}tr
                        </span>
                    )}
                </div>
                {item.reason && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">Lý do: {item.reason}</p>
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