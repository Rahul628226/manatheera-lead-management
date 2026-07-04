"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TablePagination from "@/components/ui/TablePagination";

export default function WebsiteEnquiryPage() {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
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
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

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

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this enquiry?")) return;
        try {
            const response = await fetch(`/api/contact7/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchEnquiries(pagination.page);
            } else {
                alert("Failed to delete enquiry. You might not have permission.");
            }
        } catch (err) {
            console.error("Delete failed");
            alert("An error occurred while deleting the enquiry.");
        }
    };

    return (
        <main className="flex flex-1 flex-col px-4 md:px-10 lg:px-20 py-6 pb-24 md:pb-6 w-full max-w-[1600px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 py-2 mb-4">
                <Link href="/dashboard" className="text-slate-500 text-sm font-medium hover:text-primary transition-colors">Home</Link>
                <span className="text-slate-400 text-sm font-medium">/</span>
                <span className="text-slate-900 text-sm font-bold">Website Enquiry</span>
            </div>

            {/* Page Heading */}
            <div className="flex justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 text-2xl md:text-3xl font-black tracking-tight">Website Enquiries</h1>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Manage and view contact form submissions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchEnquiries(pagination.page)}
                        disabled={loading}
                        className="flex md:hidden items-center justify-center size-10 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
                        title="Refresh List"
                    >
                        <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    <div className="hidden md:flex flex-wrap gap-3">
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
            </div>

            {/* Filters Section (Desktop Only) */}
            <div className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex-wrap gap-4 items-center">
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
                                {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                                    <th className="p-5 w-16 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-slate-400 animate-pulse font-bold uppercase text-xs tracking-widest">Loading enquiries...</td>
                                </tr>
                            ) : enquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No matching enquiries found</td>
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
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                                        <td className="p-5 align-top text-center">
                                            <button
                                                onClick={() => handleDelete(enq._id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                                title="Delete Enquiry"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    )}
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
                    onClick={() => setShowMobileFilters(true)}
                    className={`flex flex-col items-center gap-1 text-[10px] font-bold ${showMobileFilters ? "text-primary" : "text-slate-500"}`}
                >
                    <span className="material-symbols-outlined text-xl">filter_alt</span>
                    <span>Filters</span>
                </button>

                <button
                    onClick={() => fetchEnquiries(pagination.page)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 active:scale-95 disabled:opacity-50"
                >
                    <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
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
                                    placeholder="Search name, phone, email or subject..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={handleSearch}
                                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-slate-700">Date Range</span>
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

                        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setFilters({ search: "", startDate: "", endDate: "" });
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
        </main>
    );
}
