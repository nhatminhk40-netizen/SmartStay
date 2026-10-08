import React from "react";
import { MapPin, Wallet, User, Sparkles, Phone } from "lucide-react";

export default function RoommateCard({ item }) {
    const habits = (item.habits || "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

    return (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                        {item.gender && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                {item.gender}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.age && <span>{item.age} tuổi</span>}
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.campus}
                        </span>
                        {item.budget && (
                            <span className="inline-flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> {item.budget}tr/tháng
                            </span>
                        )}
                    </div>
                    {habits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {habits.map((h) => (
                                <span
                                    key={h}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                                >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {h}
                                </span>
                            ))}
                        </div>
                    )}
                    {item.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                    {item.contact && (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-foreground font-medium">
                            <Phone className="w-3 h-3" /> {item.contact}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}