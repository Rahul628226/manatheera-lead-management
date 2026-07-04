"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TablePagination from "@/components/ui/TablePagination";
import * as XLSX from 'xlsx';

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
        staffSearch: "",
        showDeleted: false
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [isReady, setIsReady] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);

    useEffect(() => {
        const isBackFromDetail = sessionStorage.getItem("leads_backToLeads") === "true";
        const savedFilters = sessionStorage.getItem("leadsFilters");
        const savedPagination = sessionStorage.getItem("leadsPagination");

        if (isBackFromDetail && savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                setFilters(prev => ({ ...prev, ...parsed }));
            } catch (e) { console.error("Failed to parse filters", e); }
        } else if (!isBackFromDetail) {
            // Reset state if not returning from detail
            sessionStorage.removeItem("leadsFilters");
            sessionStorage.removeItem("leadsPagination");
        }

        if (isBackFromDetail && savedPagination) {
            try {
                const parsed = JSON.parse(savedPagination);
                setPagination(prev => ({ ...prev, page: parsed.page || 1 }));
            } catch (e) { console.error("Failed to parse pagination", e); }
        }

        // Clear flags
        sessionStorage.removeItem("leads_wasOnLeads");
        sessionStorage.removeItem("leads_fromLeads");
        sessionStorage.removeItem("leads_backToLeads");

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchStats();
        setIsReady(true);

        return () => {
            sessionStorage.setItem("leads_wasOnLeads", "true");
        };
    }, []);

    useEffect(() => {
        if (isReady) {
            sessionStorage.setItem("leadsFilters", JSON.stringify(filters));
        }
    }, [filters, isReady]);

    useEffect(() => {
        if (isReady) {
            sessionStorage.setItem("leadsPagination", JSON.stringify(pagination));
        }
    }, [pagination, isReady]);

    useEffect(() => {
        if (isReady) {
            fetchLeads(pagination.page);
        }
    }, [isReady, pagination.page, filters.status, filters.source, filters.startDate, filters.endDate, filters.dateType, filters.showDeleted]);

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
                staffSearch: filters.staffSearch,
                showDeleted: filters.showDeleted
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

    const handleRestore = async (id) => {
        if (!confirm("Restore this lead to active pipeline?")) return;
        try {
            const response = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: false })
            });
            if (response.ok) {
                fetchLeads(pagination.page);
                fetchStats();
            } else {
                alert("Failed to restore lead.");
            }
        } catch (err) {
            console.error("Restore failed");
        }
    };

    const canManageLead = (lead) => {
        if (!currentUser) return false;
        // All roles can manage leads now
        return true;
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams({
                search: filters.search,
                status: filters.status,
                source: filters.source,
                startDate: filters.startDate,
                endDate: filters.endDate,
                dateType: filters.dateType,
                staffSearch: filters.staffSearch,
                showDeleted: filters.showDeleted
            }).toString();

            const response = await fetch(`/api/leads/export?${query}`);
            const data = await response.json();

            if (response.ok && data.status === 'success') {
                const worksheet = XLSX.utils.json_to_sheet(data.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

                // Adjust column widths
                const wscols = Object.keys(data.data[0] || {}).map(key => ({
                    wch: Math.max(key.length, ...data.data.map(row => String(row[key] || '').length)) + 2
                }));
                worksheet['!cols'] = wscols;

                XLSX.writeFile(workbook, `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            } else {
                alert("Failed to export leads data.");
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("An error occurred during export.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-1 flex-col px-4 md:px-10 lg:px-20 py-6 w-full max-w-[1600px] mx-auto pb-24 md:pb-6">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 py-2 mb-4">
                <Link href="/dashboard" className="text-slate-500 text-sm font-medium hover:text-primary transition-colors">Home</Link>
                <span className="text-slate-400 text-sm font-medium">/</span>
                <span className="text-slate-900 text-sm font-bold">Lead Management</span>
            </div>

            {/* Page Heading */}
            <div className="flex justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 text-2xl md:text-3xl font-black tracking-tight">Lead Pipeline</h1>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Manage and convert your resort inquiries</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="flex md:hidden items-center justify-center size-10 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
                        title="Export Excel"
                    >
                        <span className="material-symbols-outlined text-xl">download</span>
                    </button>
                    <div className="hidden md:flex flex-wrap gap-3">
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-xl">download</span>
                            <span>{loading ? 'Exporting...' : 'Export Excel'}</span>
                        </button>
                        <Link
                            href="/dashboard/leads/create"
                            className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined font-bold">add</span>
                            <span>Add New Lead</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Section (Desktop Only) */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

            {/* Filters Section (Desktop Only) */}
            <div className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex-wrap gap-4 items-center">
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
                            onChange={(e) => {
                                setFilters({ ...filters, dateType: e.target.value });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
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
                            onChange={(e) => {
                                setFilters({ ...filters, startDate: e.target.value });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                            title="Start Date"
                        />
                        <span className="text-[9px] font-black text-slate-300">TO</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => {
                                setFilters({ ...filters, endDate: e.target.value });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
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

                    {(filters.status || filters.source || filters.search || filters.startDate || filters.endDate || filters.staffSearch || filters.showDeleted) && (
                        <button
                            onClick={() => {
                                setFilters({ search: "", status: "", source: "", startDate: "", endDate: "", dateType: "createdAt", staffSearch: "", showDeleted: false });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-4 text-xs font-black text-red-500 hover:underline"
                        >
                            Reset
                        </button>
                    )}

                    {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                        <button
                            onClick={() => {
                                setFilters(prev => ({ ...prev, showDeleted: !prev.showDeleted }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`flex items-center gap-2 h-11 px-4 rounded-xl border transition-all text-xs font-black ${filters.showDeleted
                                ? 'bg-red-50 border-red-200 text-red-600 shadow-sm shadow-red-100'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            title={filters.showDeleted ? "Back to Active Leads" : "View Deleted Leads"}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {filters.showDeleted ? 'restore_from_trash' : 'delete_sweep'}
                            </span>
                            <span>{filters.showDeleted ? 'Viewing Deleted' : 'Bin'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Leads Table (Sliding horizontal container) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">
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
                                                    {filters.showDeleted ? (
                                                        <button
                                                            onClick={() => handleRestore(lead._id)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 transition-all font-bold"
                                                            title="Restore Lead"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">restore_from_trash</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDelete(lead._id)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                                            title="Delete Lead"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    )}
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

            {/* Sticky Bottom Tab Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 flex justify-around items-center md:hidden z-40 shadow-2xl">
                <button
                    onClick={() => {
                        setShowMobileFilters(true);
                        setShowMobileStats(false);
                    }}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold ${showMobileFilters ? "text-primary" : "text-slate-500"}`}
                >
                    <span className="material-symbols-outlined text-xl">filter_alt</span>
                    <span>Filters</span>
                </button>

                <Link
                    href="/dashboard/leads/create"
                    className="flex items-center justify-center size-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all -translate-y-3 border-4 border-white"
                    title="Add New Lead"
                >
                    <span className="material-symbols-outlined font-black text-2xl">add</span>
                </Link>

                <button
                    onClick={() => {
                        setShowMobileStats(true);
                        setShowMobileFilters(false);
                    }}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold ${showMobileStats ? "text-primary" : "text-slate-500"}`}
                >
                    <span className="material-symbols-outlined text-xl">analytics</span>
                    <span>Analytics</span>
                </button>
            </div>

            {/* Mobile Filters Overlay Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 bg-black/50 flex justify-end md:hidden">
                    <div className="w-full max-w-[320px] bg-white h-full p-5 flex flex-col gap-4 overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <span className="text-base font-black text-slate-900">Search & Filters</span>
                            <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-slate-700">Search Query</span>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <span className="material-symbols-outlined text-lg">search</span>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search name, phone, email..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={handleSearch}
                                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Staff Search */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-slate-700">Created By Staff</span>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                                        <span className="material-symbols-outlined text-lg">person_search</span>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Staff Name..."
                                        value={filters.staffSearch}
                                        onChange={(e) => setFilters({ ...filters, staffSearch: e.target.value })}
                                        onKeyDown={handleSearch}
                                        className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium italic"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Date Filters */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-slate-700">Date Filters</span>
                            <select
                                value={filters.dateType}
                                onChange={(e) => {
                                    setFilters({ ...filters, dateType: e.target.value });
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                            >
                                <option value="createdAt">Created On</option>
                                <option value="checkInDate">Check-in</option>
                                <option value="checkOutDate">Check-out</option>
                                <option value="nextCallDate">Follow-up</option>
                                {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                                    <option value="recentTask">Recent Task</option>
                                )}
                            </select>
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">From</span>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => {
                                            setFilters({ ...filters, startDate: e.target.value });
                                            setPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">To</span>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => {
                                            setFilters({ ...filters, endDate: e.target.value });
                                            setPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-slate-700">Pipeline Status</span>
                            <select
                                value={filters.status}
                                onChange={(e) => {
                                    setFilters({ ...filters, status: e.target.value });
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
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
                        </div>

                        {/* Source Filter */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-slate-700">Source Channel</span>
                            <select
                                value={filters.source}
                                onChange={(e) => {
                                    setFilters({ ...filters, source: e.target.value });
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
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
                        </div>

                        {/* Bin Filter for Admins */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                            <button
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, showDeleted: !prev.showDeleted }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className={`flex items-center justify-center gap-2 h-10 w-full rounded-xl border transition-all text-xs font-bold ${filters.showDeleted
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {filters.showDeleted ? 'restore_from_trash' : 'delete_sweep'}
                                </span>
                                <span>{filters.showDeleted ? 'Viewing Deleted Leads' : 'View Bin / Deleted'}</span>
                            </button>
                        )}

                        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setFilters({ search: "", status: "", source: "", startDate: "", endDate: "", dateType: "createdAt", staffSearch: "", showDeleted: false });
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Stats Drawer */}
            {showMobileStats && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center md:hidden" onClick={() => setShowMobileStats(false)}>
                    <div className="w-full bg-white rounded-t-2xl p-5 flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-base font-black text-slate-900">Analytics Overview</span>
                            <button onClick={() => setShowMobileStats(false)} className="text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-2">
                            {/* Stat Card 1 */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[10px] font-black uppercase">Total Leads</span>
                                    <span className="text-xl font-black text-slate-900 mt-0.5">{stats.totalLeads.toLocaleString()}</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                                    +{stats.newLeadsToday} Today
                                </span>
                            </div>
                            
                            {/* Stat Card 2 */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[10px] font-black uppercase">Hot Leads</span>
                                    <span className="text-xl font-black text-slate-900 mt-0.5">{stats.hotLeads}</span>
                                </div>
                                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                                    🔥 Live Inquiries
                                </span>
                            </div>
                            
                            {/* Stat Card 3 */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[10px] font-black uppercase">Conversion</span>
                                    <span className="text-xl font-black text-slate-900 mt-0.5">{stats.conversionRate}%</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    Won Pipeline
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
