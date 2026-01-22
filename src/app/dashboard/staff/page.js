"use client";

import { useState, useEffect } from "react";
import UserModal from "@/components/ui/UserModal";
import TablePagination from "@/components/ui/TablePagination";

export default function StaffPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [toast, setToast] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
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
    }, []);

    useEffect(() => {
        fetchUsers(pagination.page);
    }, [pagination.page]);

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users?page=${page}&limit=${pagination.limit}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data.data);
                setPagination(prev => ({
                    ...prev,
                    page: data.page,
                    totalPages: data.totalPages,
                    total: data.total
                }));
            }
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this staff member?")) return;

        try {
            const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
            const data = await response.json();

            if (response.ok) {
                fetchUsers(pagination.page);
                showToast("Staff member deleted successfully");
            } else {
                alert(data.message || "Failed to delete staff member");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            alert("An error occurred while deleting the staff member");
        }
    };

    const toggleStatus = async (user) => {
        const currentStatus = user.status || "active";
        const newStatus = currentStatus === "active" ? "inactive" : "active";

        // Developer accounts should always be active for safety
        if (user.role === 'developer' && newStatus === 'inactive') {
            alert("Developer accounts cannot be deactivated for system safety.");
            return;
        }

        try {
            const response = await fetch(`/api/users/${user._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                setUsers(users.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u)));
                showToast(`Staff member is now ${newStatus}`);
            }
        } catch (err) {
            console.error("Status update failed");
        }
    };

    const canManage = currentUser?.role === 'admin' || currentUser?.role === 'developer';

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                <a className="text-[#618389] hover:text-primary transition-colors" href="#">Admin Panel</a>
                <span className="text-[#618389] material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#111718]">Staff Management</span>
            </div>

            {/* Page Heading */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-[#111718] text-3xl font-black tracking-tight mb-2">Manage Team Members</h3>
                    <p className="text-[#618389] text-base">Control administrative access, manage staff roles, and monitor account activity.</p>
                </div>
                {canManage && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined mr-2">person_add</span>
                        <span>Create New Staff</span>
                    </button>
                )}
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl border border-[#dbe4e6] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f6f8f8] border-b border-[#dbe4e6]">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Name & Identity</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Role</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Contact Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389]">Status</th>
                                {canManage && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#618389] text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbe4e6]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-[#618389]">Loading staff members...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-[#618389]">No staff members found.</td>
                                </tr>
                            ) : users.map((member) => (
                                <tr key={member._id} className="hover:bg-[#f6f8f8]/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`${member.role === 'admin' || member.role === 'developer' ? 'bg-primary/20 text-primary' : 'bg-[#e2e8f0] text-gray-600'} font-bold rounded-full size-10 flex items-center justify-center uppercase`}>
                                                {(member.fullName || member.username || "??").substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#111718]">{member.fullName || member.username}</div>
                                                <div className="text-xs text-[#618389]">@{member.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${member.role === 'admin' || member.role === 'developer'
                                            ? 'bg-primary/10 text-primary border-primary/20'
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#618389]">
                                        <div className="flex flex-col">
                                            <span>{member.email}</span>
                                            <span className="text-xs">{member.phone || "No phone"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => canManage && toggleStatus(member)}
                                            className={`flex items-center gap-2 group ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <span className={`size-2 rounded-full ${(member.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                            <span className={`text-sm font-medium transition-colors ${(member.status || 'active') === 'active' ? 'text-emerald-600' : 'text-gray-500'} ${canManage ? 'group-hover:underline' : ''}`}>
                                                {(member.status || 'active').charAt(0).toUpperCase() + (member.status || 'active').slice(1)}
                                            </span>
                                        </button>
                                    </td>
                                    {canManage && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-2 rounded-lg text-[#618389] hover:bg-primary/10 hover:text-primary transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member._id)}
                                                    className="p-2 rounded-lg text-[#618389] hover:bg-red-50 hover:text-red-500 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
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

            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={(msg) => {
                        showToast(msg);
                        fetchUsers(pagination.page);
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-white border-l-4 border-primary shadow-xl rounded-lg px-6 py-4 max-w-sm animate-fade-in-up border border-[#dbe4e6]/50">
                    <div className="bg-primary/20 p-2 rounded-full">
                        <span className="material-symbols-outlined text-primary text-sm !fill-1">check</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#111718] leading-none">Success</p>
                        <p className="text-xs text-[#618389] mt-1">{toast}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
