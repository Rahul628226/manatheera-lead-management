"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import NotificationManager from "@/components/layout/NotificationManager";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me");
                if (response.ok) {
                    setAuthorized(true);
                } else {
                    localStorage.clear();
                    router.push("/");
                }
            } catch (err) {
                router.push("/");
            }
        };

        checkAuth();
    }, [router]);

    if (!authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f8f8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[#618389] font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f8f8]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-y-auto">
                <Header />
                <main className="flex-1">
                    {children}
                </main>
                <NotificationManager />
            </div>
        </div>
    );
}
