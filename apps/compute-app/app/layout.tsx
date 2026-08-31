import type { Metadata } from "next";
import "./globals.css";
import "@/lib/webmcp-bridge";

export const metadata: Metadata = {
  title: "Compute Service",
  description: "MCPx Backend Compute Service - Port 3003",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
