import { Pool } from "pg";

// Keep one Pool per process. Storing it on globalThis stops Next.js dev hot reload
// from creating a new pool (and leaking connections) every time this module is re-evaluated.
const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  schemaReady?: Promise<void>;
};

export const pool =
  globalForDb.pgPool ??
  new Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "postgres",
    max: 5,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
  });

globalForDb.pgPool = pool;

// Create the table once per process. If it fails (DB not up yet), forget the
// promise so the next request retries instead of failing forever.
export function ensureSchema(): Promise<void> {
  globalForDb.schemaReady ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS posts (
         id         SERIAL PRIMARY KEY,
         author     TEXT        NOT NULL,
         content    TEXT        NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    )
    .then(() => undefined)
    .catch((err) => {
      globalForDb.schemaReady = undefined;
      throw err;
    });
  return globalForDb.schemaReady;
}

export type Post = {
  id: number;
  author: string;
  content: string;
  created_at: string;
};
