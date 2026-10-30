import { NextResponse } from "next/server";
import { withMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which build is this pod running? CI sets APP_VERSION to the short commit SHA.
export const GET = withMetrics("/api/version", async () => {
  return NextResponse.json({ version: process.env.APP_VERSION ?? "dev" });
});
