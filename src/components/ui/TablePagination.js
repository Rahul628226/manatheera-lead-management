"use client";

import React from "react";

/**
 * Reusable Table Pagination Component with Ellipsis
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination state object { page, totalPages, total, limit }
 * @param {Function} props.onPageChange - Callback function when page changes (newPage) => void
 * @param {string} [props.className] - Optional extra classes
 */
export default function TablePagination({ pagination, onPageChange, className = "" }) {
    const { page, totalPages, total, limit } = pagination;

    // Helper to generate page numbers with ellipsis
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const leftBoundary = 3;
        const rightBoundary = totalPages - 2;

        if (page <= 4) {
            // Near start: 1 2 3 4 5 ... 18
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push("...");
            pages.push(totalPages);
        } else if (page >= totalPages - 3) {
            // Near end: 1 ... 14 15 16 17 18
            pages.push(1);
            pages.push("...");
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            // Middle: 1 ... 7 8 9 ... 18
            pages.push(1);
            pages.push("...");
            pages.push(page - 1);
            pages.push(page);
            pages.push(page + 1);
            pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageClick = (p) => {
        if (p === "...") return;
        onPageChange(p);
    };

    if (total === 0) return null;

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-slate-200 bg-slate-50/50 gap-4 ${className}`}>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider order-2 sm:order-1">
                Displaying <span className="text-slate-900">{(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span> of <span className="text-slate-900">{total}</span> records
            </span>
            
            <div className="flex items-center gap-2 order-1 sm:order-2">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-90"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1.5">
                    {getPageNumbers().map((p, i) => (
                        <button
                            key={i}
                            onClick={() => handlePageClick(p)}
                            disabled={p === "..."}
                            className={`h-10 min-w-[40px] px-2 rounded-2xl text-xs font-black transition-all ${
                                p === page
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                    : p === "..."
                                        ? "bg-transparent border-none text-slate-400 cursor-default"
                                        : "bg-white border border-slate-200 text-[#618389] hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-90"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}

