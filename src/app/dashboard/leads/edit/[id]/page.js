"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditLead() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        mobile: "",
        event: "",
        occasion: "",
        source: "",
        status: "",
        quality: "C",
        nextCallDate: "",
        nextCallNotify: false,
        nextCallGoal: "",
        checkInDate: "",
        checkOutDate: "",
        guests: 0,
        infants: 0,
        children: 0,
        pets: 0,
        notes: ""
    });

    useEffect(() => {
        fetchLead();
        fetchEvents();
    }, [id]);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            if (res.ok) {
                setEvents(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch events");
        }
    };

    const fetchLead = async () => {
        try {
            const response = await fetch(`/api/leads/${id}`);
            const data = await response.json();
            if (response.ok) {
                // Formatting dates for input fields
                const formattedData = { ...data.data };

                // Convert UTC to local datetime-local format (YYYY-MM-DDTHH:MM)
                if (formattedData.nextCallDate) {
                    const date = new Date(formattedData.nextCallDate);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    formattedData.nextCallDate = localDate.toISOString().slice(0, 16);
                }

                // Convert UTC to local date format (YYYY-MM-DD)
                if (formattedData.checkInDate) {
                    const date = new Date(formattedData.checkInDate);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    formattedData.checkInDate = localDate.toISOString().split('T')[0];
                }

                if (formattedData.checkOutDate) {
                    const date = new Date(formattedData.checkOutDate);
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    formattedData.checkOutDate = localDate.toISOString().split('T')[0];
                }

                setFormData(formattedData);
            } else {
                setError("Failed to load lead details.");
            }
        } catch (err) {
            setError("Error connection to server.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const response = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // --- Notification Sync Logic ---
                if (formData.nextCallNotify && formData.nextCallDate) {
                    try {
                        const newNote = {
                            id: data.data._id || id,
                            title: `Follow-up Due: ${formData.firstName} ${formData.lastName}`,
                            body: formData.nextCallGoal || "Scheduled follow-up is due.",
                            date: new Date(formData.nextCallDate).toISOString(),
                            shown: false,
                            syncedAt: Date.now()
                        };

                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        // Remove any existing notification for this lead
                        const filtered = existing.filter(n => String(n.id) !== String(newNote.id));
                        filtered.push(newNote);
                        localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {
                        console.error("Local schedule update failed", e);
                    }
                } else if (!formData.nextCallNotify || !formData.nextCallDate) {
                    // Remove notification if disabled or date cleared
                    try {
                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        const filtered = existing.filter(n => String(n.id) !== String(id));
                        localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {
                        console.error("Local cleanup failed", e);
                    }
                }
                // ------------------------------------

                router.push("/dashboard/leads");
            } else {
                const data = await response.json();
                setError(data.message || "Failed to update lead");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Loading Lead Details...</div>;

    return (
        <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between bg-white border-b border-[#dbe4e6] px-10 py-4 sticky top-0 z-20">
                <div className="flex items-center gap-4 text-[#111718]">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined">edit_note</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight">Edit Lead Info</h2>
                        <p className="text-xs text-[#618389] font-medium">Updating inquiry for {formData.firstName} {formData.lastName}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="h-11 px-6 rounded-xl border border-[#dbe4e6] text-[#111718] text-sm font-bold hover:bg-[#f6f8f8] transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-11 px-8 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-center min-w-[140px]"
                    >
                        {saving ? "Saving Changes..." : "Update Details"}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 max-w-5xl mx-auto w-full">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 italic text-sm font-bold">
                        {error}
                    </div>
                )}

                <div className="bg-white border border-[#dbe4e6] rounded-2xl shadow-sm p-8">
                    <h3 className="text-xs font-black text-[#618389] uppercase tracking-widest mb-10 border-b border-[#f0f4f4] pb-5">Basic Information</h3>

                    <form className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">First Name *</label>
                                        <input
                                            name="firstName" value={formData.firstName} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="text" required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Last Name *</label>
                                        <input
                                            name="lastName" value={formData.lastName} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="text" required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Email Address</label>
                                    <input
                                        name="email" value={formData.email} onChange={handleChange}
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                        type="email"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Phone *</label>
                                        <input
                                            name="phone" value={formData.phone} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="tel" required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Secondary Mobile</label>
                                        <input
                                            name="mobile" value={formData.mobile} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="tel"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Event Preference *</label>
                                    <select
                                        name="event" value={formData.event} onChange={handleChange}
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium outline-none appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Event</option>
                                        {events.map(e => (
                                            <option key={e._id} value={e.name}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Lead Source *</label>
                                        <select
                                            name="source" value={formData.source} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium outline-none appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="facebook">Facebook</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="website">Website</option>
                                            <option value="direct-call">Direct Call</option>
                                            <option value="walk-in">Walk-in</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Lead Status *</label>
                                        <select
                                            name="status" value={formData.status} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium outline-none appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="new">New Inquiry</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="negotiating">Negotiating</option>
                                            <option value="hot">🔥 Hot Lead</option>
                                            <option value="warm">⚡ Warm</option>
                                            <option value="cold">❄️ Cold</option>
                                            <option value="closed-won">✅ Won</option>
                                            <option value="closed-lost">❌ Lost</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Lead Quality Rating</label>
                                    <div className="flex gap-2">
                                        {['A', 'B', 'C', 'D', 'E'].map(q => (
                                            <button
                                                key={q}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, quality: q }))}
                                                className={`flex-1 h-12 rounded-xl text-sm font-bold border transition-all ${formData.quality === q
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-[#f6f8f8] text-[#618389] border-[#dbe4e6]"
                                                    }`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Next Follow-up Call</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="nextCallDate" value={formData.nextCallDate} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="datetime-local"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, nextCallNotify: !prev.nextCallNotify }))}
                                            className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${formData.nextCallNotify ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-[#f6f8f8] border-[#dbe4e6] text-[#b3c1c4] hover:border-[#111718] hover:text-[#111718]'}`}
                                            title="Notify Me"
                                        >
                                            <span className="material-symbols-outlined">notifications</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Special Occasion</label>
                                    <input
                                        name="occasion" value={formData.occasion} onChange={handleChange}
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium outline-none"
                                        placeholder="e.g. Honeymoon" type="text"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Next Follow-up Goal</label>
                                    <textarea
                                        name="nextCallGoal" value={formData.nextCallGoal} onChange={handleChange}
                                        className="w-full h-24 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl p-4 text-sm font-medium outline-none resize-none transition-all focus:bg-white"
                                        placeholder="e.g. Confirm group discount details..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#f0f4f4]">
                            <h3 className="text-xs font-black text-[#618389] uppercase tracking-widest mb-8">Booking Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Check-in Date</label>
                                        <input
                                            name="checkInDate" value={formData.checkInDate} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Check-out Date</label>
                                        <input
                                            name="checkOutDate" value={formData.checkOutDate} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none"
                                            type="date"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Guests</label>
                                        <input name="guests" value={formData.guests} onChange={handleChange} className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold outline-none" type="number" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Infants</label>
                                        <input name="infants" value={formData.infants} onChange={handleChange} className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold outline-none" type="number" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Children</label>
                                        <input name="children" value={formData.children} onChange={handleChange} className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold outline-none" type="number" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Pets</label>
                                        <input name="pets" value={formData.pets} onChange={handleChange} className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold outline-none" type="number" min="0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#f0f4f4]">
                            <label className="text-sm font-bold text-[#111718] block mb-3">Additional Notes</label>
                            <textarea
                                name="notes" value={formData.notes} onChange={handleChange}
                                className="w-full h-32 bg-[#f6f8f8] border border-[#dbe4e6] rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/5 focus:bg-white outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
