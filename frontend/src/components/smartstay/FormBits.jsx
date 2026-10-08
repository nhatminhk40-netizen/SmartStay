import React from "react";
import { Label } from "@/components/ui/label";

export function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

export function EmptyState({ text }) {
    return (
        <div className="border-2 border-dashed border-border rounded-2xl py-16 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}

export function Select({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    );
}