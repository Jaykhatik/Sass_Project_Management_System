"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Loader2, Hexagon } from "lucide-react";
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
    <div className="w-full max-w-[420px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <Hexagon className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Sign in to continue to your workspace
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!emailParam}
                    className={`w-full rounded-2xl border px-4 py-3 sm:py-3.5 pl-11 text-sm outline-none transition bg-white/5 text-white placeholder-slate-500 ${
                      emailParam
                        ? "border-white/10 opacity-60 cursor-not-allowed"
                        : "border-white/10 focus:border-indigo-500 focus:bg-white/10 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:py-3.5 pl-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-white/10 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-4 py-3 sm:py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_20px_rgba(99,102,241,0.4)] mt-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in to Dashboard"}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="mt-6 sm:mt-8 text-center text-sm text-slate-400">
              No account yet?{" "}
              <Link href={nextUrl !== "/dashboard" ? `/signup?next=${encodeURIComponent(nextUrl)}` : "/signup"} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Create one
              </Link>
            </p>

          </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2 bg-[#0a0a0a] overflow-hidden">
      {/* Left Section - Hidden on mobile/tablet */}
      <div className="hidden lg:flex relative flex-col items-center justify-center border-r border-white/10 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.15),_transparent_40%)]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDuration: "5s" }} />
        
        <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
          <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)] mb-8 backdrop-blur-xl">
            <Hexagon className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Manage your workspace.
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            The platform that helps your team move faster, stay aligned, and ship better projects.
          </p>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="relative flex items-center justify-center p-4 sm:p-8 min-h-screen lg:min-h-0">
        {/* Animated Background Graphics for Mobile */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse lg:hidden" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-sky-600/20 blur-[100px] animate-pulse lg:hidden" style={{ animationDelay: "2s", animationDuration: "4s" }} />

        <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 flex justify-center">
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
