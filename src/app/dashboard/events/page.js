"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        image: "",
        description: ""
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== 'admin' && user.role !== 'developer') {
            router.push("/dashboard");
            return;
        }
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            if (res.ok) {
                setEvents(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                image: event.image || "",
                description: event.description || ""
            });
        } else {
            setEditingEvent(null);
            setFormData({ name: "", image: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingEvent ? `/api/events/${editingEvent._id}` : "/api/events";
            const method = editingEvent ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchEvents();
                setIsModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchEvents();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete event");
            }
        } catch (err) {
            console.error("Failed to delete event:", err);
            alert("An error occurred while deleting the event");
        }
    };

    return (
        <main className="max-w-[1440px] mx-auto px-6 py-8 w-full">
            <div className="flex justify-between items-end mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl font-black italic tracking-tight uppercase">Event Management</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configure your event inventory</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">event</span>
                    <span>Add New Event</span>
                </button>
            </div>

            {loading ? (
                <div className="p-20 text-center font-bold text-slate-300 italic">Inventory syncing...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                {event.image ? (
                                    <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleOpenModal(event)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-600 hover:text-primary shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(event._id)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-slate-900 font-black text-lg mb-2">{event.name}</h3>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 mb-4">
                                    {event.description || "No description provided for this event."}
                                </p>
                                <div className="flex border-t border-slate-50 pt-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Added {new Date(event.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 p-2"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">event</span>
                            </div>
                            <div>
                                <h2 className="text-slate-900 font-black text-xl italic tracking-tight">{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                                <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Configure event details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Corporate Conference 2026"
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Image URL (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief highlights of the event..."
                                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none resize-none transition-all"
                                ></textarea>
                            </div>

                            <button
                                disabled={saving}
                                className="w-full h-14 bg-primary text-white rounded-xl text-base font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all mt-2 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : (editingEvent ? "Update Event" : "Add Event")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
