"use client";

import { useState, useEffect } from "react";

export default function UserModal({ user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                email: user.email || "",
                phone: user.phone || "",
                role: user.role || "",
                username: user.username || "",
                password: "", // Don't populate password
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const url = user ? `/api/users/${user._id}` : "/api/users";
        const method = user ? "PATCH" : "POST";

        // If updating and password is empty, remove it from payload
        const payload = { ...formData };
        if (user && !payload.password) {
            delete payload.password;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess(user ? "User updated successfully" : "User created successfully");
                onClose();
            } else {
                setError(data.message || "Failed to save user");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Modal Overlay Backend */}
            <div
                className="absolute inset-0 bg-[#101f22]/50 backdrop-blur-[4px]"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative z-[101] w-full max-w-[560px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
                {/* Header Section */}
                <div className="flex items-center justify-between p-6 border-b border-[#dbe4e6]">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#111718] text-2xl font-bold leading-tight">
                            {user ? "Edit Staff Member" : "Create New Staff Member"}
                        </h1>
                        <p className="text-[#618389] text-sm font-normal">
                            {user ? "Update staff information and permissions." : "Add a new team member to your resort management system."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#618389] hover:text-[#111718] transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">Full Name</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal transition-all"
                                placeholder="e.g. Jonathan Smith"
                                type="text"
                                required
                            />
                        </div>

                        {/* Username Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">Username</label>
                            <input
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal transition-all"
                                placeholder="jsmith"
                                type="text"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">Work Email Address</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal transition-all"
                                placeholder="email@resort.com"
                                type="email"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">Phone Number</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal transition-all"
                                placeholder="+1 (555) 000-0000"
                                type="tel"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Role Dropdown */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">Assign Role</label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="appearance-none form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal cursor-pointer transition-all"
                                    required
                                >
                                    <option value="" disabled>Select a role</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#618389]">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111718] text-sm font-semibold">
                                {user ? "New Password (Leave blank to keep current)" : "Set Password"}
                            </label>
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#111718] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe4e6] bg-white h-12 px-4 text-sm font-normal transition-all"
                                placeholder="••••••••"
                                type="password"
                                required={!user}
                            />
                        </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-start gap-4 mt-2">
                        <span className="material-symbols-outlined text-primary">security</span>
                        <div className="flex flex-col gap-1">
                            <p className="text-[#111718] text-sm font-semibold">Account Security</p>
                            <p className="text-[#618389] text-xs">Ensure passwords are strong. Assigned roles define the specific permissions and access levels for this staff member.</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 h-12 rounded-lg text-[#111718] text-sm font-bold hover:bg-gray-100 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 h-12 rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : (user ? "Update Staff Member" : "Create Staff Member")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
