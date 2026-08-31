import "./globals.css";
import "@/lib/webmcp-bridge";

export const metadata = {
  title: "Example External Service",
  description: "WebMCP External Service Test Fixture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
