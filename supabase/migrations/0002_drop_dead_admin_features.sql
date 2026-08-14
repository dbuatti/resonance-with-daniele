-- Drop dead feature tables (June availability poll + Growth mission tracker).
-- Their UI pages were removed in the 5-hub admin IA overhaul.
DROP TABLE IF EXISTS public.june_poll_responses;
DROP TABLE IF EXISTS public.growth_mission_steps;

-- Remove the legacy poll configuration note row (keep the admin_notes table).
DELETE FROM public.admin_notes WHERE note_key = 'june_poll_config';
