import React, { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, MapPin, X, UploadCloud, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/smartstay/PageHero";
import { cn } from "@/lib/utils";

import { base44 } from "@/api/base44Client";

const MOCK_CAMPUSES = ["ĐH Cần Thơ", "ĐH Y Dược", "ĐH Nam Cần Thơ", "ĐH FPT", "Khác"];

// Helper function to generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const PassRoomCard = ({ item, onRemove }) => {
    // Hidden logic if rejected
    if (item.status === "landlord_rejected") {
        return (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <h3 className="font-bold text-rose-700">Đã bị từ chối</h3>
                <p className="text-sm text-rose-600 mt-1 max-w-xs">Lý do: {item.landlordNote}</p>
                <Button variant="ghost" onClick={() => onRemove(item.id)} className="mt-4 text-rose-600 hover:bg-rose-100 rounded-full h-8 px-4 text-xs font-bold">
                    Xóa tin
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group relative">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img src={item.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.status === "pending_landlord" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg shadow-sm">
                            ⏳ Chờ chủ trọ xác nhận
                        </span>
                    )}
                    {item.status === "landlord_confirmed" && (
                        <span className="px-2.5 py-1 bg-emerald-500 text-white border border-emerald-600 text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Chủ trọ đã xác nhận
                        </span>
                    )}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 line-clamp-2 text-lg mb-1">{item.title}</h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {item.campus}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Giá pass</p>
                        <p className="font-black text-[#f97316] text-base">{Number(item.price).toLocaleString()}đ</p>
                    </div>
                    <div className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Đã cọc</p>
                        <p className="font-black text-slate-900 text-base">{Number(item.deposit).toLocaleString()}đ</p>
                    </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 font-medium mb-5">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                        <span>Ngày chuyển:</span>
                        <span className="font-bold text-slate-900">{item.moveOutDate}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                        <span>HĐ còn lại:</span>
                        <span className="font-bold text-slate-900">{item.contractRemaining} tháng</span>
                    </div>
                </div>
                <div className="mt-auto">
                    {item.status === "landlord_confirmed" ? (
                        <Button className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11">
                            Liên hệ nhận phòng
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full rounded-full border-slate-200 text-slate-500 font-bold h-11 pointer-events-none">
                            Đang chờ duyệt...
                        </Button>
                    )}
                    {item.status === "pending_landlord" && (
                        <p className="text-center text-[10px] font-medium text-amber-600 mt-2">
                            Link duyệt cho chủ trọ: <br/> 
                            <a href={`/xac-nhan-pass/${item.id}`} target="_blank" className="underline font-bold break-all">/xac-nhan-pass/{item.id}</a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function RoomPass() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterConfirmed, setFilterConfirmed] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: "", campus: "ĐH Cần Thơ", price: "", deposit: "", moveOutDate: "",
        contractRemaining: "", image: "", landlordName: "", landlordPhone: "", 
        contractImage: "", confirmedLandlord: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const apiRooms = await base44.entities.Room.passList();
            const localRooms = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
            const combined = [
                ...(apiRooms || []).map(r => ({
                    id: r._id || r.id,
                    title: r.title,
                    campus: r.campus,
                    price: r.price,
                    deposit: r.remaining_deposit || 2000000,
                    moveOutDate: r.moveOutDate || 'Linh hoạt',
                    contractRemaining: r.pass_months_left || r.remaining_duration || 3,
                    image: r.image_url || (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
                    status: r.pass_status || 'pending_landlord',
                    landlordNote: r.landlordNote || ''
                })),
                ...localRooms.filter(lr => !(apiRooms || []).some(ar => String(ar._id || ar.id) === String(lr.id)))
            ];
            setItems(combined);
        } catch {
            const data = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (id) => {
        const newData = items.filter(i => i.id !== id);
        localStorage.setItem("pass_rooms", JSON.stringify(newData));
        setItems(newData);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const res = await base44.entities.Room.pass({
                title: form.title,
                campus: form.campus,
                price: Number(form.price) || 2000000,
                remaining_deposit: Number(form.deposit) || 2000000,
                remaining_duration: Number(form.contractRemaining) || 3,
                moveOutDate: form.moveOutDate,
                landlordName: form.landlordName,
                landlordPhone: form.landlordPhone,
                images: [form.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"]
            });
            const created = res?.data || res;
            const newItem = {
                ...form,
                id: created?._id || created?.id || generateId(),
                status: "pending_landlord",
                posterName: "Bạn (Người đăng)"
            };
            
            const newData = [newItem, ...items];
            localStorage.setItem("pass_rooms", JSON.stringify(newData));
            setItems(newData);
            setShowForm(false);
            setForm({
                title: "", campus: "ĐH Cần Thơ", price: "", deposit: "", moveOutDate: "",
                contractRemaining: "", image: "", landlordName: "", landlordPhone: "", 
                contractImage: "", confirmedLandlord: false
            });
            alert("Đã đăng yêu cầu Pass phòng thành công lên hệ thống! Đang chờ chủ trọ xác nhận.");
        } catch (err) {
            console.warn("Lỗi đăng pass:", err);
        } finally {
            setSaving(false);
        }
    };

    const displayedItems = filterConfirmed ? items.filter(i => i.status === "landlord_confirmed") : items;

    return (
        <div className="bg-[#fdfbf7] min-h-screen">
            <PageHero
                icon={KeyRound}
                title="Pass phòng"
                subtitle="Nhận lại phòng đã đặt — chuyển nhượng an toàn với sự đồng ý của chủ trọ."
                actionLabel="Đăng pass phòng"
                onAction={() => setShowForm(true)}
            />

            <section className="max-w-7xl mx-auto px-6 py-12">
                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                        <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
                            <div className="px-8 py-6 border-b border-[#f4ebd9] bg-[#fdfbf7] flex items-center justify-between sticky top-0 z-10">
                                <div>
                                    <h2 className="font-heading font-black text-2xl text-slate-900">Đăng pass phòng</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Điền thông tin và xác nhận từ chủ trọ.</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            
                            <form onSubmit={submit} className="p-8">
                                <div className="space-y-8">
                                    {/* 1. Thông tin phòng */}
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-[#f97316]/20 text-[#f97316] flex items-center justify-center text-xs">1</span> 
                                            Thông tin phòng
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên / Địa chỉ phòng *</label>
                                                <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" placeholder="Ví dụ: Phòng studio KDC Hồng Phát..." />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Khu vực gần trường *</label>
                                                <select required value={form.campus} onChange={e => setForm({...form, campus: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-[#fdfbf7] border border-slate-200 focus:border-[#f97316] outline-none text-sm font-medium">
                                                    {MOCK_CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Giá pass (VNĐ/tháng) *</label>
                                                <Input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" placeholder="2500000" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tiền cọc đã đóng (VNĐ) *</label>
                                                <Input required type="number" value={form.deposit} onChange={e => setForm({...form, deposit: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" placeholder="2500000" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời hạn HĐ còn lại (tháng) *</label>
                                                <Input required type="number" value={form.contractRemaining} onChange={e => setForm({...form, contractRemaining: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" placeholder="6" />
                                            </div>
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày muốn chuyển *</label>
                                                    <Input required type="date" value={form.moveOutDate} onChange={e => setForm({...form, moveOutDate: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Link ảnh phòng (URL)</label>
                                                    <Input value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="h-12 rounded-xl bg-[#fdfbf7] border-slate-200 focus:border-[#f97316]" placeholder="https://..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Thông tin chủ trọ */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span> 
                                            Thông tin chủ trọ (Bắt buộc xác minh)
                                        </h3>
                                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Họ tên chủ trọ *</label>
                                                    <Input required value={form.landlordName} onChange={e => setForm({...form, landlordName: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 focus:border-blue-400" placeholder="Nguyễn Văn A" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SĐT chủ trọ *</label>
                                                    <Input required value={form.landlordPhone} onChange={e => setForm({...form, landlordPhone: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 focus:border-blue-400" placeholder="0901234567" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Link ảnh Hợp đồng / Biên lai cọc *</label>
                                                    <Input required value={form.contractImage} onChange={e => setForm({...form, contractImage: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 focus:border-blue-400" placeholder="URL hình ảnh làm bằng chứng" />
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-amber-200">
                                                <input 
                                                    type="checkbox" 
                                                    required 
                                                    checked={form.confirmedLandlord} 
                                                    onChange={e => setForm({...form, confirmedLandlord: e.target.checked})}
                                                    className="mt-1 w-5 h-5 rounded text-[#f97316] shrink-0" 
                                                    style={{ accentColor: "#f97316" }} 
                                                />
                                                <span className="text-sm font-semibold text-slate-700 leading-relaxed">
                                                    Tôi cam kết đã báo và được chủ trọ đồng ý cho chuyển nhượng. Nếu phát hiện gian lận, tài khoản sẽ bị khóa vĩnh viễn.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-full px-6 font-bold text-slate-500">
                                        Hủy
                                    </Button>
                                    <Button type="submit" disabled={saving} className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-6 font-bold shadow-md shadow-[#f97316]/20">
                                        {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang gửi yêu cầu...</> : "Đăng & Chờ xác nhận"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Listing Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <h2 className="font-heading font-black text-foreground text-2xl">
                        {displayedItems.length} phòng đang pass
                    </h2>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm cursor-pointer">
                        <input type="checkbox" checked={filterConfirmed} onChange={e => setFilterConfirmed(e.target.checked)} className="w-4 h-4 rounded text-[#f97316]" style={{ accentColor: "#f97316" }} />
                        <span className="text-sm font-bold text-slate-700">Chỉ hiện phòng đã được xác nhận</span>
                    </label>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-[#faf3e3] rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-10 h-10 text-[#f97316]" />
                        </div>
                        <h3 className="font-heading font-bold text-xl text-slate-900">Chưa có phòng nào được pass</h3>
                        <p className="text-slate-500 mt-2">Bạn có phòng cần chuyển nhượng? Hãy đăng ngay để tìm người nhận!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedItems.map((it) => (
                            <PassRoomCard key={it.id} item={it} onRemove={handleRemove} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}