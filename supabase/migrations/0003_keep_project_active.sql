-- Keep the Supabase project from being auto-paused.
--
-- Supabase pauses Free Plan projects that show no *user* database activity for
-- 7 days. The primary heartbeat for this project is the external API ping in
-- .github/workflows/keep-supabase-alive.yml (and a Vercel cron as a second
-- external heartbeat).
--
-- This migration adds a third, self-contained signal that lives inside the
-- project itself, so the project keeps ticking even if every external
-- heartbeat is broken. It is cheap insurance, not the primary mechanism:
-- Supabase's inactivity check is documented in terms of *user* queries, so an
-- internal cron worker may not count on its own.
--
-- Apply with:  supabase db push
--          or: paste into the Supabase dashboard SQL editor.
--
-- Verify with:
--   select * from public.keepalive_heartbeat;
--   select * from cron.job_run_details where jobname = 'keep-project-active';

do $$
begin
    -- pg_cron is what makes the job run. If it is unavailable for any reason,
    -- skip the whole block rather than failing the migration.
    begin
        create extension if not exists pg_cron;
    exception when others then
        raise notice 'Could not enable pg_cron (%); skipping keepalive job.', sqlerrm;
        return;
    end;

    -- A single-row table recording the last heartbeat. RLS is enabled with no
    -- policies, so the public Data API can neither read nor write it; only the
    -- database owner (and the cron job) can.
    create table if not exists public.keepalive_heartbeat (
        id           boolean primary key default true check (id),
        last_ping_at timestamptz not null default now()
    );

    alter table public.keepalive_heartbeat enable row level security;

    comment on table public.keepalive_heartbeat is
        'Last successful internal keepalive ping. RLS enabled with no policies (not reachable via the public API).';

    -- Idempotently (re)schedule the daily job.
    for existing in select jobid from cron.job where jobname = 'keep-project-active' loop
        perform cron.unschedule(existing.jobid);
    end loop;

    perform cron.schedule(
        'keep-project-active',
        '23 4 * * *',  -- daily at 04:23 UTC
        $cron$
            insert into public.keepalive_heartbeat (id, last_ping_at)
            values (true, now())
            on conflict (id) do update set last_ping_at = excluded.last_ping_at
        $cron$
    );

    -- Record an immediate ping so there is a heartbeat on the very first run.
    insert into public.keepalive_heartbeat (id, last_ping_at)
    values (true, now())
    on conflict (id) do update set last_ping_at = excluded.last_ping_at;

    raise notice 'Keepalive job scheduled: keep-project-active (daily 04:23 UTC)';
end $$;
