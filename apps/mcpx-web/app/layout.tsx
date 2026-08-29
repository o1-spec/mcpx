import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MCPx — WebMCP, without the guesswork",
  description:
    "Reliability infrastructure for WebMCP. MCPx runs consequential WebMCP workflows as durable transactions — recovering uncertain writes, reconciling authoritative state, and safely rolling back partial failures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} font-sans h-full antialiased bg-[#070708]`}
    >
      <body className="min-h-full flex flex-col bg-[#070708] text-[#F5F5F3]">
        {children}
      </body>
    </html>
  );
}
