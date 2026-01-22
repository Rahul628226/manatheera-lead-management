"use client";

import React from "react";

/**
 * Reusable Table Pagination Component
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination state object { page, totalPages, total, limit }
 * @param {Function} props.onPageChange - Callback function when page changes (newPage) => void
 * @param {string} [props.className] - Optional extra classes
 */
export default function TablePagination({ pagination, onPageChange, className = "" }) {
    const { page, totalPages, total, limit } = pagination;

    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        // Always show first page
        pages.push(1);

        // Logic to show a range around current page (e.g. 1 ... 4 5 6 ... 10)
        // For simplicity in this reusable component, let's stick to a reasonable max number or the logic from LeadsPage
        // The LeadsPage implementation simply mapped all totalPages, which might be too many if there are 100 pages.
        // Let's implement a smarter logic or stick to the existing simple one if totalPages is small.
        // Given the existing code was `[...Array(pagination.totalPages)]`, I'll stick to that but maybe limit it if it gets too large in future.
        // For now, to match the "Leads" style exactly:

        // Actually, if there are many pages, rendering all buttons is bad UI.
        // I will implement a smarter view if totalPages > 7.

        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // If many pages, show: 1, ..., current-1, current, current+1, ..., last
        if (page <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        } else if (page >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [1, '...', page - 1, page, page + 1, '...', totalPages];
        }
    };

    const handlePageClick = (p) => {
        if (p === '...') return;
        onPageChange(p);
    };

    return (
        <div className={`flex items-center justify-between px-6 py-5 border-t border-slate-200 bg-slate-50/50 ${className}`}>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Displaying <span className="text-slate-900">{(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span> of <span className="text-slate-900">{total}</span> records
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>

                <div className="flex gap-1">
                    {/* If we decide to use the smarter logic, we need to handle '...' differently than just index keys */}
                    {/* For now, let's stick closer to the user's existing simple loop if pages < 10, otherwise smart */}
                    {totalPages <= 10 ? (
                        Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`h-9 w-9 rounded-xl text-xs font-black transition-all shadow-sm ${page === p
                                    ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    }`}
                            >
                                {p}
                            </button>
                        ))
                    ) : (
                        getPageNumbers().map((p, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageClick(p)}
                                disabled={p === '...'}
                                className={`h-9 min-w-[36px] px-1 rounded-xl text-xs font-black transition-all shadow-sm ${p === page
                                    ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                                    : p === '...'
                                        ? "bg-transparent border-none text-slate-400 cursor-default shadow-none"
                                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    }`}
                            >
                                {p}
                            </button>
                        ))
                    )}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}
