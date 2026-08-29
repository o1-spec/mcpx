"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("Acme Labs");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F3] font-sans selection:bg-[#A5F36B] selection:text-[#070708] flex flex-col justify-between relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-35">
        <div className="w-full h-full max-w-[1320px] mx-auto border-x border-white/[0.045] grid grid-cols-4 md:grid-cols-8 divide-x divide-white/[0.035]" />
      </div>

      {/* Top Navbar */}
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
          href="/signin"
          className="text-[12.5px] font-mono text-[#A0A0A4] hover:text-[#F5F5F3] transition-colors"
        >
          Sign in →
        </Link>
      </header>

      {/* Main Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] border border-white/[0.09] bg-[#0B0C0E] p-7 sm:p-8 space-y-6 shadow-2xl rounded-sm">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[#A5F36B] uppercase tracking-wider bg-emerald-950/40 border border-[#A5F36B]/20 px-2 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-[#A5F36B] animate-pulse"></span>
              <span>GET STARTED</span>
            </div>
            <h1 className="text-[20px] font-bold text-[#F5F5F3] tracking-tight font-sans pt-1">
              Create your workspace
            </h1>
            <p className="text-[12.5px] text-[#A0A0A4]">
              Initialize a dedicated WebMCP reliability environment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="ws-name"
                className="text-[11.5px] font-mono text-[#66686D] uppercase block"
              >
                Workspace Name
              </label>
              <input
                id="ws-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-[11.5px] font-mono text-[#66686D] uppercase block"
              >
                Developer Email
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="developer@acme.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#070708] border border-white/[0.09] text-[13px] font-sans text-[#F5F5F3] placeholder-[#66686D] focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-[#F5F5F3] text-[#070708] hover:bg-white font-semibold text-[13px] font-sans transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Provisioning workspace…</span>
              ) : (
                <span>Create Workspace & Continue →</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[12px] font-sans text-[#66686D]">
            Already have a workspace?{" "}
            <Link
              href="/signin"
              className="text-[#F5F5F3] hover:text-[#A5F36B] transition-colors font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-6 text-center text-[11px] font-mono text-[#66686D]">
        <span>MCPx TRANSACTION RUNTIME</span>
      </footer>
    </div>
  );
}
