import { NextResponse } from "next/server";
import { widgetStore, publicationStore } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "example-external-service",
    role: "External 5th WebMCP Service Provider",
    activeWidgets: widgetStore.size,
    activePublications: publicationStore.size,
    timestamp: new Date().toISOString(),
  });
}
