"use client";

import { useEffect, useRef, useState } from 'react';

export default function NotificationManager() {
    const lastTriggerRef = useRef({});
    const [popups, setPopups] = useState([]);
    const hasSyncedRef = useRef(false); // Track if we've synced this session

    useEffect(() => {
        // Request notification permission
        if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // 1. ONE-TIME Sync Logic: Fetch upcoming follow-ups ONLY on first mount/login
        const syncNotificationsOnce = async () => {
            // Skip if already synced this session
            if (hasSyncedRef.current) {
                console.log("✅ Notification sync already completed for this session");
                return;
            }

            try {
                console.log("🔄 Syncing notifications from database (one-time)...");
                const response = await fetch('/api/notifications/check');
                if (response.ok) {
                    const data = await response.json();
                    if (data.notifications) {
                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');

                        const merged = [...existing];
                        let addedCount = 0;

                        data.notifications.forEach(remote => {
                            const remoteId = String(remote.id);
                            // Only add if not already scheduled AND not in history (already shown)
                            if (!merged.find(local => String(local.id) === remoteId) && !history.map(String).includes(remoteId)) {
                                merged.push({
                                    ...remote,
                                    id: remoteId,
                                    shown: false,
                                    syncedAt: Date.now()
                                });
                                addedCount++;
                            }
                        });

                        // Clean up old/expired notifications (older than 24 hours)
                        const now = Date.now();
                        const cleaned = merged.filter(item => {
                            const itemDate = new Date(item.date).getTime();
                            return !isNaN(itemDate) && (now - itemDate) < (24 * 60 * 60 * 1000);
                        });

                        localStorage.setItem('scheduledNotifications', JSON.stringify(cleaned));
                        console.log(`✅ Sync complete: ${addedCount} new notifications loaded, ${cleaned.length} total scheduled`);
                        hasSyncedRef.current = true; // Mark as synced
                    }
                }
            } catch (error) {
                console.error("❌ Notification sync failed", error);
            }
        };

        const triggerNotification = (note) => {
            const now = Date.now();
            // Prevent duplicate triggers within 10 seconds
            if (lastTriggerRef.current[note.id] && (now - lastTriggerRef.current[note.id] < 10000)) {
                return;
            }
            lastTriggerRef.current[note.id] = now;

            console.log(`🔔 Triggering notification: ${note.title}`);

            // Add to history to prevent re-triggering
            const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
            const noteId = String(note.id);
            if (!history.map(String).includes(noteId)) {
                history.push(noteId);
                localStorage.setItem('notificationHistory', JSON.stringify(history));
            }

            // Play sound
            try {
                const audio = new Audio("/sound/notification.wav");
                audio.volume = 1.0;
                audio.play().catch(e => console.error("Audio play blocked", e));
            } catch (e) {
                console.error("Audio initialization failed", e);
            }

            // Browser Notification
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                try {
                    new Notification(note.title, {
                        body: note.body,
                        icon: '/favicon.jpg'
                    });
                } catch (e) { console.error("Browser notification failed", e); }
            }

            // In-App Popup
            setPopups(prev => {
                if (prev.find(p => p.id === note.id)) return prev;
                return [...prev, note];
            });
        };

        // 2. Local Schedule Checker (runs every 5 seconds)
        const checkLocalSchedule = () => {
            try {
                const now = Date.now();
                const stored = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                let hasUpdates = false;

                const remaining = stored.filter(note => {
                    const dueTime = new Date(note.date).getTime();
                    // If notification is due (time has passed)
                    if (dueTime <= now) {
                        triggerNotification(note);
                        hasUpdates = true;
                        return false; // Remove from localStorage
                    }
                    return true; // Keep in localStorage
                });

                if (hasUpdates) {
                    localStorage.setItem('scheduledNotifications', JSON.stringify(remaining));
                    console.log(`📋 Updated localStorage: ${remaining.length} notifications remaining`);
                }
            } catch (e) {
                console.error("Local check failed", e);
            }
        };

        // ONE-TIME sync on mount
        syncNotificationsOnce();

        // Check localStorage every 5 seconds for due notifications
        const localInterval = setInterval(checkLocalSchedule, 5000);

        // Listen for manual updates (create/edit lead)
        const handleStorage = () => {
            console.log("🔄 Storage event detected, checking schedule...");
            checkLocalSchedule();
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            clearInterval(localInterval);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const removePopup = (id) => {
        setPopups(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {popups.map(popup => (
                <div
                    key={popup.id}
                    className="pointer-events-auto flex items-start gap-4 p-4 bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl w-80 animate-in slide-in-from-right duration-500 ease-out"
                >
                    <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                        <span className="material-symbols-outlined text-white text-xl">notifications_active</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 leading-tight mb-1">{popup.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{popup.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{new Date(popup.date).toLocaleTimeString()}</p>
                    </div>
                    <button
                        onClick={() => removePopup(popup.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
}
