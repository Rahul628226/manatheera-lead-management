"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TablePagination from "@/components/ui/TablePagination";

export default function WebsiteEnquiryPage() {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    const fetchEnquiries = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: pagination.limit,
                search: filters.search,
                startDate: filters.startDate,
                endDate: filters.endDate,
            }).toString();

            const response = await fetch(`/api/contact7/list?${query}`);
            const data = await response.json();
            if (response.ok) {
                setEnquiries(data.data);
                setPagination(prev => ({
                    ...prev,
                    page: data.page,
                    totalPages: data.totalPages,
                    total: data.total
                }));
            }
        } catch (err) {
            console.error("Failed to fetch enquiries");
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, filters.search, filters.startDate, filters.endDate]);

    useEffect(() => {
        fetchEnquiries(pagination.page);
    }, [pagination.page, filters.startDate, filters.endDate, fetchEnquiries]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchEnquiries(1);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/contact7/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setEnquiries(prev => prev.map(enq => enq._id === id ? { ...enq, status: newStatus } : enq));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Status update error", error);
            alert("An error occurred while updating status");
        }
    };

    return (
        <main className="flex flex-1 flex-col px-4 md:px-10 lg:px-20 py-6 w-full max-w-[1600px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 py-2 mb-4">
                <Link href="/dashboard" className="text-slate-500 text-sm font-medium hover:text-primary transition-colors">Home</Link>
                <span className="text-slate-400 text-sm font-medium">/</span>
                <span className="text-slate-900 text-sm font-bold">Website Enquiry</span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 text-3xl font-black tracking-tight">Website Enquiries</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage and view contact form submissions</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => fetchEnquiries(pagination.page)}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
                    </button>
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
                        placeholder="Search name, phone, email or subject..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={handleSearch}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-slate-50 border border-slate-200 group transition-all">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">calendar_month</span>
                        <span className="text-xs font-bold text-slate-700">Date Range</span>
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

                    {(filters.search || filters.startDate || filters.endDate) && (
                        <button
                            onClick={() => {
                                setFilters({ search: "", startDate: "", endDate: "" });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-4 text-xs font-black text-red-500 hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Enquiries Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-5 w-40 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Person</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Message</th>
                                <th className="p-5 w-32 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="p-5 w-24 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Consent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 animate-pulse font-bold uppercase text-xs tracking-widest">Loading enquiries...</td>
                                </tr>
                            ) : enquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No matching enquiries found</td>
                                </tr>
                            ) : enquiries.map((enq) => (
                                <tr key={enq._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">
                                                {new Date(enq.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 align-top">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900">{enq.name || "Unknown"}</span>
                                            <span className="text-[11px] font-bold text-slate-400">{enq.email || "No email"}</span>
                                            <span className="text-[10px] text-slate-500 mt-0.5">{enq.phone || "No phone"}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 align-top">
                                        <span className="text-xs font-bold text-slate-700">{enq.subject || "-"}</span>
                                    </td>
                                    <td className="p-5 align-top max-w-[300px]">
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap" title={enq.message}>{enq.message || "-"}</p>
                                    </td>
                                    <td className="p-5 align-top text-center">
                                        <select
                                            value={enq.status || 'new'}
                                            onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border outline-none cursor-pointer text-center ${
                                                enq.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                enq.status === 'reviewed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}
                                        >
                                            <option value="new">New</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </td>
                                    <td className="p-5 align-top text-center">
                                        {enq.consent ? (
                                            <span className="material-symbols-outlined text-emerald-500 text-lg" title="Agreed to data collection">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-300 text-lg" title="No consent provided">cancel</span>
                                        )}
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
