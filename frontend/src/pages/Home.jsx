import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Hero from "@/components/smartstay/Hero";
import FilterBar from "@/components/smartstay/FilterBar";
import RoomCard from "@/components/smartstay/RoomCard";
import { AlertCircle, RefreshCw, Info } from "lucide-react";

export default function Home() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFallbackMode, setIsFallbackMode] = useState(false);

    const [campus, setCampus] = useState("Tất cả khu vực");
    const [price, setPrice] = useState(6);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [soundproof, setSoundproof] = useState(false);
    const [findRoommate, setFindRoommate] = useState(false);
    const [fireSafetyOnly, setFireSafetyOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [noLandlord, setNoLandlord] = useState(false);
    const [isTotalCostMode, setIsTotalCostMode] = useState(false);

    const toggleAmenity = (label) =>
        setSelectedAmenities((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
        );

    const loadRooms = () => {
        setLoading(true);
        base44.entities.Room.list("-createdAt", 50)
            .then((res) => {
                const list = res.items || res || [];
                setRooms(list);
                setIsFallbackMode(Boolean(window.__SMARTSTAY_IS_FALLBACK));
            })
            .catch(() => {
                setRooms([]);
                setIsFallbackMode(true);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            if (campus !== "Tất cả khu vực") {
                const c1 = campus.toLowerCase().replace(/đh\s+|đại học\s+/i, '').trim();
                const c2 = (r.campus || '').toLowerCase().replace(/đh\s+|đại học\s+/i, '').trim();
                if (r.campus !== campus && !c1.includes(c2) && !c2.includes(c1)) return false;
            }

            // Tính giá lọc: nếu ở chế độ tổng chi phí, cộng thêm ước tính điện nước ~320k
            const estTotalCost = (r.price || 0) + 320000 + (r.extraFees?.wifi || 0) + (r.extraFees?.trash || 0);
            const costToCheck = isTotalCostMode ? estTotalCost : r.price;

            const limit = price * 1000000;
            if (price < 7 && costToCheck > limit) return false;

            if (findRoommate && !r.seeking_roommate) return false;
            if (fireSafetyOnly && !r.fireSafetyCertified) return false;
            if (noLandlord && r.isWithLandlord) return false;

            if (selectedAmenities.length > 0) {
                const roomAmenities = r.amenities || [];
                if (!selectedAmenities.every((a) => roomAmenities.includes(a))) return false;
            }
            if (soundproof && !(r.amenities || []).includes("Cách âm")) return false;
            return true;
        });
    }, [rooms, campus, price, findRoommate, selectedAmenities, soundproof, fireSafetyOnly, verifiedOnly, noLandlord, isTotalCostMode]);

    // Gom nhóm các phòng thuộc cùng 1 khu trọ (tránh hiển thị trùng lặp loãng tin bên trang người thuê)
    const propertyGroupedRooms = useMemo(() => {
        const groups = new Map();
        
        filteredRooms.forEach(room => {
            const key = room.property_name 
                ? `prop_${room.property_name.toLowerCase().trim()}`
                : (room.address ? `addr_${room.address.toLowerCase().trim()}_${room.contactPhone || ''}` : `single_${room.id || room._id}`);
                
            if (!groups.has(key)) {
                groups.set(key, { ...room, _subRooms: [room] });
            } else {
                const existing = groups.get(key);
                existing._subRooms.push(room);
            }
        });

        return Array.from(groups.values()).map(groupItem => {
            const subs = groupItem._subRooms || [groupItem];
            
            // Tính toán khoảng giá từ tất cả các phòng con
            const allPrices = subs.flatMap(s => s.rooms_list ? s.rooms_list.map(r => r.price) : [s.price]).filter(Boolean);
            const minP = groupItem.price_min || (allPrices.length > 0 ? Math.min(...allPrices) : groupItem.price);
            const maxP = groupItem.price_max || (allPrices.length > 0 ? Math.max(...allPrices) : groupItem.price);

            // Tính số phòng trống
            let availCount = 0;
            let totalCount = 0;

            if (groupItem.rooms_list && groupItem.rooms_list.length > 0) {
                availCount = groupItem.rooms_list.filter(r => r.status === 'available').length;
                totalCount = groupItem.rooms_list.length;
            } else {
                availCount = subs.filter(s => s.status === 'available' || s.status === 'Trống').length;
                totalCount = subs.length;
            }

            // Gộp danh sách rooms_list
            const combinedRoomsList = groupItem.rooms_list && groupItem.rooms_list.length > 0 
                ? groupItem.rooms_list 
                : subs.map(s => ({
                    room_number: s.room_number || s.title,
                    price: s.price,
                    area_sqm: s.area_sqm || s.area || 20,
                    status: s.status === 'rented' || s.status === 'Đang thuê' ? 'rented' : (s.status === 'repairing' || s.status === 'Đang sửa' ? 'repairing' : 'available'),
                    amenities: s.amenities || []
                }));

            return {
                ...groupItem,
                title: groupItem.property_name || groupItem.title,
                price_min: minP,
                price_max: maxP,
                available_rooms: groupItem.available_rooms !== undefined ? groupItem.available_rooms : availCount,
                total_rooms: groupItem.total_rooms || totalCount,
                rooms_list: combinedRoomsList
            };
        });
    }, [filteredRooms]);

    return (
        <>
            <Hero />

            {/* Banner trạng thái kết nối & Dữ liệu minh họa (P1) */}
            {isFallbackMode && (
                <div className="max-w-7xl mx-auto px-6 -mt-4 mb-6">
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5 text-xs">
                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>
                                <strong>Chế độ Dữ liệu minh họa:</strong> Máy chủ đang ở chế độ Mock Data do cơ sở dữ liệu tạm thời chưa kết nối. Mọi chức năng giao diện, lọc và điều hướng vẫn hoạt động bình thường.
                            </span>
                        </div>
                        <button
                            onClick={loadRooms}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
                        >
                            <RefreshCw className="w-3 h-3" /> Thử kết nối lại
                        </button>
                    </div>
                </div>
            )}

            <FilterBar 
                campus={campus} setCampus={setCampus}
                price={price} setPrice={setPrice}
                selectedAmenities={selectedAmenities} toggleAmenity={toggleAmenity}
                soundproof={soundproof} setSoundproof={setSoundproof}
                findRoommate={findRoommate} setFindRoommate={setFindRoommate}
                fireSafetyOnly={fireSafetyOnly} setFireSafetyOnly={setFireSafetyOnly}
                verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                noLandlord={noLandlord} setNoLandlord={setNoLandlord}
                isTotalCostMode={isTotalCostMode} setIsTotalCostMode={setIsTotalCostMode}
            />

            <section className="max-w-7xl mx-auto px-6 pb-12">
                <div className="flex items-end justify-between mb-5">
                    <div>
                        <h2 className="font-heading font-bold text-foreground text-2xl">Danh sách nhà trọ & phòng</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {loading ? "Đang tải..." : `${propertyGroupedRooms.length} khu trọ khả dụng · Cần Thơ`}
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        {isTotalCostMode ? "Đang lọc: Theo tổng chi phí thực tế" : "Đang lọc: Theo khoảng giá niêm yết"}
                    </span>
                </div>

                {propertyGroupedRooms.length === 0 && !loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-border shadow-sm">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-heading font-bold text-base text-foreground">Không tìm thấy phòng phù hợp</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Hãy thử nới lỏng mức giá hoặc bỏ bớt các tiêu chí lọc.</p>
                        <button
                            onClick={() => {
                                setCampus("Tất cả khu vực");
                                setPrice(7);
                                setSelectedAmenities([]);
                                setSoundproof(false);
                                setFindRoommate(false);
                                setFireSafetyOnly(false);
                                setNoLandlord(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm hover:bg-accent/90 transition"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {propertyGroupedRooms.map((r) => (
                            <RoomCard key={r.id || r._id} room={r} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}