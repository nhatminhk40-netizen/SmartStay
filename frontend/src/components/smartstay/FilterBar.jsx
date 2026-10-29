import React, { useState } from "react";
import {
    SlidersHorizontal,
    Snowflake,
    DoorOpen,
    Refrigerator,
    Waves,
    Flame,
    Shirt,
    VolumeX,
} from "lucide-react";

const campuses = ["Tất cả khu vực", "Ninh Kiều / Trung tâm", "ĐH Cần Thơ", "ĐH Y Dược", "Cái Răng / Nam Cần Thơ", "ĐH FPT / KDC Hồng Phát"];

const amenities = [
    { icon: Snowflake, label: "Máy lạnh" },
    { icon: DoorOpen, label: "Gác lửng" },
    { icon: Refrigerator, label: "Tủ lạnh" },
    { icon: Waves, label: "Máy giặt" },
    { icon: Flame, label: "Nước nóng" },
    { icon: Shirt, label: "Tủ quần áo" },
    { icon: VolumeX, label: "Cách âm" },
];

function ToggleRow({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-foreground">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-6 rounded-full transition ${checked ? "bg-accent" : "bg-secondary"}`}
            >
                <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"
                        }`}
                />
            </button>
        </label>
    );
}

export default function FilterBar({
    campus, setCampus,
    price, setPrice,
    selectedAmenities, toggleAmenity,
    soundproof, setSoundproof,
    findRoommate, setFindRoommate,
    fireSafetyOnly, setFireSafetyOnly,
    verifiedOnly, setVerifiedOnly,
    noLandlord, setNoLandlord,
    isTotalCostMode, setIsTotalCostMode
}) {

    return (
        <section className="max-w-7xl mx-auto px-6 relative z-10 -mt-10 mb-8">
            <div className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <SlidersHorizontal className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h2 className="font-heading font-bold text-lg text-foreground">Bộ lọc minh bạch SmartStay</h2>
                            <p className="text-xs text-muted-foreground">Lọc theo chi phí thực tế & tiêu chuẩn sống</p>
                        </div>
                    </div>

                    {/* Chuyển đổi cách tính giá */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setIsTotalCostMode(false)}
                            className={`px-3 py-1.5 rounded-lg transition ${!isTotalCostMode ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Giá thuê niêm yết
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsTotalCostMode(true)}
                            className={`px-3 py-1.5 rounded-lg transition ${isTotalCostMode ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Tổng chi phí ước tính (+ điện, nước)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                            Khu vực / Vị trí
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {campuses.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCampus(c)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        campus === c
                                            ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                                             : "bg-white border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                            {isTotalCostMode ? "Tổng chi phí tối đa (tr/tháng)" : "Giá phòng niêm yết (tr/tháng)"}
                        </label>
                        <div className="mt-2 bg-slate-50 p-4 rounded-2xl border border-border/50">
                            <input
                                type="range"
                                min={0}
                                max={7}
                                step={0.5}
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <div className="flex justify-between text-xs font-medium text-muted-foreground mt-3">
                                <span>0tr</span>
                                <span className="font-bold text-accent text-sm bg-accent/10 px-2 py-0.5 rounded-md">
                                    ≤ {price}tr {isTotalCostMode ? "(tổng chi phí)" : ""}
                                </span>
                                <span>7tr+</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-border/50">
                        <ToggleRow label="PCCC đạt chuẩn" checked={fireSafetyOnly} onChange={setFireSafetyOnly} />
                        <ToggleRow label="Không chung chủ" checked={noLandlord} onChange={setNoLandlord} />
                        <ToggleRow label="Tìm bạn ở ghép" checked={findRoommate} onChange={setFindRoommate} />
                        <ToggleRow label="Phòng cách âm" checked={soundproof} onChange={setSoundproof} />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/60">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 block">
                        Tiện nghi phòng
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {amenities.map((a) => {
                            const active = selectedAmenities.includes(a.label);
                            return (
                                <button
                                    key={a.label}
                                    onClick={() => toggleAmenity(a.label)}
                                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-200 ${
                                        active
                                            ? "bg-accent/10 border-accent text-accent shadow-sm ring-1 ring-accent/20 scale-[0.98]"
                                            : "bg-white border-border text-muted-foreground hover:border-accent/40 hover:text-foreground hover:-translate-y-0.5 hover:shadow-md"
                                    }`}
                                >
                                    <a.icon className={`w-6 h-6 ${active ? "text-accent" : "text-slate-400"}`} />
                                    <span className="font-semibold text-xs">{a.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}