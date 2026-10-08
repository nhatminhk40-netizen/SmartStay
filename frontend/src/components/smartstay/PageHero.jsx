import React from "react";
import { Button } from "@/components/ui/button";

export default function PageHero({ icon: Icon, title, subtitle, actionLabel, onAction }) {
    return (
        <section className="relative overflow-hidden border-b border-border/60">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] to-[#f4ebd9]" />
            <div className="relative max-w-7xl mx-auto px-6 py-12 flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-foreground text-2xl md:text-3xl">{title}</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">{subtitle}</p>
                    </div>
                </div>
                {actionLabel && (
                    <Button
                        onClick={onAction}
                        className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </section>
    );
}