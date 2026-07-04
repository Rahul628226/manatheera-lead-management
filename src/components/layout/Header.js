"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFcmToken } from "@/lib/firebaseClient";

export default function Header({ toggleSidebar }) {
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [loadingToken, setLoadingToken] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);
    const dropdownRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        if (typeof window !== 'undefined') {
            const enabled = localStorage.getItem("fcm_enabled") === "true";
            const permission = Notification.permission === "granted";
            setPushEnabled(enabled && permission);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Setup foreground messaging listener
    useEffect(() => {
        let unsubscribe = () => {};

        const setupForegroundListener = async () => {
            try {
                const { getMessaging, onMessage } = await import('firebase/messaging');
                const { default: app } = await import('@/lib/firebaseClient');
                const messaging = getMessaging(app);
                
                unsubscribe = onMessage(messaging, (payload) => {
                    console.log('Received foreground message: ', payload);
                    if (payload.notification) {
                        setActiveNotification({
                            title: payload.notification.title,
                            body: payload.notification.body
                        });
                    }
                });
            } catch (err) {
                console.error("Foreground messaging setup failed:", err);
            }
        };

        if (pushEnabled) {
            setupForegroundListener();
        }

        return () => {
            unsubscribe();
        };
    }, [pushEnabled]);

    // Auto-dismiss foreground notification after 6 seconds
    useEffect(() => {
        if (activeNotification) {
            const timer = setTimeout(() => {
                setActiveNotification(null);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [activeNotification]);

    const handleTogglePush = async () => {
        if (typeof window === 'undefined') return;

        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications.");
            return;
        }

        if (pushEnabled) {
            setLoadingToken(true);
            try {
                const storedToken = localStorage.getItem("fcm_token");
                if (storedToken) {
                    await fetch("/api/notifications/register-token", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: storedToken })
                    });
                }
                localStorage.removeItem("fcm_token");
                localStorage.removeItem("fcm_enabled");
                setPushEnabled(false);
            } catch (error) {
                console.error("Failed to disable push notifications:", error);
            } finally {
                setLoadingToken(false);
            }
        } else {
            setLoadingToken(true);
            try {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    alert("Notification permission was denied. Please update browser settings to allow notifications.");
                    setLoadingToken(false);
                    return;
                }

                const token = await getFcmToken();
                if (token) {
                    const response = await fetch("/api/notifications/register-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token })
                    });
                    
                    if (response.ok) {
                        localStorage.setItem("fcm_token", token);
                        localStorage.setItem("fcm_enabled", "true");
                        setPushEnabled(true);
                    } else {
                        const errData = await response.json();
                        alert(errData.message || "Failed to register device for push notifications.");
                    }
                } else {
                    alert("Could not retrieve push token. Make sure Firebase VAPID key is configured.");
                }
            } catch (error) {
                console.error("Failed to enable push notifications:", error);
                alert("An error occurred while enabling push notifications.");
            } finally {
                setLoadingToken(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            const storedToken = localStorage.getItem("fcm_token");
            if (storedToken) {
                await fetch("/api/notifications/register-token", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: storedToken })
                });
            }
        } catch (err) {
            console.error("Clean up push token failed during logout:", err);
        }

        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
            console.error("Logout log failed");
        }
        localStorage.clear();
        router.push("/");
    };

    return (
        <>
            {/* Custom Foreground Notification Toast */}
            {activeNotification && (
                <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 flex gap-3 border-l-4 border-l-primary transform translate-y-0 transition-all duration-300 animate-fade-in-up">
                    <div className="bg-primary/10 rounded-xl size-10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">notifications_active</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111718] truncate">{activeNotification.title}</p>
                        <p className="text-xs text-[#618389] mt-0.5 line-clamp-2">{activeNotification.body}</p>
                    </div>
                    <button 
                        onClick={() => setActiveNotification(null)}
                        className="text-[#618389] hover:text-slate-900 shrink-0 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            <header className="flex items-center justify-between bg-white border-b border-[#dbe4e6] px-4 md:px-8 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3 md:gap-8 flex-1">
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden flex items-center justify-center p-2 rounded-lg text-[#618389] hover:bg-[#f6f8f8] active:bg-[#dbe4e6]"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    
                    {/* Logo visible only on mobile/tablet when sidebar is hidden */}
                    <div className="flex md:hidden items-center gap-2">
                        <div className="bg-primary/10 rounded-lg size-8 flex items-center justify-center overflow-hidden border border-primary/20">
                            <img src="/favicon.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[#111718] text-sm font-bold">Manatheera</span>
                    </div>
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

                                {/* Push Notification Toggle */}
                                <div className="px-4 py-2.5 border-b border-[#f6f8f8] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#618389] text-lg">notifications</span>
                                        <span className="text-xs font-bold text-[#111718]">{loadingToken ? 'Loading...' : 'Push Alerts'}</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={pushEnabled} 
                                            onChange={handleTogglePush}
                                            disabled={loadingToken}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="pt-1 mt-1">
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
        </>
    );
}
