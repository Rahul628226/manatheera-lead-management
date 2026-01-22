"use client";

import { useState, useEffect } from "react";
import TablePagination from "@/components/ui/TablePagination";

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        name: "",
        date: ""
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 20
    });

    useEffect(() => {
        fetchLogs(pagination.page);
    }, [pagination.page]);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: pagination.limit,
                name: filters.name,
                date: filters.date
            }).toString();

            const response = await fetch(`/api/logs?${query}`);
            const data = await response.json();
            if (response.ok) {
                setLogs(data.data);
                setPagination(prev => ({
                    ...prev,
                    page: data.page,
                    totalPages: data.totalPages,
                    total: data.total
                }));
            }
        } catch (err) {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs(1);
    };

    const clearFilters = () => {
        setFilters({ name: "", date: "" });
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs(1);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                <a className="text-[#618389] hover:text-primary transition-colors" href="#">Admin Panel</a>
                <span className="text-[#618389] material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#111718]">Activity Logs</span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h3 className="text-[#111718] text-3xl font-black tracking-tight mb-2">User Activity Logs</h3>
                    <p className="text-[#618389] text-base">Monitor system access, logins, and logouts across the platform.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute inset-y-0 left-3 flex items-center text-[#618389]">
                            <span className="material-symbols-outlined text-xl">search</span>
                        </span>
                        <input
                            name="name"
                            value={filters.name}
                            onChange={handleFilterChange}
                            placeholder="Search by username..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dbe4e6] rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                    <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleFilterChange}
                        className="px-4 py-2 bg-white border border-[#dbe4e6] rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-[#618389]"
                    />
                    <button
                        onClick={applyFilters}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-md shadow-primary/10"
                    >
                        Filter
                    </button>
                    {(filters.name || filters.date) && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-[#618389] text-sm font-medium hover:text-[#111718] transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl border border-[#dbe4e6] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f6f8f8] border-b border-[#dbe4e6]">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">User</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Action</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Location / IP</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbe4e6]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-[#618389]">Loading activity logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-[#618389]">No activity records found.</td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-[#f6f8f8]/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#e2e8f0] text-gray-600 font-bold rounded-full size-8 flex items-center justify-center text-xs uppercase">
                                                {(log.userId?.fullName || log.username).substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#111718]">{log.userId?.fullName || log.username}</div>
                                                <div className="text-[10px] text-[#618389] uppercase font-bold">{log.userId?.role || 'User'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${log.action === 'login'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : log.action === 'logout'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#618389]">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#111718] font-medium">{log.ipAddress}</span>
                                            <span className="text-[10px] text-[#618389] truncate max-w-[150px]">{log.userAgent}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#111718] font-bold">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-[#618389]">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </span>
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
        </div>
    );
}
