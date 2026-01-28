"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const navItems = [
        { name: "Dashboard", icon: "dashboard", href: "/dashboard", active: pathname === "/dashboard" },
        { name: "Leads Pipeline", icon: "leaderboard", href: "/dashboard/leads", active: pathname.startsWith("/dashboard/leads") },
    ];

    // Add Admin/Developer specific items
    if (user?.role === 'admin' || user?.role === 'developer') {
        // Add Staff Directory
        navItems.splice(1, 0, { name: "Staff Directory", icon: "group", href: "/dashboard/staff", active: pathname === "/dashboard/staff" });

        // Add Events management
        navItems.push({
            name: "Manage Events",
            icon: "event",
            href: "/dashboard/events",
            active: pathname === "/dashboard/events"
        });
        // Add Facilities management
        navItems.push({
            name: "Manage Facilities",
            icon: "home_repair_service",
            href: "/dashboard/facilities",
            active: pathname === "/dashboard/facilities"
        });
        // Add Activity Logs
        navItems.push({
            name: "Activity Logs",
            icon: "history",
            href: "/dashboard/logs",
            active: pathname === "/dashboard/logs"
        });
    }

    return (
        <aside className="w-64 flex flex-col bg-white border-r border-[#dbe4e6]">
            <div className="p-6 flex flex-col h-full">
                {/* Logo/Brand Section */}
                <div className="flex gap-3 mb-8 items-center">
                    <div className="bg-primary/10 rounded-lg size-10 flex items-center justify-center overflow-hidden border border-primary/20">
                        <img src="/favicon.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[#111718] text-base font-bold leading-none">Manatheera</h1>
                        <p className="text-[#618389] text-[10px] uppercase font-black tracking-widest mt-1">Admin Panel</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${item.active
                                ? "bg-primary/10 text-primary border-l-4 border-primary"
                                : "text-[#618389] hover:bg-[#f6f8f8]"
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <p className={`text-sm ${item.active ? "font-bold" : "font-medium"}`}>
                                {item.name}
                            </p>
                        </Link>
                    ))}
                </nav>

            </div>
        </aside>
    );
}
