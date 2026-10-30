import React from "react";
import { Search, Building2, Receipt } from "lucide-react";

const features = [
    {
        icon: Search,
        title: "Tìm phòng nhanh & chính xác",
        desc: "Dễ dàng lọc theo trường ĐH Cần Thơ, FPT, Nam Cần Thơ... đúng giá và tiện nghi",
    },
    {
        icon: Building2,
        title: "Kênh quản lý cho Chủ trọ",
        desc: "Quản lý số phòng trống, khách đang thuê, hợp đồng và cọc giữ chỗ tiện lợi",
    },
    {
        icon: Receipt,
        title: "Chốt điện nước & Hóa đơn",
        desc: "Bảng chốt số điện nước tự động, lưu trữ lịch sử và tính tiền nhanh chóng",
    },
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] via-[#faf3e3] to-[#f4ebd9]" />
            <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-14 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold mb-6">
                    <Building2 className="w-3.5 h-3.5" /> Hỗ trợ tìm phòng cho người thuê & Quản lý phòng trọ cho chủ trọ tại Cần Thơ
                </span>
                <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                    Hỗ trợ tìm phòng & <span className="text-accent">quản lý phòng trọ</span>
                </h1>
                <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                    Nền tảng kết nối trực tiếp: Giúp người thuê tìm phòng trọ ưng ý theo vị trí và mức giá, đồng thời hỗ trợ chủ trọ quản lý cơ sở, khách thuê và điện nước hiệu quả.
                </p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-white rounded-2xl p-5 border-2 border-slate-200/80 shadow-md flex items-start gap-3 text-left"
                        >
                            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                                <f.icon className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <div className="font-semibold text-foreground text-sm">{f.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}