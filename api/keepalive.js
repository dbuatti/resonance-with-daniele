// Vercel Cron heartbeat for the Supabase project.
//
// Supabase pauses Free Plan projects that see no user database activity for 7
// days. This function is one of several independent heartbeats that keep the
// project alive, and it runs entirely on Vercel, so it keeps working even if
// the GitHub Actions workflow is disabled or GitHub is unreachable.
//
// Scheduled via the "crons" entry in vercel.json.
// Vercel emails the account owner if a cron invocation returns a non-2xx
// status, so a broken heartbeat is reported instead of failing silently.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://xefifvztgeiuvzibiltj.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZmlmdnp0Z2VpdXZ6aWJpbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjAyODYsImV4cCI6MjA3NDA5NjI4Nn0.6Rf2x9grV98lueMvS_t2pHCo_TDom3RknEsYzNWWpOU";

const TABLES = ["profiles", "events", "announcements"];

async function ping(path, init) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
  });
  return { path, status: response.status, ok: response.ok };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const checks = [];

    checks.push(
      await ping("/auth/v1/settings", { method: "GET" })
    );

    for (const table of TABLES) {
      checks.push(
        await ping(`/rest/v1/${table}?select=id&limit=1`, { method: "GET" })
      );
    }

    const failed = checks.filter((check) => !check.ok);

    if (failed.length > 0) {
      // Non-2xx makes Vercel report the failed cron run.
      return res.status(502).json({
        ok: false,
        error: "Supabase heartbeat failed",
        checks,
      });
    }

    return res.status(200).json({ ok: true, checks });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
