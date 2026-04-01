-- 1. Enable the pg_net extension (allows Postgres to make HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the trigger function
-- This function sends the user data to your Edge Function
CREATE OR REPLACE FUNCTION public.sync_profile_to_kit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-kit-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$;

-- 3. Create the trigger on the profiles table
-- Fires automatically after a new row is added or an existing one is updated
DROP TRIGGER IF EXISTS on_profile_change_sync_kit ON public.profiles;
CREATE TRIGGER on_profile_change_sync_kit
  AFTER INSERT OR UPDATE
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_kit();