"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("divya:loggedIn") === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const resolvePostAuthRoute = async (userEmail: string) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("divya:token") : null;
    const headers: Record<string, string> = token
      ? { "Authorization": `Bearer ${token}` }
      : { "x-user-email": userEmail };
    const res = await fetch("/api/user", {
      cache: "no-store",
      headers,
    });
    const data = await res.json();
    if (!res.ok || !data?.success || !data?.user?.birthDetails) {
      router.push("/onboarding");
      return;
    }
    router.push("/dashboard");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || (mode === "signup" && !name.trim())) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const sr = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
        });
        const sd = await sr.json();
        if (!sr.ok || !sd.success) { setError(sd.error || "Could not create account."); return; }
        // Signup returns a token — store it and skip the separate login call
        window.localStorage.setItem("divya:loggedIn", "true");
        window.localStorage.setItem("divya:userEmail", cleanEmail);
        if (sd.token) window.localStorage.setItem("divya:token", sd.token);
        await resolvePostAuthRoute(cleanEmail);
        return;
      }
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) { setError(d.error || "Invalid email or password."); return; }
      window.localStorage.setItem("divya:loggedIn", "true");
      window.localStorage.setItem("divya:userEmail", cleanEmail);
      if (d.token) window.localStorage.setItem("divya:token", d.token);
      await resolvePostAuthRoute(cleanEmail);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-200/20 rounded-full blur-[60px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200 mx-auto mb-4">
            <span className="text-white text-2xl font-bold">ॐ</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-amber-900">DivyaDrishti</h1>
          <p className="text-sm text-amber-700/50 mt-1">Your personal Vedic astrology guide</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#F1E7D0] rounded-3xl shadow-sm p-8">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 bg-amber-50 border border-amber-100 rounded-xl p-1 mb-8">
            {(["signin", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? "bg-white text-amber-900 shadow-sm border border-amber-100" : "text-amber-600/60 hover:text-amber-800"}`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full rounded-xl border border-[#F1E7D0] bg-amber-50/30 px-4 py-3 text-sm text-amber-900 placeholder-amber-300 outline-none focus:border-amber-400 focus:bg-white transition-all"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#F1E7D0] bg-amber-50/30 px-4 py-3 text-sm text-amber-900 placeholder-amber-300 outline-none focus:border-amber-400 focus:bg-white transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-[#F1E7D0] bg-amber-50/30 px-4 py-3 pr-12 text-sm text-amber-900 placeholder-amber-300 outline-none focus:border-amber-400 focus:bg-white transition-all"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm shadow-amber-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{mode === "signup" ? "Creating Account..." : "Signing In..."}</>
              ) : (
                mode === "signup" ? "Create Account & Begin" : "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-amber-700/30 mt-6">
          Vedic wisdom, modern intelligence.
        </p>
      </motion.div>
    </div>
  );
}
