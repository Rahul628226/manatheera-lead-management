"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
            console.error("Logout log failed");
        }
        localStorage.clear();
        router.push("/");
    };

    return (
        <header className="flex items-center justify-between bg-white border-b border-[#dbe4e6] px-8 py-4 sticky top-0 z-50">
            <div className="flex items-center gap-8 flex-1">


            </div>

            <div className="flex items-center gap-3">

                {/* User Profile Dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 hover:bg-[#f6f8f8] p-1.5 rounded-xl transition-all border border-transparent active:border-[#dbe4e6]"
                    >
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-[#111718]">{user?.fullName || user?.username || "Admin User"}</span>
                            <span className="text-[10px] text-[#618389] uppercase font-bold tracking-wider">{user?.role || "Administrator"}</span>
                        </div>
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD211_cniRAYu-SVAT4-oXGxohExMf9mEx0UVSL3RueKrGWXXGIEkJlV2wHvDjfZ1t7C2Hl1_1hnX8qEdgiRTJ4IiH06TtcHtGly3mpltiUeg0EoMB8r9bENdEDsN7Entyt6nvPjl_ATB4QZ8s6Z0KHEuKi8IwDwgeB08v-soYvOgN1oNVsK9hWgT6ptQVJVS0YTtL6O--DkoLjJ2H0qWd_b0J92OUYb7qvX11gzw-yyWBg1FKWIesxNkZTGD1faEt4BOeyEhbUKdE")' }}
                        ></div>
                        <span className={`material-symbols-outlined text-[#618389] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#dbe4e6] py-2 overflow-hidden animate-fade-in-up">
                            <div className="px-4 py-3 border-b border-[#f6f8f8]">
                                <p className="text-sm font-bold text-[#111718]">{user?.fullName || user?.username}</p>
                                <p className="text-xs text-[#618389] truncate">{user?.email}</p>
                            </div>

                            <div className="border-t border-[#f6f8f8] pt-1 mt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    <span className="font-bold">Log Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
