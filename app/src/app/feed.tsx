"use client";

import { useCallback, useEffect, useState } from "react";
import type { Post } from "@/lib/db";

const REFRESH_MS = 5000;

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State is only set in the promise callbacks (when the response arrives),
  // never synchronously inside the effect that calls this.
  const loadPosts = useCallback(
    () =>
      fetchPosts().then(
        (data) => {
          setPosts(data);
          setError(null);
        },
        () => setError("Could not load posts")
      ),
    []
  );

  useEffect(() => {
    loadPosts();
    const id = setInterval(loadPosts, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadPosts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setContent("");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="composer" onSubmit={submit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          maxLength={500}
          rows={3}
        />
        <button type="submit" disabled={submitting || !content.trim()}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="feed">
        {posts.length === 0 && !error && <li className="empty">No posts yet.</li>}
        {posts.map((post) => (
          <li key={post.id} className="post">
            <div className="post-meta">
              <strong>{post.author}</strong>
              <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
            </div>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
