"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VillasPage() {
    const router = useRouter();
    const [villas, setVillas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVilla, setEditingVilla] = useState(null);
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
        fetchVillas();
    }, []);

    const fetchVillas = async () => {
        try {
            const res = await fetch("/api/villas");
            const data = await res.json();
            if (res.ok) {
                setVillas(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch villas");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (villa = null) => {
        if (villa) {
            setEditingVilla(villa);
            setFormData({
                name: villa.name,
                image: villa.image || "",
                description: villa.description || ""
            });
        } else {
            setEditingVilla(null);
            setFormData({ name: "", image: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingVilla ? `/api/villas/${editingVilla._id}` : "/api/villas";
            const method = editingVilla ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchVillas();
                setIsModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Failed to save villa");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this villa?")) return;
        try {
            const res = await fetch(`/api/villas/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchVillas();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete villa");
            }
        } catch (err) {
            console.error("Failed to delete villa:", err);
            alert("An error occurred while deleting the villa");
        }
    };

    return (
        <main className="max-w-[1440px] mx-auto px-6 py-8 w-full">
            <div className="flex justify-between items-end mb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl font-black italic tracking-tight uppercase">Villa Management</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configure your resort inventory</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">add_home</span>
                    <span>Add New Villa</span>
                </button>
            </div>

            {loading ? (
                <div className="p-20 text-center font-bold text-slate-300 italic">Inventory syncing...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {villas.map((villa) => (
                        <div key={villa._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                {villa.image ? (
                                    <img src={villa.image} alt={villa.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleOpenModal(villa)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-600 hover:text-primary shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(villa._id)} className="size-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-slate-900 font-black text-lg mb-2">{villa.name}</h3>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 mb-4">
                                    {villa.description || "No description provided for this luxury stay."}
                                </p>
                                <div className="flex border-t border-slate-50 pt-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Added {new Date(villa.createdAt).toLocaleDateString()}</span>
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
                                <span className="material-symbols-outlined text-2xl">villa</span>
                            </div>
                            <div>
                                <h2 className="text-slate-900 font-black text-xl italic tracking-tight">{editingVilla ? 'Edit Villa' : 'Add New Villa'}</h2>
                                <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Configure property details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Villa Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Ocean Blue Presidential"
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
                                    placeholder="Brief highlights of the villa..."
                                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none resize-none transition-all"
                                ></textarea>
                            </div>

                            <button
                                disabled={saving}
                                className="w-full h-14 bg-primary text-white rounded-xl text-base font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all mt-2 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : (editingVilla ? "Update Villa" : "Add Villa")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
