import { NextResponse } from "next/server";
import { frontendStore } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "frontend-app",
    role: "Frontend Host & Previews",
    activeFrontends: frontendStore.size,
    timestamp: new Date().toISOString(),
  });
}
