"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import TablePagination from "@/components/ui/TablePagination";

export default function LeadDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("details"); // details, followups, activity
    const [timelineFilter, setTimelineFilter] = useState("all");
    const [newLog, setNewLog] = useState({ type: "note", content: "" });
    const [nextCall, setNextCall] = useState({ date: "", goal: "", notify: false });
    const [saving, setSaving] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [completingNextCall, setCompletingNextCall] = useState(false);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [user, setUser] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityPagination, setActivityPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const fetchActivityLogs = async (page = 1) => {
        if (!user || (user.role !== 'admin' && user.role !== 'developer')) return;
        try {
            const res = await fetch(`/api/leads/${id}/history?page=${page}&limit=${activityPagination.limit}`);
            const data = await res.json();
            if (res.ok) {
                setActivityLogs(data.data);
                if (data.pagination) {
                    setActivityPagination(data.pagination);
                }
            }
        } catch (err) {
            console.error("Failed to fetch activity logs");
        }
    };

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLogs(activityPagination.page);
        }
    }, [id, activeTab, user, activityPagination.page]);

    const startEditing = (log) => {
        setEditingLogId(log._id);
        setEditContent(log.content);
    };

    const cancelEditing = () => {
        setEditingLogId(null);
        setEditContent("");
    };

    const saveEdit = async () => {
        if (!editContent.trim()) return;
        try {
            const response = await fetch(`/api/leads/${id}/followup`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followUpId: editingLogId, content: editContent })
            });

            if (response.ok) {
                const data = await response.json();
                setLead(prev => ({ ...prev, followUps: data.data }));
                cancelEditing();
            } else {
                alert("Failed to update note");
            }
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const getEngagementScore = () => {
        const count = lead?.followUps?.length || 0;
        let score = { label: "None", stars: 0, text: "No interaction history detected." };

        if (count >= 5) {
            score = { label: "High", stars: 5, text: "Active response rate detected." };
        } else if (count >= 3) {
            score = { label: "Medium", stars: 3, text: "Consistent engagement observed." };
        } else if (count >= 1) {
            score = { label: "Low", stars: 1, text: "Initial contact established." };
        }
        return score;
    };

    useEffect(() => {
        fetchLead();
        // Load tasks specifically for this lead from local storage
        const loadTasks = () => {
            const all = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
            if (id) {
                const now = new Date();
                const mine = all.filter(t => {
                    // Check ownership (lead ID)
                    const isMine = String(t.id) === String(id) || (t.id && String(t.id).includes(String(id)));
                    // Check if due (date is in past or now)
                    const isDue = t.date ? new Date(t.date) <= now : true;
                    return isMine && isDue;
                });
                // Sort by date descending (newest first)
                mine.sort((a, b) => new Date(b.date) - new Date(a.date));
                setAvailableTasks(mine);

                // Auto-select the latest task if available
                if (mine.length > 0) {
                    setSelectedTaskId(mine[0].id);
                    setCompletingNextCall(true);
                }
            }
        };
        loadTasks();
        window.addEventListener('storage', loadTasks);
        return () => window.removeEventListener('storage', loadTasks);
    }, [id]);

    // Auto-select DB task if no local tasks but DB task exists
    useEffect(() => {
        if (availableTasks.length === 0 && nextCall.date && !selectedTaskId) {
            // Only auto-select if not already selected
            setSelectedTaskId('db_next_call');
            setCompletingNextCall(true);
        }
    }, [nextCall.date, availableTasks.length, selectedTaskId]);

    const fetchLead = async () => {
        try {
            const response = await fetch(`/api/leads/${id}`);
            const data = await response.json();
            if (response.ok) {
                // Convert UTC date to local datetime-local format
                const getLocalISOString = (dateStr) => {
                    if (!dateStr) return "";
                    const date = new Date(dateStr);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    return localDate.toISOString().slice(0, 16);
                };

                setLead(data.data);
                setNextCall({
                    date: getLocalISOString(data.data.nextCallDate),
                    goal: data.data.nextCallGoal || "",
                    notify: data.data.nextCallNotify || false
                });
            } else {
                setError(data.message || "Failed to load lead details.");
            }
        } catch (err) {
            setError("Pipeline sync error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogInteraction = async (e) => {
        e.preventDefault();
        if (!newLog.content.trim()) return;
        setSaving(true);
        try {
            const payload = { ...newLog };

            // Append Task Info
            if (selectedTaskId) {
                let taskTitle = "";
                let taskTimeStr = "";

                if (selectedTaskId === 'db_next_call') {
                    taskTitle = nextCall.goal || "Scheduled Follow-up";
                    taskTimeStr = nextCall.date ? new Date(nextCall.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
                    payload.clearNextCall = true;
                } else {
                    const task = availableTasks.find(t => t.id === selectedTaskId);
                    taskTitle = task ? (task.body || task.title) : "Unknown Task";
                    taskTimeStr = task ? new Date(task.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

                    // If the task ID matches the lead ID, it's the primary scheduled call - clear it in DB
                    if (task && (String(task.id) === String(lead?._id) || String(task.id) === String(id))) {
                        payload.clearNextCall = true;
                    }
                }
                payload.content = `${payload.content}\n\n[Completed Task: ${taskTitle} | Due: ${taskTimeStr}]`;
            } else if (completingNextCall) {
                payload.clearNextCall = true;
            }

            const response = await fetch(`/api/leads/${id}/followup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                setLead(prev => ({ ...prev, followUps: data.data }));
                setNewLog({ type: "note", content: "" });

                if (completingNextCall || selectedTaskId) {
                    const completedId = selectedTaskId;
                    setNextCall({ date: "", goal: "", notify: false });
                    setCompletingNextCall(false);
                    setSelectedTaskId("");

                    // Remove from Local Storage
                    try {
                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');

                        // Determine which ID to remove from LS
                        const cleanupId = String(completedId === 'db_next_call' ? (lead?._id || id) : completedId);

                        // Add to history so it's not re-synced by NotificationManager
                        if (!history.map(String).includes(cleanupId)) {
                            history.push(cleanupId);
                            localStorage.setItem('notificationHistory', JSON.stringify(history));
                        }

                        const filtered = existing.filter(n => String(n.id) !== cleanupId);
                        localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));

                        // Force update local state immediately
                        setAvailableTasks(prev => prev.filter(t => String(t.id) !== cleanupId));

                        window.dispatchEvent(new Event('storage'));
                    } catch (e) { console.error("LS Cleanup Error", e); }
                }
            }
        } catch (err) {
            console.error("Log failed");
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleFollowUp = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nextCallDate: nextCall.date ? new Date(nextCall.date).toISOString() : null,
                    nextCallGoal: nextCall.goal,
                    nextCallNotify: nextCall.notify
                })
            });
            if (response.ok) {
                const responseData = await response.json(); // Parse the response
                alert("Follow-up scheduled!");
                fetchLead();
                setIsScheduleModalOpen(false);

                // --- Notification Injection Logic ---
                if (nextCall.notify && nextCall.date) {
                    try {
                        const newNote = {
                            id: responseData.data._id || lead._id,
                            title: `Follow-up Due: ${lead.firstName} ${lead.lastName}`,
                            body: nextCall.goal || "Scheduled follow-up is due.",
                            date: new Date(nextCall.date).toISOString(),
                            shown: false,
                            syncedAt: Date.now()
                        };

                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        // Remove if exists (re-scheduling the same lead)
                        const filtered = existing.filter(n => n.id !== newNote.id);
                        filtered.push(newNote);

                        localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));

                        // Dispatch storage event to force re-check (in same tab) or wait for interval
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {
                        console.error("Local schedule update failed", e);
                    }
                }
                // ------------------------------------
            }
        } catch (err) {
            console.error("Schedule failed");
        } finally {
            setSaving(false);
        }
    };

    const handleConvertToBooking = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "closed-won" }),
            });
            if (response.ok) {
                fetchLead();
                setIsConvertModalOpen(false);
            }
        } catch (err) {
            console.error("Conversion failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Syncing with pipeline...</div>;

    if (error) return (
        <div className="p-20 text-center flex flex-col items-center">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4 font-black">!</div>
            <div className="font-black text-slate-900 text-xl italic mb-2">Lead Sync Issue</div>
            <div className="text-slate-500 font-bold max-w-md">{error}</div>
            <Link href="/dashboard/leads" className="mt-8 text-primary font-black uppercase tracking-widest text-xs hover:underline">Back to Pipeline</Link>
        </div>
    );

    if (!lead) return <div className="p-20 text-center font-bold text-slate-400 italic">No lead record found.</div>;

    const engagement = getEngagementScore();

    return (
        <main className="max-w-[1440px] mx-auto px-6 py-8 w-full">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/dashboard/leads" className="hover:text-primary">Pipeline</Link>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="font-bold text-slate-900">{lead.firstName} {lead.lastName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">{lead.firstName} {lead.lastName}</h1>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">
                            {lead.status}
                        </span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${lead.quality === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            lead.quality === 'B' ? 'bg-[#205044]/10 text-[#205044] border-[#205044]/20' :
                                lead.quality === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                            Category {lead.quality}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-base">photo_camera</span> Source: {lead.source}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-base">calendar_today</span> Created: {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center gap-2 px-6 h-11 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">event_available</span>
                        <span>Schedule Follow-up</span>
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/leads/edit/${id}`)}
                        className="flex items-center gap-2 px-6 h-11 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        <span>Edit Info</span>
                    </button>
                    <button
                        onClick={() => setIsConvertModalOpen(true)}
                        className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-11 px-6 bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        Convert to Booking
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Info & History */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Tabs Navigation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-6 pt-2">
                            <div className="flex gap-8 border-b border-slate-100">
                                <button
                                    onClick={() => setActiveTab("details")}
                                    className={`pb-4 pt-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab("followups")}
                                    className={`pb-4 pt-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'followups' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Follow-ups ({lead.followUps?.length || 0})
                                </button>
                                {(user?.role === 'admin' || user?.role === 'developer') && (
                                    <button
                                        onClick={() => setActiveTab("activity")}
                                        className={`pb-4 pt-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Activity Log
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Details Tab Content */}
                        {activeTab === 'details' && (
                            <div className="p-8 space-y-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-xl">hotel</span>
                                        </div>
                                        <h3 className="text-slate-900 text-lg font-black italic">Stay Preferences</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Event Type</span>
                                            <p className="text-slate-900 font-bold capitalize">{lead.event ? lead.event.replace('-', ' ') : "Not Specified"}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Occasion</span>
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-900 font-bold">{lead.occasion || "Regular Vacation"}</p>
                                                {lead.occasion && <span className="bg-pink-100 text-pink-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">Special</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Guest Composition</span>
                                            <p className="text-slate-900 font-bold">{lead.guests} Adults, {lead.children} Children</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Booking Period</span>
                                            <p className="text-slate-900 font-bold">
                                                {lead.checkInDate ? new Date(lead.checkInDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "TBD"} — {lead.checkOutDate ? new Date(lead.checkOutDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "--"}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Requested Facilities</span>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.facilities && lead.facilities.length > 0 ? (
                                                    lead.facilities.map(f => (
                                                        <span key={f._id} className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1 rounded-lg border border-primary/10">
                                                            {f.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <p className="text-slate-400 text-xs italic font-medium">No specific facilities requested.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="size-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                                            <span className="material-symbols-outlined text-xl">contact_page</span>
                                        </div>
                                        <h3 className="text-slate-900 text-lg font-black italic">Contact Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Primary Email</span>
                                            <p className="text-slate-900 font-bold underline decoration-slate-200">{lead.email || "No email stored"}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Phone / Mobile</span>
                                            <p className="text-slate-900 font-bold">{lead.phone} {lead.mobile ? `/ ${lead.mobile}` : ""}</p>
                                        </div>
                                    </div>
                                </div>

                                {lead.nextCallDate && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-xl">event_upcoming</span>
                                            </div>
                                            <h3 className="text-slate-900 text-lg font-black italic">Scheduled Follow-up</h3>
                                        </div>
                                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-base">
                                                        {new Date(lead.nextCallDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(lead.nextCallDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-slate-500 text-xs font-medium">{lead.nextCallGoal || "Regular follow-up call"}</p>
                                                </div>
                                            </div>
                                            {lead.nextCallNotify && (
                                                <div className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    <span className="material-symbols-outlined text-base">notifications_active</span>
                                                    Alerts On
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="size-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                                            <span className="material-symbols-outlined text-xl">notes</span>
                                        </div>
                                        <h3 className="text-slate-900 text-lg font-black italic">Lead Notes</h3>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-inner-sm">
                                        <p className="text-slate-600 text-sm leading-relaxed italic">
                                            "{lead.notes || "No initial notes provided for this lead."}"
                                        </p>
                                        <div className="flex justify-between items-center mt-4">
                                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Created by: {lead.createdBy?.fullName || "System"}</p>
                                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Owned by: {lead.owner?.fullName || "System"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Follow-ups Tab Content */}
                        {activeTab === 'followups' && (
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <h3 className="text-slate-900 text-lg font-black italic">Interaction History</h3>

                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        {['all', 'call', 'social', 'whatsapp'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setTimelineFilter(type)}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timelineFilter === type ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {(() => {
                                        const filteredLogs = (lead.followUps || [])
                                            .filter(log => timelineFilter === 'all' || log.type === timelineFilter || (timelineFilter === 'social' && log.type === 'social'))
                                            .slice().reverse();

                                        const displayedLogs = showAllHistory ? filteredLogs : filteredLogs.slice(0, 3);
                                        const hiddenCount = filteredLogs.length - displayedLogs.length;

                                        return (
                                            <>
                                                {displayedLogs.map((log, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`size-10 rounded-xl flex items-center justify-center border ${log.type === 'call' ? 'bg-primary/10 text-primary border-primary/20' :
                                                                log.type === 'whatsapp' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                                                                    log.type === 'social' ? 'bg-purple-50 text-purple-500 border-purple-100' :
                                                                        'bg-slate-50 text-slate-400 border-slate-200'
                                                                }`}>
                                                                <span className="material-symbols-outlined text-xl">
                                                                    {log.type === 'call' ? 'call' : log.type === 'whatsapp' ? 'chat' : log.type === 'social' ? 'social_leaderboard' : 'notes'}
                                                                </span>
                                                            </div>
                                                            {i < displayedLogs.length - 1 && <div className="w-[1px] h-full bg-slate-100 my-2"></div>}
                                                        </div>
                                                        <div className="flex-1 pb-8">
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <h4 className="text-slate-900 font-black text-sm capitalize">
                                                                            {log.type === 'social' ? 'Social Media Inquiry' : `${log.type} Interaction`}
                                                                        </h4>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                            {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 group-hover:border-primary/20">
                                                                        <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
                                                                            {log.agent?.fullName?.charAt(0) || "A"}
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{log.agent?.fullName?.split(' ')[0] || "Agent"}</span>
                                                                    </div>
                                                                </div>
                                                                {editingLogId === log._id ? (
                                                                    <div className="mt-2">
                                                                        <textarea
                                                                            value={editContent}
                                                                            onChange={(e) => setEditContent(e.target.value)}
                                                                            className="w-full h-24 p-3 rounded-xl border border-primary/30 outline-none text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/10"
                                                                        />
                                                                        <div className="flex justify-end gap-2 mt-2">
                                                                            <button
                                                                                onClick={cancelEditing}
                                                                                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                onClick={saveEdit}
                                                                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110"
                                                                            >
                                                                                Save Changes
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-slate-600 text-sm leading-relaxed">{log.content}</p>

                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {hiddenCount > 0 && !showAllHistory && (
                                                    <div className="flex justify-center pt-4">
                                                        <button
                                                            onClick={() => setShowAllHistory(true)}
                                                            className="flex items-center gap-2 group"
                                                        >
                                                            <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                                <span className="material-symbols-outlined text-lg animate-bounce">keyboard_double_arrow_down</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-all">
                                                                View {hiddenCount} Previous Interactions
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}

                                                {showAllHistory && filteredLogs.length > 3 && (
                                                    <div className="flex justify-center pt-4">
                                                        <button
                                                            onClick={() => setShowAllHistory(false)}
                                                            className="flex items-center gap-2 group"
                                                        >
                                                            <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-all">
                                                                <span className="material-symbols-outlined text-lg">keyboard_double_arrow_up</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-all">
                                                                Collapse History
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {(lead.followUps?.length > 0 && lead.followUps.filter(log => timelineFilter === 'all' || log.type === timelineFilter).length === 0) && (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No matching activities found for this filter</p>
                                    </div>
                                )}

                                {(!lead.followUps || lead.followUps.length === 0) && (
                                    <div className="text-center py-12">
                                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 border-2 border-dashed border-slate-100">
                                            <span className="material-symbols-outlined text-3xl">history</span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No activities have been logged for this guest yet</p>
                                        <button
                                            onClick={() => document.getElementById('new-log').focus()}
                                            className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            Start conversation timeline
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="p-8">
                                <h3 className="text-slate-900 text-lg font-black italic mb-8">System Activity Trail</h3>
                                <div className="space-y-6">
                                    {activityLogs.length > 0 ? (
                                        activityLogs.map((log, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                        <span className="material-symbols-outlined text-base">
                                                            {log.action.includes('created') ? 'add_circle' :
                                                                log.action.includes('updated') ? 'edit_note' :
                                                                    log.action.includes('deleted') ? 'delete_forever' : 'info'}
                                                        </span>
                                                    </div>
                                                    {i < activityLogs.length - 1 && <div className="w-[1px] h-full bg-slate-100 my-1"></div>}
                                                </div>
                                                <div className="flex-1 pb-6">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-tight">
                                                                {log.action.split('_').join(' ')}
                                                            </h4>
                                                            <span className="text-[9px] text-slate-400 font-black">
                                                                {new Date(log.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-600 text-xs mt-1">{log.details}</p>
                                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
                                                            <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-black text-primary">
                                                                {log.userId?.fullName?.charAt(0) || "U"}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Performed by {log.userId?.fullName || log.username}</span>
                                                            {log.ipAddress && <span className="text-[8px] text-slate-300 ml-auto">IP: {log.ipAddress}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-slate-400 font-bold italic">
                                            No activity logs recorded yet.
                                        </div>
                                    )}
                                </div>

                                {activityLogs.length > 0 && (
                                    <div className="mt-8 border-t border-slate-100 -mx-8">
                                        <TablePagination
                                            pagination={activityPagination}
                                            onPageChange={(newPage) => setActivityPagination(prev => ({ ...prev, page: newPage }))}
                                            className="bg-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Widget Column */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
                    {/* Log Interaction Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-slate-900 text-base font-black italic mb-6">Log Interaction</h3>

                        {/* Active Reminder Block */}
                        {(nextCall.date || (availableTasks && availableTasks.length > 0)) && (
                            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative">
                                <div className="flex items-center gap-3 mb-3 pr-16">
                                    <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-sm">notifications_active</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Due Tasks</h4>
                                        <p className="text-[10px] text-slate-500 font-bold">Select a task to mark as complete</p>
                                    </div>
                                </div>
                                {selectedTaskId && (
                                    <div className="absolute top-4 right-4 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-100/50 px-2 py-1 rounded-lg">
                                        {(() => {
                                            if (selectedTaskId === 'db_next_call') {
                                                return nextCall.date ? new Date(nextCall.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                                            }
                                            const t = availableTasks.find(x => x.id === selectedTaskId);
                                            return t ? new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                                        })()}
                                    </div>
                                )}

                                <select
                                    value={selectedTaskId}
                                    onChange={(e) => {
                                        setSelectedTaskId(e.target.value);
                                        setCompletingNextCall(!!e.target.value);
                                    }}
                                    className="w-full h-10 bg-white border border-emerald-200 text-slate-700 text-xs font-bold rounded-lg px-3 focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- No specific task --</option>
                                    {availableTasks.sort((a, b) => new Date(b.date) - new Date(a.date)).map(task => (
                                        <option key={task.id} value={task.id}>
                                            {task.body || task.title} ({new Date(task.date).toLocaleDateString()})
                                        </option>
                                    ))}
                                    {(!availableTasks.find(t => String(t.id) === String(lead?._id || id)) && nextCall.date && new Date(nextCall.date) <= new Date()) && (
                                        <option value="db_next_call">
                                            {nextCall.goal || "Scheduled Follow-up"} ({new Date(nextCall.date).toLocaleDateString()})
                                        </option>
                                    )}
                                </select>
                            </div>
                        )}

                        <form onSubmit={handleLogInteraction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {['call', 'whatsapp', 'social', 'email'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewLog({ ...newLog, type })}
                                        className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newLog.type === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                id="new-log"
                                value={newLog.content}
                                onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                                placeholder="Write down the details of the conversation..."
                                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none transition-all resize-none"
                            ></textarea>
                            <button
                                disabled={saving || !newLog.content.trim()}
                                className="w-full h-12 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Log Interaction"}
                            </button>
                        </form>
                    </div>

                    {/* Engagement Score */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Engagement Quality</h4>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-black italic">{engagement.label}</div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`material-symbols-outlined text-xl ${i < engagement.stars ? 'text-primary' : 'text-slate-700'}`}
                                        style={{ fontVariationSettings: i < engagement.stars ? "'FILL' 1" : "'FILL' 0" }}
                                    >
                                        star
                                    </span>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight mt-3">{engagement.text}</p>
                    </div>
                </div>
            </div >

            {/* Schedule Modal */}
            {
                isScheduleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="fixed inset-0" onClick={() => setIsScheduleModalOpen(false)}></div>
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 z-10">
                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors p-2 hover:bg-slate-50 rounded-full"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <span className="material-symbols-outlined text-2xl">event_repeat</span>
                                </div>
                                <div>
                                    <h2 className="text-slate-900 font-black text-xl italic tracking-tight">Next Action Plan</h2>
                                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">Schedule Follow-up</p>
                                </div>
                            </div>

                            <form onSubmit={handleScheduleFollowUp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={nextCall.date}
                                        onChange={(e) => setNextCall({ ...nextCall, date: e.target.value })}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Follow-up Goal</label>
                                    <textarea
                                        value={nextCall.goal}
                                        onChange={(e) => setNextCall({ ...nextCall, goal: e.target.value })}
                                        placeholder="e.g. Confirm event availability and group discount..."
                                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/10 focus:bg-white outline-none resize-none transition-all"
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">notifications</span>
                                        Notify Me
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setNextCall({ ...nextCall, notify: !nextCall.notify })}
                                        className={`w-12 h-6 rounded-full relative transition-all ${nextCall.notify ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${nextCall.notify ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <button
                                    disabled={saving || !nextCall.date}
                                    className="w-full h-14 bg-emerald-500 text-white rounded-xl text-base font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all mt-2 disabled:opacity-50"
                                >
                                    {saving ? "Scheduling..." : "Confirm Schedule"}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Conversion Modal */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="fixed inset-0" onClick={() => setIsConvertModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 z-10">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <div>
                                <h2 className="text-slate-900 font-black text-2xl italic tracking-tight mb-2">Confirm Booking</h2>
                                <p className="text-slate-500 text-sm font-medium">Are you sure you want to convert this lead to a confirmed booking? This will update the status to <span className="text-emerald-600 font-bold uppercase">Booked / Closed Won</span>.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full pt-2">
                                <button
                                    onClick={() => setIsConvertModalOpen(false)}
                                    className="h-14 rounded-2xl border border-slate-200 text-slate-500 text-sm font-black hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConvertToBooking}
                                    disabled={saving}
                                    className="h-14 rounded-2xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? "Updating..." : "Yes, Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main >
    );
}
