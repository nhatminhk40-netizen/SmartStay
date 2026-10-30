import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
    ArrowLeft,
    Check,
    X,
    AlertCircle,
    Flame,
    Home,
    Clock,
    DollarSign,
    ShieldCheck,
    BadgeCheck,
    Layers,
    Trash2
} from "lucide-react";

export default function CompareRooms() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rooms, setRooms] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const idsParam = searchParams.get("ids") || "";

    useEffect(() => {
        setLoading(true);
        base44.entities.Room.list("", 50)
            .then((res) => {
                const list = res.items || res || [];
                setAllRooms(list);

                let selectedIds = idsParam.split(",").filter(Boolean);
                if (selectedIds.length === 0 && list.length >= 2) {
                    selectedIds = [list[0].id || list[0]._id, list[1].id || list[1]._id];
                }

                const matched = list.filter(r => selectedIds.includes(String(r.id)) || selectedIds.includes(String(r._id)));
                setRooms(matched);
            })
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    }, [idsParam]);

    const removeRoom = (id) => {
        const next = rooms.filter(r => String(r.id) !== String(id) && String(r._id) !== String(id));
        setRooms(next);
        setSearchParams({ ids: next.map(r => r.id || r._id).join(",") });
    };

    const addRoom = (id) => {
        if (rooms.length >= 4) return;
        const target = allRooms.find(r => String(r.id) === String(id) || String(r._id) === String(id));
        if (target && !rooms.some(r => String(r.id) === String(id) || String(r._id) === String(id))) {
            const next = [...rooms, target];
            setRooms(next);
            setSearchParams({ ids: next.map(r => r.id || r._id).join(",") });
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-20 text-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">Đang tải dữ liệu so sánh phòng...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-accent mb-2 transition">
                            <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
                        </Link>
                        <h1 className="text-2xl font-heading font-black text-foreground">
                            Bảng so sánh phòng trọ đa tiêu chí
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Đặt cạnh nhau 2–4 phòng để đối chiếu trực tiếp tổng chi phí thực tế, PCCC, cọc và điều kiện thuê
                        </p>
                    </div>

                    {/* Thêm phòng vào so sánh */}
                    {rooms.length < 4 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">Thêm phòng:</span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) addRoom(e.target.value);
                                    e.target.value = "";
                                }}
                                className="px-3 py-1.5 rounded-xl border border-border text-xs bg-white text-foreground outline-none"
                            >
                                <option value="">-- Chọn phòng để thêm --</option>
                                {allRooms
                                    .filter(ar => !rooms.some(r => String(r.id) === String(ar.id) || String(r._id) === String(ar._id)))
                                    .map(r => (
                                        <option key={r.id || r._id} value={r.id || r._id}>
                                            {r.title.slice(0, 45)}... ({Number(r.price).toLocaleString('vi-VN')} đ)
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                </div>

                {rooms.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-border">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h2 className="text-base font-bold text-foreground">Chưa chọn phòng nào để so sánh</h2>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Vui lòng quay lại danh sách phòng và chọn các phòng bạn đang phân vân.</p>
                        <Link to="/" className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold">
                            Xem danh sách phòng
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100/80 border-b border-border">
                                        <th className="p-4 w-48 font-bold text-slate-600">Tiêu chí so sánh</th>
                                        {rooms.map(room => (
                                            <th key={room.id || room._id} className="p-4 min-w-[240px] max-w-[280px] align-top">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => removeRoom(room.id || room._id)}
                                                        className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
                                                        title="Bỏ khỏi so sánh"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <img
                                                        src={room.image_url || (room.images && room.images[0]) || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"}
                                                        alt={room.title}
                                                        className="w-full h-32 object-cover rounded-xl mb-2"
                                                    />
                                                    <Link to={`/phong/${room.id || room._id}`} className="font-bold text-foreground hover:text-accent line-clamp-2 leading-snug">
                                                        {room.title}
                                                    </Link>
                                                    <span className="text-[11px] text-muted-foreground block mt-1">
                                                        {room.campus} • {room.area_sqm} m²
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {/* 1. Giá thuê niêm yết */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Giá thuê niêm yết</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4 font-black text-accent text-sm">
                                                {Number(r.price).toLocaleString('vi-VN')} đ/tháng
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 2. Tổng chi phí thực tế ước tính */}
                                    <tr className="bg-amber-50/40 hover:bg-amber-50/70 font-semibold">
                                        <td className="p-4 font-bold text-amber-900 bg-amber-50/60">
                                            Tổng chi phí ước tính / tháng
                                            <span className="block text-[10px] font-normal text-amber-700">Gồm điện (~80 kWh), nước, wifi, rác</span>
                                        </td>
                                        {rooms.map(r => {
                                            const total = Number(r.price) + 250000 + 70000 + (r.extraFees?.wifi || 0) + (r.extraFees?.trash || 0);
                                            return (
                                                <td key={r.id || r._id} className="p-4 text-amber-900 font-black text-sm">
                                                    ~{total.toLocaleString('vi-VN')} đ/tháng
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* 3. Tiền đặt cọc & Hoàn cọc */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Tiền cọc yêu cầu</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                <span className="font-bold text-foreground">
                                                    {(Number(r.price) * (r.depositMonths || 1)).toLocaleString('vi-VN')} đ
                                                </span>
                                                <span className="text-muted-foreground block text-[11px]">({r.depositMonths || 1} tháng tiền phòng)</span>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 4. An toàn PCCC */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">An toàn PCCC & Thoát hiểm</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                {r.fireSafetyCertified ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                                                        <Flame className="w-3.5 h-3.5 text-emerald-600" /> Đạt chuẩn (Có lối thoát hiểm)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 font-medium">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Chưa có biên bản kiểm định
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 5. Giờ giấc sinh hoạt */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Giờ giấc ra vào</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-accent" />
                                                    {r.curfewType === 'tu_do' ? 'Tự do 24/7 (Khóa riêng)' : 'Có giờ giới nghiêm'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 6. Chung chủ */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Chung chủ</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                {r.isWithLandlord ? (
                                                    <span className="text-slate-600 font-medium">Chung chủ nhà</span>
                                                ) : (
                                                    <span className="text-emerald-700 font-bold">Không chung chủ</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 7. Đồng hồ điện nước */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Đồng hồ điện nước</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                {r.hasSeparateMeter ? (
                                                    <span className="text-blue-700 font-semibold">Đồng hồ riêng từng phòng</span>
                                                ) : (
                                                    <span className="text-slate-500">Đồng hồ chung / Khoán</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 8. Nuôi thú cưng */}
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/40">Nuôi thú cưng</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                {r.petAllowed ? (
                                                    <span className="text-emerald-700 font-semibold">Cho phép</span>
                                                ) : (
                                                    <span className="text-slate-500">Không cho phép</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 9. Nút hành động */}
                                    <tr className="bg-slate-50/80">
                                        <td className="p-4 font-bold text-slate-700">Hành động</td>
                                        {rooms.map(r => (
                                            <td key={r.id || r._id} className="p-4">
                                                <Link
                                                    to={`/phong/${r.id || r._id}`}
                                                    className="w-full inline-flex items-center justify-center py-2 px-3 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent/90 transition shadow-sm"
                                                >
                                                    Xem chi tiết phòng
                                                </Link>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
