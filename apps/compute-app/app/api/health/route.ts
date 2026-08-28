import { NextResponse } from "next/server";
import { backendStore } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "compute-app",
    role: "Compute Runtime",
    activeBackends: backendStore.size,
    timestamp: new Date().toISOString(),
  });
}
