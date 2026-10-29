import Feed from "./feed";

// Render on every request so APP_VERSION is read at runtime (from the container env),
// not frozen into the HTML at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  const version = process.env.APP_VERSION ?? "dev";

  return (
    <main className="container">
      <header className="header">
        <h1>Demo Feed</h1>
        <span className="version" title="Running app version">
          v: {version}
        </span>
      </header>
      <p className="signed-in">
        Signed in as <strong>demo-user</strong>
      </p>
      <Feed />
    </main>
  );
}
