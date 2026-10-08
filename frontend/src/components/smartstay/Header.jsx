import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    { label: "Khám phá", path: "/" },
    { label: "Ghép bạn", path: "/ghep-ban" },
    { label: "Chuyển trọ", path: "/chuyen-tro" },
    { label: "Pass phòng", path: "/pass-phong" },
];

export default function Header() {
    const { pathname } = useLocation();
    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                        <Home className="w-5 h-5 text-accent" />
                    </div>
                    <div className="leading-tight">
                        <div className="font-heading font-bold text-foreground text-lg">SmartStay</div>
                        <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                            Cần Thơ · Sinh viên
                        </div>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1 bg-white border-2 border-slate-200/80 shadow-sm rounded-full p-1">
                    {navItems.map((item) => {
                        const active = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${active
                                        ? "bg-foreground text-background shadow-md"
                                        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-full border-accent/40 text-accent hover:bg-accent/10 hover:text-accent hidden sm:inline-flex"
                    >
                        Đăng tin
                    </Button>
                    <button className="relative w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition">
                        <Bell className="w-4 h-4 text-foreground" />
                        <span className="absolute top-1 right-1.5 w-4 h-4 bg-accent text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                        M
                    </div>
                </div>
            </div>
        </header>
    );
}