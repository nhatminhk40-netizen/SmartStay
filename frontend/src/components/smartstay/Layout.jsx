import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SmartStayChatWidget from "./SmartStayChatWidget";

export default function Layout() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            {/* Cửa sổ chatbox nổi Messenger SmartStay */}
            <SmartStayChatWidget />
        </div>
    );
}