"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TablePagination from "@/components/ui/TablePagination";

export default function LeadsPage() {
    const router = useRouter();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({
        totalLeads: 0,
        hotLeads: 0,
        conversionRate: 0,
        newLeadsToday: 0
    });
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        source: "",
        startDate: "",
        endDate: "",
        dateType: "createdAt",
        staffSearch: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchStats();
    }, []);

    useEffect(() => {
        fetchLeads(pagination.page);
    }, [pagination.page, filters.status, filters.source, filters.startDate, filters.endDate, filters.dateType]);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/leads/stats");
            const data = await response.json();
            if (response.ok) {
                setStats(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    const fetchLeads = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: pagination.limit,
                search: filters.search,
                status: filters.status,
                source: filters.source,
                startDate: filters.startDate,
                endDate: filters.endDate,
                dateType: filters.dateType,
                staffSearch: filters.staffSearch
            }).toString();

            const response = await fetch(`/api/leads?${query}`);
            const data = await response.json();
            if (response.ok) {
                setLeads(data.data);
                setPagination(prev => ({
                    ...prev,
                    page: data.page,
                    totalPages: data.totalPages,
                    total: data.total
                }));
            }
        } catch (err) {
            console.error("Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchLeads(1);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this lead?")) return;
        try {
            const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchLeads(pagination.page);
                fetchStats();
            } else {
                alert("Failed to delete lead. You might not have permission.");
            }
        } catch (err) {
            console.error("Delete failed");
        }
    };

    const canManageLead = (lead) => {
        if (!currentUser) return false;
        // All roles can manage leads now
        return true;
    };

    return (
        <main className="flex flex-1 flex-col px-4 md:px-10 lg:px-20 py-6 w-full max-w-[1600px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 py-2 mb-4">
                <Link href="/dashboard" className="text-slate-500 text-sm font-medium hover:text-primary transition-colors">Home</Link>
                <span className="text-slate-400 text-sm font-medium">/</span>
                <span className="text-slate-900 text-sm font-bold">Lead Management</span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 text-3xl font-black tracking-tight">Lead Pipeline</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage and convert your resort inquiries</p>
                </div>
                <Link
                    href="/dashboard/leads/create"
                    className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined font-bold">add</span>
                    <span>Add New Lead</span>
                </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Total Leads</span>
                        <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">groups</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{stats.totalLeads.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                            <span className="material-symbols-outlined text-xs">trending_up</span> {stats.newLeadsToday} today
                        </span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Hot Leads</span>
                        <div className="size-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">local_fire_department</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{stats.hotLeads}</span>
                        <span className="text-[10px] font-bold text-orange-400">🔥 Live Inquiries</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Conversion</span>
                        <div className="size-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{stats.conversionRate}%</span>
                        <span className="text-[10px] font-bold text-slate-400">Won Pipeline</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[280px]">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-xl">search</span>
                    </span>
                    <input
                        type="text"
                        placeholder="Search leads, phone, or email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={handleSearch}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium"
                    />
                </div>

                {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <span className="material-symbols-outlined text-xl">person_search</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Created by (Staff Name)..."
                            value={filters.staffSearch}
                            onChange={(e) => setFilters({ ...filters, staffSearch: e.target.value })}
                            onKeyDown={handleSearch}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium italic"
                        />
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Type Selector */}
                    <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-slate-50 border border-slate-200 group transition-all">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">calendar_month</span>
                        <select
                            value={filters.dateType}
                            onChange={(e) => setFilters({ ...filters, dateType: e.target.value })}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="createdAt">Created On</option>
                            <option value="checkInDate">Check-in</option>
                            <option value="checkOutDate">Check-out</option>
                            <option value="nextCallDate">Follow-up</option>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                                <option value="recentTask">Recent Task</option>
                            )}
                        </select>
                        <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                            title="Start Date"
                        />
                        <span className="text-[9px] font-black text-slate-300">TO</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                            title="End Date"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => {
                            setFilters({ ...filters, status: e.target.value });
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New Inquiries</option>
                        <option value="hot">🔥 Hot Leads</option>
                        <option value="warm">⚡ Warm Leads</option>
                        <option value="contacted">Contacted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">❌ Closed Lost</option>
                    </select>

                    <select
                        value={filters.source}
                        onChange={(e) => {
                            setFilters({ ...filters, source: e.target.value });
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">All Sources</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="website">Website</option>
                        <option value="direct-call">Direct Call</option>
                        <option value="walk-in">Walk-in</option>
                        <option value="referral">Referral</option>
                    </select>

                    {(filters.status || filters.source || filters.search || filters.startDate || filters.endDate || filters.staffSearch) && (
                        <button
                            onClick={() => {
                                setFilters({ search: "", status: "", source: "", startDate: "", endDate: "", dateType: "createdAt", staffSearch: "" });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-4 text-xs font-black text-red-500 hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 w-12"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Name & Contact</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Source</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Check-In / Out</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Follow-Up</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Owner</th>
                                <th className="p-5 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-slate-400 animate-pulse font-bold uppercase text-xs tracking-widest">Syncing with pipeline...</td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No matching leads found</td>
                                </tr>
                            ) : leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/leads/${lead._id}`} className="font-black text-slate-900 hover:text-primary transition-colors cursor-pointer group-hover:underline">
                                                {lead.firstName} {lead.lastName}
                                            </Link>
                                            <span className="text-[11px] font-bold text-slate-400">{lead.email || "No email provided"}</span>
                                            <span className="text-[10px] text-slate-500 mt-0.5">{lead.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-6 rounded flex items-center justify-center ${lead.source === 'instagram' ? 'bg-pink-50 text-pink-500' :
                                                lead.source === 'facebook' ? 'bg-slate-100 text-slate-600' :
                                                    lead.source === 'whatsapp' ? 'bg-emerald-50 text-emerald-500' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {lead.source === 'direct-call' ? 'call' :
                                                        lead.source === 'instagram' ? 'photo_camera' :
                                                            lead.source === 'facebook' ? 'social_leaderboard' : 'language'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 capitalize">{lead.source}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${lead.status === 'hot' ? 'bg-primary text-white border-primary' :
                                            lead.status === 'closed-won' ? 'bg-emerald-500 text-white border-emerald-600' :
                                                lead.status === 'closed-lost' ? 'bg-rose-500 text-white border-rose-600' :
                                                    lead.status === 'warm' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        lead.status === 'cold' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {lead.status === 'hot' ? '🔥 ' :
                                                lead.status === 'closed-lost' ? '❌ ' : ''}{lead.status.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">
                                                {lead.checkInDate ? new Date(lead.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "TBD"}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                to {lead.checkOutDate ? new Date(lead.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "--"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {lead.nextCallDate ? (
                                            <div className={`flex items-center gap-2 ${new Date(lead.nextCallDate) < new Date() ? 'text-red-500' : 'text-primary'}`}>
                                                <span className="material-symbols-outlined text-[16px]">call</span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold italic underline">
                                                        {new Date(lead.nextCallDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] opacity-70">{new Date(lead.nextCallDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-[16px]">history</span>
                                                <span className="text-[10px] font-bold uppercase tracking-tight">No Action Set</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-[10px] text-slate-600 border border-slate-300 uppercase">
                                                {lead.owner?.fullName?.substring(0, 2) || "??"}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {(lead.owner?._id === currentUser?._id || lead.owner === currentUser?._id)
                                                        ? "You"
                                                        : (lead.owner?.fullName?.split(' ')[0] || "Unknown")}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{lead.owner?.role || "USER"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            {canManageLead(lead) && (
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/dashboard/leads/edit/${lead._id}`)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-primary transition-all"
                                                        title="Edit Lead"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lead._id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                                        title="Delete Lead"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    pagination={pagination}
                    onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                />
            </div>
        </main>
    );
}
