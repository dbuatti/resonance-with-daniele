# Keeping the Supabase project alive

Supabase pauses Free Plan projects that see no **user database activity** for
7 days. This project (`xefifvztgeiuvzibiltj`) is on the Free Plan, so it
needs a steady trickle of API requests.

This repo keeps three independent heartbeats running. If one dies, the others
still hold the project open.

## The heartbeats

| # | Mechanism | Where it runs | Schedule |
| --- | --- | --- | --- |
| 1 | GitHub Actions workflow | `.github/workflows/keep-supabase-alive.yml` | Daily, 06:17 UTC |
| 2 | Vercel cron | `api/keepalive.js` + `crons` in `vercel.json` | Daily, 07:00 UTC |
| 3 | pg_cron job | `supabase/migrations/0003_keep_project_active.sql` | Daily, 04:23 UTC |

Heartbeats 1 and 2 are the ones that count: they make real API requests
against the project, which is exactly what Supabase's inactivity check
measures. Heartbeat 3 is insurance for the case where every external caller
breaks.

## Why heartbeat 1 has a commit step

GitHub automatically **disables scheduled workflows after 60 days of
repository inactivity**, and workflow runs do not count as repository
activity. That is exactly what happened on 2026-10-16: the last commit was
2026-08-14, GitHub disabled the schedule, the pings silently stopped, and the
project drifted towards a 7-day pause with no warning.

The `heartbeat` job in the workflow therefore commits a timestamp to
`.keepalive/last-ping` whenever the repository has had no commit for 20 days.
That keeps the repository permanently active, so GitHub can never
auto-disable the schedule again. Normal development commits suppress the
heartbeat commit, so it only fires when the project is genuinely idle.

## Monitoring

- GitHub emails the repository owner when the workflow fails.
- Vercel emails the account owner when a cron invocation returns a non-2xx
  status.
- A dead man's switch is still worth adding (for example healthchecks.io
  pointed at `https://resonance-with-daniele.vercel.app/api/keepalive`) so a
  *complete* outage of all three heartbeats raises an alert rather than
  failing silently.

## Verifying

```bash
# Any of these should report HTTP 200 with ok: true
curl -s https://resonance-with-daniele.vercel.app/api/keepalive

# See when the internal pg_cron heartbeat last ran
# (Supabase dashboard -> SQL editor)
select * from public.keepalive_heartbeat;
```

## The real fix

Heartbeats only reduce the risk. Upgrading the project to the **Pro plan**
($10/month base + usage) is the only thing that guarantees the project will
never be paused for inactivity.
