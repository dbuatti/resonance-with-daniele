-- ============================================================================
-- Paste into Supabase SQL Editor and Run.
-- Creates the daily in-project heartbeat (pg_cron) and its tracking table.
-- Safe to re-run: it unschedules any previous copy of the job first.
-- ============================================================================
do $$
declare
    existing_jobid bigint;
begin
    begin
        create extension if not exists pg_cron with schema extensions;
    exception when others then
        begin
            create extension if not exists pg_cron;
        exception when others then
            raise notice 'Could not enable pg_cron (%); skipping keepalive job.', sqlerrm;
            return;
        end;
    end;

    create table if not exists public.keepalive_heartbeat (
        id           boolean primary key default true check (id),
        last_ping_at timestamptz not null default now()
    );

    alter table public.keepalive_heartbeat enable row level security;

    comment on table public.keepalive_heartbeat is
        'Last successful internal keepalive ping. RLS enabled with no policies (not reachable via the public API).';

    for existing_jobid in select jobid from cron.job where jobname = 'keep-project-active' loop
        perform cron.unschedule(existing_jobid);
    end loop;

    perform cron.schedule(
        'keep-project-active',
        '23 4 * * *',
        $cron$
            insert into public.keepalive_heartbeat (id, last_ping_at)
            values (true, now())
            on conflict (id) do update set last_ping_at = excluded.last_ping_at
        $cron$
    );

    insert into public.keepalive_heartbeat (id, last_ping_at)
    values (true, now())
    on conflict (id) do update set last_ping_at = excluded.last_ping_at;

    raise notice 'Keepalive job scheduled: keep-project-active (daily 04:23 UTC)';
end $$;
