import { metrics, withMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withMetrics("/api/metrics", async () => {
  const body = await metrics.registry.metrics();
  return new Response(body, {
    headers: { "Content-Type": metrics.registry.contentType },
  });
});
