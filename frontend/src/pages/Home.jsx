import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Users, Truck, KeyRound, Search, MapPin } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FilterBar from "@/components/FilterBar";
import RoomCard from "@/components/RoomCard";
import RoomDetailDrawer from "@/components/RoomDetailDrawer";
import RoommateQuiz from "@/components/RoommateQuiz";
import LogisticsCalculator from "@/components/LogisticsCalculator";
import SafeListingModal from "@/components/SafeListingModal";
import PassRoomDialog from "@/components/PassRoomDialog";
import { cn } from "@/lib/utils";

export default function Home() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [campus, setCampus] = useState("Tất cả khu vực");
    const [priceRange, setPriceRange] = useState([0, 6000000]);
    const [seekingRoommate, setSeekingRoommate] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [soundproof, setSoundproof] = useState(false);

    // Modals
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [quizOpen, setQuizOpen] = useState(false);
    const [logisticsOpen, setLogisticsOpen] = useState(false);
    const [safeOpen, setSafeOpen] = useState(false);
    const [passOpen, setPassOpen] = useState(false);

    useEffect(() => {
        base44.entities.Room.list("-safe_badge", 50)
            .then(setRooms)
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        return rooms.filter((r) => {
            if (campus !== "Tất cả khu vực" && r.campus !== campus) return false;
            if (r.price < priceRange[0] || r.price > priceRange[1]) return false;
            if (seekingRoommate && !r.seeking_roommate) return false;
            if (selectedAmenities.length > 0) {
                const roomAmenities = r.amenities || [];
                if (!selectedAmenities.every((a) => roomAmenities.includes(a))) return false;
            }
            if (soundproof && !(r.amenities || []).includes("Cách âm")) return false;
            return true;
        });
    }, [rooms, campus, priceRange, seekingRoommate, selectedAmenities, soundproof]);

    const toggleAmenity = (amenity) => {
        setSelectedAmenities((prev) =>
            prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
        );
    };

    const markSafe = () => {
        setRooms((prev) => {
            const idx = prev.findIndex((r) => !r.safe_badge);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], safe_badge: true };
            base44.entities.Room.update(next[idx].id, { safe_badge: true }).catch(() => { });
            return next;
        });
    };

    const markBoosted = () => {
        setRooms((prev) => {
            const idx = prev.findIndex((r) => r.has_pass || !r.is_boosted);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], is_boosted: true };
            base44.entities.Room.update(next[idx].id, { is_boosted: true }).catch(() => { });
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body">
            <AppHeader />

            {/* Static hero banner */}
            <section className="bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
                    <div className="max-w-2xl">
                        <h1 className="font-display font-extrabold tracking-tight mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: 1.15 }}>
                            Thuê trọ <span className="text-emerald-400">minh bạch</span> cho sinh viên Cần Thơ
                        </h1>
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-5">
                            Tìm phòng đúng khu vực, đúng túi tiền — review ẩn danh có xác thực, ghép bạn hợp tính, chuyển trọ niêm yết.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => setSafeOpen(true)} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 flex items-center gap-2 transition-colors">
                                <ShieldCheck className="w-4 h-4" /> Đăng tin Safe
                            </button>
                            <button onClick={() => setQuizOpen(true)} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 flex items-center gap-2 transition-colors">
                                <Users className="w-4 h-4" /> Tìm bạn ở ghép
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main bento layout */}
            <main className="max-w-7xl mx-auto px-4 py-6 pb-32 md:pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                    {/* Left rail */}
                    <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
                        <FilterBar
                            campus={campus}
                            setCampus={setCampus}
                            priceRange={priceRange}
                            setPriceRange={setPriceRange}
                            seekingRoommate={seekingRoommate}
                            setSeekingRoommate={setSeekingRoommate}
                            onSeekingRoommate={() => { setSeekingRoommate(true); setQuizOpen(true); }}
                            selectedAmenities={selectedAmenities}
                            toggleAmenity={toggleAmenity}
                            soundproof={soundproof}
                            setSoundproof={setSoundproof}
                        />

                        {/* Quick actions */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                            <h3 className="font-display font-bold text-slate-900 text-sm mb-1">Truy cập nhanh</h3>
                            {[
                                { label: "Ghép bạn", icon: Users, color: "indigo", onClick: () => setQuizOpen(true) },
                                { label: "Chuyển trọ", icon: Truck, color: "emerald", onClick: () => setLogisticsOpen(true) },
                                { label: "Đăng tin Safe", icon: ShieldCheck, color: "emerald", onClick: () => setSafeOpen(true) },
                                { label: "Pass phòng", icon: KeyRound, color: "indigo", onClick: () => setPassOpen(true) },
                            ].map((a) => (
                                <button
                                    key={a.label}
                                    onClick={a.onClick}
                                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", a.color === "emerald" ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")}>
                                        <a.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Center grid */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-display font-bold text-slate-900 text-lg">Danh sách phòng</h2>
                                <p className="text-xs text-slate-500">
                                    {loading ? "Đang tải…" : `${filtered.length} phòng`}
                                    {campus !== "Tất cả khu vực" && ` · ${campus}`}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">Không tìm thấy phòng phù hợp bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filtered.map((room) => (
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                        onOpen={() => setSelectedRoom(room)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Mobile bottom quick action bar */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-2 flex justify-around">
                {[
                    { label: "Lọc", icon: Search, onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
                    { label: "Ghép bạn", icon: Users, onClick: () => setQuizOpen(true) },
                    { label: "Pass phòng", icon: KeyRound, onClick: () => setPassOpen(true) },
                    { label: "Đăng tin", icon: ShieldCheck, onClick: () => setSafeOpen(true) },
                ].map((a) => (
                    <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                        <a.icon className="w-5 h-5 text-slate-600" />
                        <span className="text-[10px] font-semibold text-slate-600">{a.label}</span>
                    </button>
                ))}
            </nav>

            {/* Modals */}
            <RoomDetailDrawer
                room={selectedRoom}
                open={!!selectedRoom}
                onClose={() => setSelectedRoom(null)}
                onSeekingRoommate={() => { setSelectedRoom(null); setQuizOpen(true); }}
            />
            <RoommateQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onComplete={() => { }} />
            <LogisticsCalculator open={logisticsOpen} onClose={() => setLogisticsOpen(false)} />
            <SafeListingModal open={safeOpen} onClose={() => setSafeOpen(false)} onSafe={markSafe} />
            <PassRoomDialog open={passOpen} onClose={() => setPassOpen(false)} onBoost={markBoosted} />
        </div>
    );
}