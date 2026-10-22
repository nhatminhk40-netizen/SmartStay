import React from "react";
import { ShieldCheck, FileCheck, Tags } from "lucide-react";

const features = [
    {
        icon: ShieldCheck,
        title: "100% kiểm duyệt phòng trọ",
        desc: "Xác minh phòng trọ thật trước khi đăng",
    },
    {
        icon: FileCheck,
        title: "Sang nhượng cọc an toàn",
        desc: "Ký kết minh bạch, bảo lãnh cọc rõ ràng",
    },
    {
        icon: Tags,
        title: "Giá chuyển trọ niêm yết",
        desc: "Giá sinh viên, không phụ phí ẩn",
    },
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] via-[#faf3e3] to-[#f4ebd9]" />
            <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-14 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium mb-6">
                    <ShieldCheck className="w-3.5 h-3.5" /> Nền tảng minh bạch cho sinh viên Cần Thơ
                </span>
                <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                    Thuê trọ <span className="text-accent">minh bạch</span> cho sinh viên Cần Thơ
                </h1>
                <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                    Tìm phòng đúng khu vực, đúng túi tiền — đánh giá thực tế từ sinh viên đã ở, ghép bạn hợp tính, chuyển trọ niêm yết.
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