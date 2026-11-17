-- A running shortlist of songs being considered for future sessions.
-- One row per idea; `status` moves it through the pipeline:
--   idea -> considering -> chosen -> performed -> passed
CREATE TABLE IF NOT EXISTS public.repertoire_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repertoire_ideas_status
  ON public.repertoire_ideas (status, created_at DESC);

-- Keep updated_at honest on every update.
CREATE OR REPLACE FUNCTION public.touch_repertoire_ideas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_repertoire_ideas ON public.repertoire_ideas;
CREATE TRIGGER trg_touch_repertoire_ideas
  BEFORE UPDATE ON public.repertoire_ideas
  FOR EACH ROW EXECUTE FUNCTION public.touch_repertoire_ideas();

ALTER TABLE public.repertoire_ideas ENABLE ROW LEVEL SECURITY;

-- Admins only — same rule as repertoire_research.
DROP POLICY IF EXISTS "Admins can manage repertoire ideas" ON public.repertoire_ideas;
CREATE POLICY "Admins can manage repertoire ideas" ON public.repertoire_ideas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed: the first idea, logged 17 Nov 2026.
INSERT INTO public.repertoire_ideas (title, artist, notes, status)
SELECT 'A Million Dreams', 'The Greatest Showman',
       'Potential future session song — cinematic build, big group payoff. Arrangement exists in the library (Kerrie Anne Greenland key).',
       'idea'
WHERE NOT EXISTS (SELECT 1 FROM public.repertoire_ideas WHERE title = 'A Million Dreams');