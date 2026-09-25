import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Users, Truck, KeyRound, Search, MapPin, Compass, Sparkles, Building2, GraduationCap, Phone } from "lucide-react";
import { getHeroConfig, getQuickActionsConfig } from "@/lib/adminConfig";
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

    // Dynamic config
    const [hero, setHero] = useState(getHeroConfig);
    const [quickActions, setQuickActions] = useState(getQuickActionsConfig);

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

        const handleConfigUpdate = () => {
            setHero(getHeroConfig());
            setQuickActions(getQuickActionsConfig());
        };
        window.addEventListener("smartstay_config_updated", handleConfigUpdate);
        return () => window.removeEventListener("smartstay_config_updated", handleConfigUpdate);
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
            <AppHeader
                onOpenExplore={() => {
                    const el = document.getElementById("room-listings-section");
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                    } else {
                        window.scrollTo({ top: 450, behavior: "smooth" });
                    }
                }}
                onOpenQuiz={() => setQuizOpen(true)}
                onOpenLogistics={() => setLogisticsOpen(true)}
                onOpenPass={() => setPassOpen(true)}
                onOpenSafe={() => setSafeOpen(true)}
            />

            {/* Dynamic hero banner */}
            <section className="bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
                    <div className="max-w-3xl">
                        <h1 className="font-display font-extrabold tracking-tight mb-2.5" style={{ fontSize: "clamp(1.5rem, 3vw, 2.3rem)", lineHeight: 1.15 }}>
                            {hero.title}{" "}
                            {hero.highlight && (
                                <span className="text-emerald-400">{hero.highlight} </span>
                            )}
                            {hero.titleSuffix || ""}
                        </h1>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            {hero.description}
                        </p>
                        {hero.showBadges !== false && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                                {hero.badge1 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {hero.badge1}
                                    </span>
                                )}
                                {hero.badge2 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                                        <KeyRound className="w-3.5 h-3.5 text-amber-400" /> {hero.badge2}
                                    </span>
                                )}
                                {hero.badge3 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur">
                                        <Truck className="w-3.5 h-3.5 text-teal-400" /> {hero.badge3}
                                    </span>
                                )}
                            </div>
                        )}
                        {hero.showCtaButtons && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button onClick={() => setSafeOpen(true)} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all">
                                    <ShieldCheck className="w-4 h-4" /> {hero.ctaSafeText || "Đăng tin Safe"}
                                </button>
                                <button onClick={() => setQuizOpen(true)} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all">
                                    <Users className="w-4 h-4" /> {hero.ctaQuizText || "Tìm bạn ở ghép"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Desktop / Tablet Quick Actions bar */}
            <div className="hidden md:block bg-white border-b border-slate-200/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-display">Truy cập nhanh SmartStay:</span>
                    </div>
                    <div className="flex items-center gap-2.5 overflow-x-auto py-0.5">
                        {quickActions.filter(a => a.enabled !== false).map((a) => {
                            const iconMap = { Users, Truck, KeyRound, ShieldCheck, Compass, Search, Sparkles, Building2, GraduationCap, Phone, MapPin };
                            const IconComp = iconMap[a.icon] || Compass;
                            const clickHandler = a.action === "quiz" ? () => setQuizOpen(true)
                                : a.action === "logistics" ? () => setLogisticsOpen(true)
                                : a.action === "pass" ? () => setPassOpen(true)
                                : a.action === "safe" ? () => setSafeOpen(true)
                                : () => {
                                    const el = document.getElementById("room-listings-section");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                    else window.scrollTo({ top: 400, behavior: "smooth" });
                                };
                            return (
                                <button
                                    key={a.id || a.label}
                                    onClick={clickHandler}
                                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 border border-slate-200 text-xs font-semibold text-slate-700 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                                    title={a.desc || a.label}
                                >
                                    <IconComp className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{a.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main bento layout */}
            <main id="room-listings-section" className="max-w-7xl mx-auto px-4 py-6 pb-32 md:pb-10">
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
                {quickActions.filter(a => a.enabled !== false).map((a) => {
                    const iconMap = { Users, Truck, KeyRound, ShieldCheck, Compass, Search };
                    const IconComp = iconMap[a.icon] || Compass;
                    const clickHandler = a.action === "quiz" ? () => setQuizOpen(true)
                        : a.action === "logistics" ? () => setLogisticsOpen(true)
                        : a.action === "pass" ? () => setPassOpen(true)
                        : a.action === "safe" ? () => setSafeOpen(true)
                        : () => window.scrollTo({ top: 0, behavior: "smooth" });
                    return (
                        <button key={a.id || a.label} onClick={clickHandler} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                            <IconComp className="w-5 h-5 text-slate-600" />
                            <span className="text-[10px] font-semibold text-slate-600">{a.label}</span>
                        </button>
                    );
                })}
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