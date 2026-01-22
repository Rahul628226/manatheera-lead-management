"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import LoadingSplash from "@/components/ui/LoadingSplash";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token for 7 days (simplified)
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        // Show the premium splash
        setShowSplash(true);

        // Wait for the fill animation to finish (matching the 2.5s CSS animation)
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
        setLoading(false);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check if backend is running.");
      setLoading(false);
    }
  };

  if (showSplash) return <LoadingSplash />;

  return (
    <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background">
      {/* Left Section: Visual Branding */}
      <div
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/event.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 h-full w-full">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 overflow-hidden">
              <img src="/favicon.jpg" alt="Logo" className="size-8 object-cover" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Manatheera</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-white text-4xl font-extrabold leading-tight mb-4">
              Elegant events, flawlessly coordinated.
            </h2>
            <p className="text-white/80 text-lg">
              Plan, organize, and execute every celebration with precision our all-in-one admin suite streamlines vendor coordination, guest invitations, and on-site logistics.
            </p>
          </div>

          <div className="text-white/60 text-sm">
            © 2026 Manatheera Management Group
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          {/* Welcome Header */}
          <div className="flex flex-col gap-2">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 overflow-hidden">
                <img src="/favicon.jpg" alt="Logo" className="size-8 object-cover" />
              </div>
              <span className="text-black text-xl font-bold">Manatheera</span>
            </div>
            <h1 className="text-black text-3xl font-black leading-tight tracking-[-0.033em] lg:text-4xl">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-base font-normal">
              Enter your credentials to manage resort leads.
            </p>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <Input
              label="Email or Username"
              name="email"
              placeholder="Enter your email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              type={showPassword ? "text" : "password"}
              icon={
                <span
                  className="material-symbols-outlined select-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              }
            />

            <div className="flex items-center justify-between py-1">
              <Checkbox label="Remember Me" />
              <a href="#" className="text-primary text-sm font-bold hover:underline">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className="mt-4 h-14 bg-primary text-white disabled:opacity-70 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#111718]/30 border-t-[#111718] rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : "Sign In"}
            </Button>
          </form>

          {/* Footer Support Note */}
          <div className="flex flex-col items-center gap-4 mt-4">
            <p className="text-slate-500 text-sm font-normal">
              Need help? <a href="#" className="text-primary font-bold hover:underline">Contact Admin</a>
            </p>
            <div className="w-full flex items-center gap-4 text-border">
              <div className="h-[1px] flex-1 bg-current"></div>
              <span className="text-xs uppercase tracking-widest font-bold">Secure Access</span>
              <div className="h-[1px] flex-1 bg-current"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
