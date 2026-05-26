-- Create the public poll responses table
CREATE TABLE IF NOT EXISTS public.june_poll_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_name TEXT NOT NULL,
  selected_options TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant API access to all roles (including anonymous public users)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.june_poll_responses TO service_role;
GRANT SELECT, INSERT ON TABLE public.june_poll_responses TO authenticated;
GRANT SELECT, INSERT ON TABLE public.june_poll_responses TO anon;

-- Enable Row Level Security
ALTER TABLE public.june_poll_responses ENABLE ROW LEVEL SECURITY;

-- Create public policies
CREATE POLICY "Allow public inserts" ON public.june_poll_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.june_poll_responses
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to delete" ON public.june_poll_responses
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );