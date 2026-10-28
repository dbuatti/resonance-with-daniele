// Vercel Serverless Function: /api/next
// Finds the next upcoming event (Australia/Melbourne) and redirects to its
// Humanitix link. Falls back to a simple info page if none exists.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://xefifvztgeiuvzibiltj.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZmlmdnp0Z2VpdXZ6aWJpbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjAyODYsImV4cCI6MjA3NDA5NjI4Nn0.6Rf2x9grV98lueMvS_t2pHCo_TDom3RknEsYzNWWpOU";

function getMelbourneToday() {
  // Format date in Australia/Melbourne as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function renderNoSessionPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>No session booked yet — Resonance</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background: #f8f9fa; color: #1a1a1a; margin: 0; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 480px; text-align: center; background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    h1 { font-size: 1.8rem; margin-bottom: 1rem; color: #2d2d2d; }
    p { font-size: 1.1rem; line-height: 1.6; color: #4a4a4a; margin-bottom: 2rem; }
    .links { display: flex; flex-direction: column; gap: 1rem; }
    .link { display: inline-block; padding: 0.75rem 1.5rem; background: #0077ff; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s; }
    .link:hover { background: #005fcc; }
    .link.facebook { background: #1877f2; }
    .link.facebook:hover { background: #166fe5; }
    .link.whatsapp { background: #25d366; }
    .link.whatsapp:hover { background: #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <h1>No session booked yet</h1>
    <p>Join the Facebook group or WhatsApp to hear about the next one</p>
    <div class="links">
      <a href="https://www.facebook.com/share/g/172Pdo3b1n/" class="link facebook" target="_blank" rel="noopener noreferrer">Join Facebook Group</a>
      <a href="https://chat.whatsapp.com/Hbwgn2BHHTG3m8mkPVkgxQ" class="link whatsapp" target="_blank" rel="noopener noreferrer">Join WhatsApp Group</a>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(405).send(renderNoSessionPage());
  }

  try {
    const todayMelbourne = getMelbourneToday();

    // Find earliest upcoming event (date >= today in Melbourne)
    const queryParams = new URLSearchParams({
      select: "id,title,date,humanitix_link",
      date: `gte.${todayMelbourne}`,
      order: "date.asc",
      limit: "1",
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(renderNoSessionPage());
    }

    const events = await response.json();
    const nextEvent = events && events[0];

    if (nextEvent && nextEvent.humanitix_link && nextEvent.humanitix_link.trim()) {
      // Temporary redirect (302) - not cached permanently
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      return res.status(302).redirect(nextEvent.humanitix_link);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).send(renderNoSessionPage());
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    return res.status(200).send(renderNoSessionPage());
  }
}
