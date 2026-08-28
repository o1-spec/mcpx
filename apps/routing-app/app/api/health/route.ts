import { NextResponse } from "next/server";
import { routeStore } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "routing-app",
    role: "Routing Gateway",
    activeRoutes: routeStore.size,
    timestamp: new Date().toISOString(),
  });
}
