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

    const loadRooms = () => {
        setLoading(true);
        base44.entities.Room.list("-safe_badge", 50)
            .then(setRooms)
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRooms();
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
        loadRooms();
    };

    const markBoosted = () => {
        loadRooms();
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body">
            <AppHeader />

            {/* Dynamic hero banner */}
            <section className="relative overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 opacity-90"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 z-10">
                    <div className="max-w-3xl">
                        <h1 className="font-display font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.15 }}>
                            Thuê trọ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-sm">minh bạch</span><br />cho sinh viên Cần Thơ
                        </h1>
                        <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl font-light">
                            Tìm phòng đúng khu vực, đúng túi tiền — review ẩn danh có xác thực, ghép bạn hợp tính, chuyển trọ niêm yết.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => setSafeOpen(true)} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:from-emerald-400 hover:to-teal-400 flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
                                <ShieldCheck className="w-5 h-5" /> Đăng tin Safe
                            </button>
                            <button onClick={() => setQuizOpen(true)} className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm hover:bg-white/20 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                <Users className="w-5 h-5" /> Tìm bạn ở ghép
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