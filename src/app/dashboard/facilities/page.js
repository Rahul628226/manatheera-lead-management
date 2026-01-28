"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FacilitiesPage() {
    const router = useRouter();
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState(null);
    const [formData, setFormData] = useState({
        name: ""
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== 'admin' && user.role !== 'developer') {
            router.push("/dashboard");
            return;
        }
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const res = await fetch("/api/facilities");
            const data = await res.json();
            if (res.ok) {
                setFacilities(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch facilities");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (facility = null) => {
        if (facility) {
            setEditingFacility(facility);
            setFormData({
                name: facility.name
            });
        } else {
            setEditingFacility(null);
            setFormData({ name: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingFacility ? `/api/facilities/${editingFacility._id}` : "/api/facilities";
            const method = editingFacility ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchFacilities();
                setIsModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Failed to save facility");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this facility?")) return;
        try {
            const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchFacilities();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete facility");
            }
        } catch (err) {
            console.error("Failed to delete facility:", err);
            alert("An error occurred while deleting the facility");
        }
    };

    return (
        <main className="max-w-[1440px] mx-auto px-6 py-8 w-full">
            <div className="flex justify-between items-end mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl font-black italic tracking-tight uppercase">Facility Management</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configure your facility inventory</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">home_repair_service</span>
                    <span>Add New Facility</span>
                </button>
            </div>

            {loading ? (
                <div className="p-20 text-center font-bold text-slate-300 italic">Inventory syncing...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {facilities.map((facility) => (
                        <div key={facility._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xl">home_repair_service</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(facility)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-400 hover:text-primary shadow-sm border border-slate-100 transition-all">
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(facility._id)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-slate-900 font-black text-lg mb-1">{facility.name}</h3>
                            <div className="flex mt-3 pt-3 border-t border-slate-50">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Added {new Date(facility.createdAt).toLocaleDateString()}</span>
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
                                <span className="material-symbols-outlined text-2xl">home_repair_service</span>
                            </div>
                            <div>
                                <h2 className="text-slate-900 font-black text-xl italic tracking-tight">{editingFacility ? 'Edit Facility' : 'Add New Facility'}</h2>
                                <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Configure facility details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Facility Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Swimming Pool"
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>

                            <button
                                disabled={saving}
                                className="w-full h-14 bg-primary text-white rounded-xl text-base font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all mt-2 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : (editingFacility ? "Update Facility" : "Add Facility")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
