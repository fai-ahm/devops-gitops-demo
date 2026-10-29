import { NextResponse } from "next/server";
import { ensureSchema, pool, type Post } from "@/lib/db";
import { metrics, withMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LENGTH = 500;

export const GET = withMetrics("/api/posts", async () => {
  try {
    await ensureSchema();
    const { rows } = await pool.query<Post>(
      "SELECT id, author, content, created_at FROM posts ORDER BY created_at DESC, id DESC LIMIT 50"
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
});

export const POST = withMetrics("/api/posts", async (req) => {
  let content: unknown;
  try {
    ({ content } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > MAX_LENGTH) {
    return NextResponse.json({ error: `content must be at most ${MAX_LENGTH} characters` }, { status: 400 });
  }

  try {
    await ensureSchema();
    const { rows } = await pool.query<Post>(
      "INSERT INTO posts (author, content) VALUES ($1, $2) RETURNING id, author, content, created_at",
      ["demo-user", content.trim()]
    );
    metrics.postsCreatedTotal.inc();
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/posts failed:", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
});
