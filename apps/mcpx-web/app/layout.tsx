import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MCPx — WebMCP, without the guesswork",
  description:
    "Reliability infrastructure for WebMCP. MCPx makes multi-step browser actions durable, recoverable, and safe to roll back.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} font-sans h-full antialiased bg-[#050607]`}
    >
      <body className="min-h-full flex flex-col bg-[#050607] text-[#F4F4F2]">
        {children}
      </body>
    </html>
  );
}
