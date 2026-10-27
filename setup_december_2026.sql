-- ============================================================================
-- DECEMBER '26 — expenses + details
-- ----------------------------------------------------------------------------
-- Event: DECEMBER '26 — Saturday 5 December 2026
-- id:    46e9b466-c961-4f04-baf1-d113fa37246e   (already exists)
--
-- Idempotent: safe to run more than once.
--   * expenses are only inserted when that description is not already present
--   * location / main_song are only filled when currently NULL (never overwrites)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- ============================================================================

-- 1) Fill in the two details that are still blank (no-op if already set).
UPDATE public.events
SET location  = COALESCE(location,  'Armadale Baptist Church'),
    main_song = COALESCE(main_song, 'Somewhere Only We Know (Keane) – SATB, arr. Ed Lojeski (Glee)'),
    updated_at = now()
WHERE id = '46e9b466-c961-4f04-baf1-d113fa37246e';

-- 2) Add the budget lines, skipping any that already exist.
INSERT INTO public.event_expenses (event_id, description, amount, category)
SELECT
  '46e9b466-c961-4f04-baf1-d113fa37246e'::uuid,
  x.description,
  x.amount,
  x.category
FROM (VALUES
  ('Venue hire',     96.00::numeric, 'Venue'),
  ('Sheet music',    42.50::numeric, 'Music'),
  ('Musicnotes PDF',  4.27::numeric, 'Music'),
  ('Booklets',       31.40::numeric, 'Printing'),
  ('Instagram',      30.00::numeric, 'Marketing'),
  ('Refreshments',   20.00::numeric, 'Refreshments')
) AS x(description, amount, category)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_expenses e
  WHERE e.event_id = '46e9b466-c961-4f04-baf1-d113fa37246e'::uuid
    AND e.description = x.description
);

-- 3) Verify.
SELECT description, category, amount
FROM public.event_expenses
WHERE event_id = '46e9b466-c961-4f04-baf1-d113fa37246e'
ORDER BY category, description;

SELECT
  count(*)                       AS line_items,
  sum(amount)                    AS total_cost,
  round(sum(amount) * 1.10, 2)   AS with_10pct_contingency
FROM public.event_expenses
WHERE event_id = '46e9b466-c961-4f04-baf1-d113fa37246e';
