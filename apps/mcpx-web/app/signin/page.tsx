"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate instant local developer auth session & proceed to /app
    setTimeout(() => {
      setLoading(false);
      router.push("/app");
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans selection:bg-[#A5F36B] selection:text-[#070708] flex flex-col justify-between relative overflow-hidden">
      {/* Background Engineering Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-35">
        <div className="w-full h-full max-w-[1320px] mx-auto border-x border-white/[0.045] grid grid-cols-4 md:grid-cols-8 divide-x divide-white/[0.035]" />
      </div>

      {/* Top Navbar Minimal */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-[1320px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4 items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#A5F36B] group-hover:scale-110 transition-transform"></span>
            <span className="w-1.5 h-1.5 bg-white/90"></span>
            <span className="w-1.5 h-1.5 bg-white/35"></span>
            <span className="w-1.5 h-1.5 bg-white/80"></span>
          </div>
          <span className="font-bold text-[16px] tracking-tight text-[#F5F5F3]">
            MCPx
          </span>
        </Link>

        <Link
          href="/"
          className="text-[12.5px] font-mono text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors"
        >
          ← Back to Homepage
        </Link>
      </header>

      {/* Main Centered Auth Panel */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[390px] border border-white/[0.09] bg-[#0B0C0E] p-7 sm:p-8 space-y-6 shadow-2xl rounded-sm">
          {/* Card Header */}
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[#A5F36B] uppercase tracking-wider bg-emerald-950/40 border border-[#A5F36B]/20 px-2 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-[#A5F36B] animate-pulse"></span>
              <span>CONTROL PLANE ACCESS</span>
            </div>
            <h1 className="text-[20px] font-bold text-[#F5F5F3] tracking-tight font-sans pt-1">
              Sign in to MCPx
            </h1>
            <p className="text-[12.5px] text-[#A0A0A4]">
              Manage WebMCP services, contracts, and durable workflows.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 font-mono text-[11.5px] rounded">
              ✕ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11.5px] font-mono text-[#66686D] uppercase block"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="developer@acme.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30 transition-colors"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11.5px] font-mono text-[#66686D] uppercase block"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Local dev mode active. Enter any password to continue.");
                  }}
                  className="text-[11px] font-mono text-[#A0A0A4] hover:text-[#F5F5F3]"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30 transition-colors"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13px] font-sans transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Continue to Control Plane →</span>
              )}
            </button>
          </form>

          {/* Social SSO Quick Option */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/[0.06] w-full" />
              <span className="bg-[#0B0C0E] px-2 text-[10.5px] font-mono text-[#66686D] uppercase absolute">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setTimeout(() => router.push("/app"), 300);
              }}
              className="w-full py-2 px-4 rounded bg-[#070708] border border-white/[0.09] text-[#F5F5F3] hover:bg-white/[0.03] font-mono text-[12px] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Footer link */}
          <div className="pt-2 text-center text-[12px] font-sans text-[#66686D]">
            New to MCPx?{" "}
            <Link
              href="/signup"
              className="text-[#F5F5F3] hover:text-[#A5F36B] transition-colors font-medium underline underline-offset-4"
            >
              Create a workspace
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-[11px] font-mono text-[#66686D]">
        <span>MCPx TRANSACTION RUNTIME · SECURED WITH WEBMCP</span>
      </footer>
    </div>
  );
}
