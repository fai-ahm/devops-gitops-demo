import { NextResponse } from "next/server";
import { withMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness: "is the process alive?" Deliberately does NOT touch the DB.
// If it did, a DB outage would make Kubernetes restart every app pod for nothing.
export const GET = withMetrics("/api/health", async () => {
  return NextResponse.json({ status: "ok" });
});
