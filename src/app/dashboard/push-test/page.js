"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PushTestPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usersList, setUsersList] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    
    const [title, setTitle] = useState("Developer Test Alert");
    const [body, setBody] = useState("This is a push notification sent via the developer console.");
    const [customUrl, setCustomUrl] = useState("/dashboard");
    const [sending, setSending] = useState(false);
    const [messageStatus, setMessageStatus] = useState(null);

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.role !== 'developer') {
                setLoading(false);
                return;
            }
            fetchUsers();
        } else {
            router.push("/");
        }
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications/fcm-users");
            if (res.ok) {
                const data = await res.json();
                setUsersList(data.data || []);
            } else {
                console.error("Failed to load users for FCM check");
            }
        } catch (err) {
            console.error("Error fetching users list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const concernedUsers = usersList.filter(u => u.hasConcern).map(u => u.id);
        if (selectedUsers.length === concernedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(concernedUsers);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (selectedUsers.length === 0) {
            alert("Please select at least one user with push notification concern.");
            return;
        }

        setSending(true);
        setMessageStatus(null);

        try {
            const response = await fetch("/api/notifications/send-custom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: selectedUsers,
                    title,
                    body,
                    payloadData: {
                        click_action: customUrl,
                        url: customUrl
                    }
                })
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                setMessageStatus({
                    success: true,
                    message: `Notification dispatched successfully! Sent: ${data.result?.sentCount || 0}, Failed: ${data.result?.failedCount || 0}`
                });
                fetchUsers(); // Refresh in case obsolete tokens were pruned
            } else {
                setMessageStatus({
                    success: false,
                    message: data.message || "Failed to dispatch notifications."
                });
            }
        } catch (err) {
            console.error("Failed to send notification request:", err);
            setMessageStatus({
                success: false,
                message: "An error occurred while sending the notification request."
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-[#618389] font-medium">
                Loading FCM Developer Console...
            </div>
        );
    }

    if (user?.role !== 'developer') {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
                <span className="material-symbols-outlined text-amber-500 text-5xl mb-4">gpp_maybe</span>
                <h3 className="text-lg font-black text-[#111718] mb-2">Access Denied</h3>
                <p className="text-xs text-[#618389] mb-6">This testing page is strictly restricted to Developer accounts.</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const concernedUsersCount = usersList.filter(u => u.hasConcern).length;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                <span className="text-[#618389]">Developer Tools</span>
                <span className="text-[#618389] material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#111718]">FCM Push Console</span>
            </div>

            {/* Page Heading */}
            <div className="mb-8">
                <h3 className="text-[#111718] text-2xl md:text-3xl font-black tracking-tight">Push Notification Console</h3>
                <p className="text-[#618389] text-xs md:text-sm mt-1">Compose and send custom push notifications to registered users to test notification delivery and actions.</p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Users List Card */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dbe4e6] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <span className="text-sm font-black text-slate-900">User Push Registry</span>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">{concernedUsersCount} of {usersList.length} users opted-in</span>
                        </div>
                        <button
                            onClick={handleSelectAll}
                            disabled={concernedUsersCount === 0}
                            className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {selectedUsers.length === concernedUsersCount && concernedUsersCount > 0 ? 'Deselect All' : 'Select All Opt-in'}
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100">
                        {usersList.length === 0 ? (
                            <div className="p-8 text-center text-[#618389] text-sm">No users found in database.</div>
                        ) : (
                            usersList.map((usr) => (
                                <div 
                                    key={usr.id} 
                                    onClick={() => usr.hasConcern && handleSelectUser(usr.id)}
                                    className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${!usr.hasConcern ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(usr.id)}
                                            onChange={() => {}}
                                            disabled={!usr.hasConcern}
                                            className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer"
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{usr.fullName}</div>
                                            <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">@{usr.username} • {usr.role}</div>
                                        </div>
                                    </div>

                                    <div>
                                        {usr.hasConcern ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {usr.tokenCount} Active Token(s)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                                                Not Configured
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Form Composer Card */}
                <form onSubmit={handleSendNotification} className="lg:col-span-5 bg-white rounded-2xl border border-[#dbe4e6] p-6 shadow-sm flex flex-col gap-5">
                    <span className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wide">Compose Message</span>

                    {/* Title */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-700">Notification Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Enter title..."
                            className="w-full h-10 px-3 bg-slate-50 border border-[#dbe4e6] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Body */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-700">Message Body</span>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                            rows={3}
                            placeholder="Enter body description..."
                            className="w-full p-3 bg-slate-50 border border-[#dbe4e6] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all resize-none"
                        />
                    </div>

                    {/* Redirect URL */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-700">Redirect Path (click_action)</span>
                        <input
                            type="text"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="/dashboard/leads"
                            className="w-full h-10 px-3 bg-slate-50 border border-[#dbe4e6] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
                        />
                        <span className="text-[10px] text-slate-400">Target path loaded when user clicks the push banner.</span>
                    </div>

                    {/* Feedback Toast */}
                    {messageStatus && (
                        <div className={`p-4 rounded-xl border text-xs font-bold flex items-start gap-2.5 ${messageStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <span className="material-symbols-outlined text-lg">{messageStatus.success ? 'check_circle' : 'error'}</span>
                            <span>{messageStatus.message}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={sending || selectedUsers.length === 0}
                        className="w-full h-11 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">{sending ? 'sync' : 'send'}</span>
                        <span>{sending ? 'Sending Multicast...' : `Send Notification (${selectedUsers.length} Selected)`}</span>
                    </button>
                </form>

            </div>
        </div>
    );
}
