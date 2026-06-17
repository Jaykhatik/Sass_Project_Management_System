"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, UserRound, Loader2 } from "lucide-react";
import { register } from "@/services/authService";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isInvite = nextUrl?.includes('/invite/');
      const data = await register({ name, email, password, isInvite });
      
      let redirectUrl = data.redirectTo || `/login?email=${encodeURIComponent(email)}`;
      if (nextUrl) {
        redirectUrl += redirectUrl.includes('?') ? `&next=${encodeURIComponent(nextUrl)}` : `?next=${encodeURIComponent(nextUrl)}`;
      }
      
      router.push(redirectUrl);
      // Removed router.refresh() because login needs no refresh if it's just client navigation.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.16)]">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-600">
            Sign up
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Start your workspace and get going in one step.
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
              <UserRound className="h-4 w-4 text-slate-400" />
              Full name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              placeholder="Jane Smith"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              placeholder="Minimum 8 characters"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Signing up creates your first workspace automatically. No welcome project is added.
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[0.95fr_1.05fr] bg-[#f8fafc]">
      <div className="hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_28%)]" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Start with a workspace that is ready on day one
          </div>
          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">
            Create your workspace in seconds.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
            Signup creates your first workspace so you can add your own projects
            and boards from a clean start.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4 text-sm text-white/75">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Auto onboarding</p>
            <p className="mt-1">New accounts get a workspace right away.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Clean UI</p>
            <p className="mt-1">Signup stays simple and professional.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          }>
            <SignupForm />
          </Suspense>
        </div>
    </div>
  );
}
