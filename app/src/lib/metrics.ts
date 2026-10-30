import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";

type Metrics = {
  registry: Registry;
  httpRequestsTotal: Counter<"method" | "route" | "status">;
  httpRequestDuration: Histogram<"method" | "route" | "status">;
  postsCreatedTotal: Counter;
  appInfo: Gauge<"version">;
};

// Same singleton trick as the DB pool: registering a metric twice throws,
// so the registry must survive hot reloads.
const globalForMetrics = globalThis as unknown as { metrics?: Metrics };

function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  // "Info" metric: value is always 1, the useful part is the label.
  // Lets Grafana show which version each pod runs and when that changed.
  const appInfo = new Gauge({
    name: "app_info",
    help: "Running app version (value is always 1)",
    labelNames: ["version"],
    registers: [registry],
  });
  appInfo.set({ version: process.env.APP_VERSION ?? "dev" }, 1);

  return {
    appInfo,
    registry,
    httpRequestsTotal: new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [registry],
    }),
    httpRequestDuration: new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [registry],
    }),
    postsCreatedTotal: new Counter({
      name: "posts_created_total",
      help: "Total posts created",
      registers: [registry],
    }),
  };
}

export const metrics = (globalForMetrics.metrics ??= createMetrics());

// Wraps a route handler to count requests and time them. `route` is the
// path template (not the raw URL) so label cardinality stays small.
export function withMetrics(route: string, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const stopTimer = metrics.httpRequestDuration.startTimer();
    let status = 500;
    try {
      const res = await handler(req);
      status = res.status;
      return res;
    } finally {
      const labels = { method: req.method, route, status: String(status) };
      metrics.httpRequestsTotal.inc(labels);
      stopTimer(labels);
    }
  };
}
