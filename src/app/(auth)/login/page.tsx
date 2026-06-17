"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Loader2 } from "lucide-react";
import { login } from "@/services/authService";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22)] backdrop-blur">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">
                Sign in
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your account to continue managing your workspace.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!emailParam}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ring-0 transition ${
                    emailParam
                      ? "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                      : "border-slate-200 bg-white focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                  }`}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                  placeholder="••••••••"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              No account yet?{" "}
              <Link href={nextUrl !== "/dashboard" ? `/signup?next=${encodeURIComponent(nextUrl)}` : "/signup"} className="font-medium text-indigo-600 hover:text-indigo-700">
                Create one
              </Link>
            </p>

          </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] bg-[#09111f] text-white">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/10 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),_transparent_30%)]" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Workspace management that feels crisp and fast
          </div>
          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">
            Ship projects with less friction.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
            Keep workspaces, projects, boards, and teams in one clean flow.
            Sign in to continue your account.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4 text-sm text-white/75">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Workspace ready</p>
            <p className="mt-1">Members, settings, and projects stay connected.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Fast auth flow</p>
            <p className="mt-1">Login lands you directly in the dashboard.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
