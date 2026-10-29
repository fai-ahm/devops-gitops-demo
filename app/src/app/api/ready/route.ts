import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { withMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Readiness: "can this pod serve real traffic?" If the DB is unreachable,
// Kubernetes stops sending traffic to the pod (but does not restart it).
export const GET = withMetrics("/api/ready", async () => {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ready" });
  } catch (err) {
    console.error("readiness check failed:", err);
    return NextResponse.json({ status: "not ready" }, { status: 503 });
  }
});
