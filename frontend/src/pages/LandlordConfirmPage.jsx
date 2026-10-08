import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandlordConfirmPage() {
    const { id } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    // For conditional / reject forms
    const [actionType, setActionType] = useState(null); // 'conditional' | 'reject' | null
    const [reason, setReason] = useState("");

    useEffect(() => {
        const loadData = () => {
            const data = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
            const found = data.find(r => r.id === id);
            setRoom(found);
            setLoading(false);
        };
        // Simulate network delay
        setTimeout(loadData, 500);
    }, [id]);

    const handleConfirm = (status) => {
        if ((status === "landlord_rejected" || status === "landlord_conditional") && !reason.trim()) {
            alert("Vui lòng nhập lý do / điều kiện!");
            return;
        }

        const data = JSON.parse(localStorage.getItem("pass_rooms") || "[]");
        const idx = data.findIndex(r => r.id === id);
        if (idx !== -1) {
            data[idx].status = status;
            data[idx].landlordNote = reason;
            localStorage.setItem("pass_rooms", JSON.stringify(data));
            setIsConfirmed(true);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">Đang tải dữ liệu...</div>;
    }

    if (!room) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center flex-col gap-4">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <h1 className="text-xl font-bold">Không tìm thấy yêu cầu</h1>
                <p className="text-slate-500">Yêu cầu này có thể đã bị xóa hoặc không tồn tại.</p>
            </div>
        );
    }

    if (isConfirmed || room.status !== "pending_landlord") {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-sm border border-[#f4ebd9] text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="font-heading font-black text-2xl text-slate-900 mb-2">Đã xử lý thành công!</h2>
                    <p className="text-sm font-medium text-slate-500 mb-8">
                        {room.status === "landlord_confirmed" ? "Tin pass phòng đã được duyệt và hiển thị công khai trên SmartStay." : "Bạn đã từ chối yêu cầu này, người đăng sẽ nhận được thông báo."}
                    </p>
                    <Link to="/" className="text-sm font-bold text-[#f97316] hover:underline">
                        Quay lại trang chủ SmartStay
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] py-12 px-4 font-sans">
            <div className="max-w-2xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4" /> Quay lại SmartStay
                </Link>

                <div className="bg-white rounded-[24px] shadow-sm border border-[#f4ebd9] overflow-hidden">
                    <div className="bg-[#f97316] px-8 py-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-6 h-6" />
                            <h1 className="font-heading font-black text-xl">Xác nhận chuyển nhượng phòng</h1>
                        </div>
                        <p className="text-white/80 text-sm font-medium">Bạn nhận được yêu cầu từ hệ thống SmartStay.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-[#fdfbf7] border border-[#f4ebd9] rounded-xl p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tóm tắt yêu cầu</h3>
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600 font-medium">Người thuê (Người pass):</span>
                                <span className="font-bold text-slate-900">{room.posterName || "Sinh viên"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600 font-medium">Phòng / Địa chỉ:</span>
                                <span className="font-bold text-slate-900 text-right">{room.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600 font-medium">Giá thuê:</span>
                                <span className="font-bold text-[#f97316]">{Number(room.price).toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600 font-medium">Tiền cọc đang giữ:</span>
                                <span className="font-bold text-slate-900">{Number(room.deposit).toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-medium">Ngày muốn chuyển:</span>
                                <span className="font-bold text-slate-900">{room.moveOutDate}</span>
                            </div>
                        </div>

                        {room.contractImage && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-3">Hợp đồng / Biên lai đã tải lên:</h3>
                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                                    <img src={room.contractImage} alt="Hợp đồng" className="max-w-full h-auto mx-auto rounded-lg" />
                                </div>
                            </div>
                        )}

                        {actionType ? (
                            <div className="bg-[#fdfbf7] p-5 rounded-xl border border-[#f4ebd9] animate-in fade-in zoom-in-95">
                                <label className="block text-sm font-bold text-slate-900 mb-2">
                                    {actionType === "conditional" ? "Nhập điều kiện (Ví dụ: Phí sang tên 200k)" : "Lý do từ chối (Bắt buộc)"}
                                </label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:border-[#f97316]"
                                    rows="3"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Nhập nội dung..."
                                    autoFocus
                                ></textarea>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setActionType(null)} className="rounded-full">Hủy</Button>
                                    <Button 
                                        onClick={() => handleConfirm(actionType === "conditional" ? "landlord_conditional" : "landlord_rejected")}
                                        className={`rounded-full text-white ${actionType === "reject" ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"}`}
                                    >
                                        Xác nhận gửi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                <Button 
                                    onClick={() => handleConfirm("landlord_confirmed")}
                                    className="flex-1 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-6 text-base font-bold shadow-md"
                                >
                                    Đồng ý cho Pass
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setActionType("conditional")}
                                    className="flex-1 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 py-6 text-base font-bold"
                                >
                                    Đồng ý (kèm điều kiện)
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setActionType("reject")}
                                    className="flex-1 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 py-6 text-base font-bold"
                                >
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
