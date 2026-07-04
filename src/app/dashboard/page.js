"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardHome() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const isAdmin = user?.role === 'admin' || user?.role === 'developer';

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                <a className="text-[#618389] hover:text-primary transition-colors" href="#">Admin Panel</a>
                <span className="text-[#618389] material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#111718]">Dashboard</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#dbe4e6] p-6 md:p-10 text-center flex flex-col items-center justify-center min-h-[350px] shadow-sm">
                <div className="bg-primary/10 size-14 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">dashboard</span>
                </div>
                <h1 className="text-[#111718] text-xl md:text-2xl font-extrabold tracking-tight mb-2">
                    Welcome back, {user?.fullName || user?.username || "Admin"}!
                </h1>
                <p className="text-[#618389] text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    Choose a category from the sidebar to manage your resort operations, staff, and customer leads.
                </p>

                <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 mt-8 w-full max-w-2xl`}>
                    {isAdmin && (
                        <Link href="/dashboard/staff" className="p-4 bg-[#f6f8f8] rounded-xl border border-[#dbe4e6] hover:border-primary transition-colors text-left group cursor-pointer">
                            <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">group</span>
                            <h3 className="text-[#111718] font-bold text-sm">Staff Directory</h3>
                            <p className="text-[#618389] text-xs mt-1">Manage team roles and access.</p>
                        </Link>
                    )}
                    <Link href="/dashboard/leads" className={`p-4 bg-[#f6f8f8] rounded-xl border border-[#dbe4e6] hover:border-primary transition-colors text-left group cursor-pointer ${!isAdmin ? 'md:max-w-md mx-auto w-full' : ''}`}>
                        <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">leaderboard</span>
                        <h3 className="text-[#111718] font-bold text-sm">Leads Overview</h3>
                        <p className="text-[#618389] text-xs mt-1">Track guest inquiries and status.</p>
                    </Link>
                    {isAdmin && (
                        <Link href="/dashboard/logs" className="p-4 bg-[#f6f8f8] rounded-xl border border-[#dbe4e6] hover:border-primary transition-colors text-left group cursor-pointer">
                            <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">history</span>
                            <h3 className="text-[#111718] font-bold text-sm">Activity Logs</h3>
                            <p className="text-[#618389] text-xs mt-1">Audit system logins and actions.</p>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
