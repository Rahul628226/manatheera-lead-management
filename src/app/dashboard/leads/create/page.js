"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateLead() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [events, setEvents] = useState([]);
    const [availableFacilities, setAvailableFacilities] = useState([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        mobile: "",
        event: "",
        occasion: "",
        source: "",
        status: "new", // Default to new
        quality: "C",
        nextCallDate: "",
        nextCallNotify: false,
        nextCallGoal: "",
        checkInDate: "",
        checkOutDate: "",
        guests: 0,
        children: 0,
        facilities: [],
        notes: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, facilitiesRes] = await Promise.all([
                    fetch("/api/events"),
                    fetch("/api/facilities")
                ]);

                const eventsData = await eventsRes.json();
                const facilitiesData = await facilitiesRes.json();

                if (eventsRes.ok) setEvents(eventsData.data);
                if (facilitiesRes.ok) setAvailableFacilities(facilitiesData.data);
            } catch (err) {
                console.error("Failed to fetch data");
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFacilityChange = (facilityId) => {
        setFormData(prev => {
            const current = prev.facilities || [];
            if (current.includes(facilityId)) {
                return { ...prev, facilities: current.filter(id => id !== facilityId) };
            } else {
                return { ...prev, facilities: [...current, facilityId] };
            }
        });
    };
    const handleSave = async (e, redirect = true) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // --- Notification Injection Logic ---
                if (formData.nextCallNotify && formData.nextCallDate) {
                    try {
                        const newNote = {
                            id: data.data._id || Date.now().toString(),
                            title: `Follow-up Due: ${data.data.firstName} ${data.data.lastName}`,
                            body: "Initial scheduled follow-up.",
                            date: new Date(formData.nextCallDate).toISOString(),
                            shown: false,
                            syncedAt: Date.now()
                        };

                        const existing = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
                        existing.push(newNote);
                        localStorage.setItem('scheduledNotifications', JSON.stringify(existing));
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {
                        console.error("Local schedule update failed", e);
                    }
                }
                // ------------------------------------

                if (redirect) {
                    router.push("/dashboard/leads");
                } else {
                    // Reset form for "Save and New"
                    setFormData({
                        firstName: "", lastName: "", email: "", phone: "", mobile: "",
                        event: "", occasion: "", source: "", status: "", quality: "C",
                        nextCallDate: "", nextCallNotify: false, nextCallGoal: "", checkInDate: "", checkOutDate: "",
                        guests: 0, children: 0, facilities: [], notes: ""
                    });
                    alert("Lead created successfully!");
                }
            } else {
                const data = await response.json();
                setError(data.message || "Failed to create lead");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1">
            {/* Form Header */}
            <header className="flex items-center justify-between bg-white border-b border-[#dbe4e6] px-10 py-4 sticky top-0 z-20">
                <div className="flex items-center gap-4 text-[#111718]">
                    <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">hotel</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight">Create New Lead</h2>
                        <p className="text-xs text-[#618389] font-medium">Add a new inquiry for resort management</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="h-11 px-6 rounded-xl border border-[#dbe4e6] text-[#111718] text-sm font-bold hover:bg-[#f6f8f8] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => handleSave(e, false)}
                        disabled={loading}
                        className="h-11 px-6 rounded-xl border border-[#dbe4e6] text-[#111718] text-sm font-bold hover:bg-[#f6f8f8] transition-all"
                    >
                        {loading ? "..." : "Save and New"}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-11 px-8 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        {loading ? "Saving..." : "Save Lead"}
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
                            {/* Left Column */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="firstName" value={formData.firstName} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            placeholder="John" type="text" required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="lastName" value={formData.lastName} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            placeholder="Doe" type="text" required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Work Email Address</label>
                                    <input
                                        name="email" value={formData.email} onChange={handleChange}
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                        placeholder="john.doe@resort.com" type="email"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                            Phone
                                        </label>
                                        <input
                                            name="phone" value={formData.phone} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            placeholder="+1 (555) 000-0000" type="tel"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Secondary Mobile</label>
                                        <input
                                            name="mobile" value={formData.mobile} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            placeholder="+1 (555) 999-9999" type="tel"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                        Event Preference
                                    </label>
                                    <select
                                        name="event" value={formData.event} onChange={handleChange}
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Event</option>
                                        {events.map(e => (
                                            <option key={e._id} value={e.name}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                            Lead Source
                                        </label>
                                        <select
                                            name="source" value={formData.source} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Source</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="website">Website</option>
                                            <option value="direct-call">Direct Call</option>
                                            <option value="walk-in">Walk-in</option>
                                            <option value="referral">Referral</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718] flex items-center gap-1">
                                            Lead Status
                                        </label>
                                        <select
                                            name="status" value={formData.status} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Status</option>
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
                                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                                    : "bg-white text-[#618389] border-[#dbe4e6] hover:bg-[#f6f8f8]"
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
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            type="datetime-local"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, nextCallNotify: !prev.nextCallNotify }))}
                                            className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${formData.nextCallNotify ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-[#dbe4e6] text-[#b3c1c4] hover:border-[#111718] hover:text-[#111718]'}`}
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
                                        className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                        placeholder="e.g. Honeymoon, Anniversary" type="text"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#111718]">Next Follow-up Goal</label>
                                    <textarea
                                        name="nextCallGoal" value={formData.nextCallGoal} onChange={handleChange}
                                        className="w-full h-24 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none resize-none"
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
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            type="date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#111718]">Check-out Date</label>
                                        <input
                                            name="checkOutDate" value={formData.checkOutDate} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
                                            type="date"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Guests</label>
                                        <input
                                            name="guests" value={formData.guests} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                                            type="number" min="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#618389]">Children</label>
                                        <input
                                            name="children" value={formData.children} onChange={handleChange}
                                            className="w-full h-12 bg-[#f6f8f8] border border-[#dbe4e6] rounded-xl px-2 text-center text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                                            type="number" min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#f0f4f4]">
                            <h3 className="text-xs font-black text-[#618389] uppercase tracking-widest mb-6">Facilities Requested</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {availableFacilities.map(facility => (
                                    <label key={facility._id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.facilities.includes(facility._id) ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-[#f6f8f8] border-[#dbe4e6] text-[#618389] hover:border-slate-300'}`}>
                                        <div className={`size-5 rounded border flex items-center justify-center transition-all ${formData.facilities.includes(facility._id) ? 'bg-primary border-primary text-white' : 'bg-white border-[#dbe4e6]'}`}>
                                            {formData.facilities.includes(facility._id) && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.facilities.includes(facility._id)}
                                            onChange={() => handleFacilityChange(facility._id)}
                                        />
                                        <span className="text-xs font-bold">{facility.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#f0f4f4]">
                            <label className="text-sm font-bold text-[#111718] block mb-3">Additional Instructions & Feedback</label>
                            <textarea
                                name="notes" value={formData.notes} onChange={handleChange}
                                className="w-full h-32 bg-[#f6f8f8] border border-[#dbe4e6] rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:bg-white outline-none transition-all resize-none"
                                placeholder="Add any specific guest preferences, dietary requirements, or follow-up notes..."
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="mt-8 flex items-center justify-between opacity-70">
                    <p className="text-xs text-[#618389] italic font-medium">Fields marked with * are required for lead tracking.</p>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs cursor-pointer hover:underline transition-all">
                        <span className="material-symbols-outlined text-sm">help</span>
                        <span>Form Help Center</span>
                    </div>
                </div>
            </main >
        </div >
    );
}
