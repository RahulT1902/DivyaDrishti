"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("divya:loggedIn") === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const resolvePostAuthRoute = async (userEmail: string) => {
    const res = await fetch("/api/user", {
      cache: "no-store",
      headers: { "x-user-email": userEmail },
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
        const signUpRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
          }),
        });

        const signUpData = await signUpRes.json();
        if (!signUpRes.ok || !signUpData.success) {
          setError(signUpData.error || "Could not create account.");
          return;
        }
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.success) {
        setError(loginData.error || "Invalid email or password.");
        return;
      }

      window.localStorage.setItem("divya:loggedIn", "true");
      window.localStorage.setItem("divya:userEmail", cleanEmail);
      await resolvePostAuthRoute(cleanEmail);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">DivyaDrishti</h1>
        <p className="text-sm text-slate-600 mt-1">Create an account or sign in to continue.</p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {loading
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
