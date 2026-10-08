import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Hero from "@/components/smartstay/Hero";
import FilterBar from "@/components/smartstay/FilterBar";
import RoomCard from "@/components/smartstay/RoomCard";

export default function Home() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [campus, setCampus] = useState("Tất cả khu vực");
    const [price, setPrice] = useState(6);
    const [selectedAmenities, setSelectedAmenities] = useState(["Máy lạnh"]);
    const [soundproof, setSoundproof] = useState(false);
    const [findRoommate, setFindRoommate] = useState(false);

    const toggleAmenity = (label) =>
        setSelectedAmenities((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
        );

    useEffect(() => {
        setLoading(true);
        base44.entities.Room.list("-safe_badge", 50)
            .then((res) => {
                setRooms(res.items || res || []);
            })
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            if (campus !== "Tất cả khu vực" && r.campus !== campus) return false;
            const limit = price * 1000000;
            if (price < 6 && r.price > limit) return false;
            if (findRoommate && !r.seeking_roommate) return false;
            if (selectedAmenities.length > 0) {
                const roomAmenities = r.amenities || [];
                if (!selectedAmenities.every((a) => roomAmenities.includes(a))) return false;
            }
            if (soundproof && !(r.amenities || []).includes("Cách âm")) return false;
            return true;
        });
    }, [rooms, campus, price, findRoommate, selectedAmenities, soundproof]);

    return (
        <>
            <Hero />
            <FilterBar 
                campus={campus} setCampus={setCampus}
                price={price} setPrice={setPrice}
                selectedAmenities={selectedAmenities} toggleAmenity={toggleAmenity}
                soundproof={soundproof} setSoundproof={setSoundproof}
                findRoommate={findRoommate} setFindRoommate={setFindRoommate}
            />

            <section className="max-w-7xl mx-auto px-6 pb-12">
                <div className="flex items-end justify-between mb-5">
                    <div>
                        <h2 className="font-heading font-bold text-foreground text-2xl">Danh sách phòng</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {loading ? "Đang tải..." : `${filteredRooms.length} phòng · Cần Thơ`}
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        Sắp xếp: Phổ biến nhất
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRooms.map((r) => (
                        <RoomCard key={r.id} room={r} />
                    ))}
                </div>
            </section>
        </>
    );
}