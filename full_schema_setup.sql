-- RESONANCE WITH DANIELE - FULL SCHEMA SETUP
-- This script sets up all tables, functions, triggers, and RLS policies.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO is_admin_status FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(is_admin_status, FALSE);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, is_admin, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email IN ('daniele.buatti@gmail.com', 'resonancewithdaniele@gmail.com'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_song_suggestion_total_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.song_suggestions
    SET total_votes = total_votes + 1
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.song_suggestions
    SET total_votes = total_votes - 1
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 3. TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  how_heard TEXT,
  motivation TEXT[],
  attended_session BOOLEAN,
  singing_experience TEXT,
  session_frequency TEXT,
  preferred_time TEXT,
  music_genres TEXT[],
  choir_goals TEXT,
  inclusivity_importance TEXT,
  suggestions TEXT,
  voice_type TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  description TEXT,
  humanitix_link TEXT,
  ai_chat_link TEXT,
  main_song TEXT,
  lesson_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources & Folders
CREATE TABLE IF NOT EXISTS public.resource_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.resource_folders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_nominated_for_dashboard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.resource_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  youtube_url TEXT,
  type TEXT NOT NULL DEFAULT 'url',
  is_published BOOLEAN NOT NULL DEFAULT true,
  voice_part TEXT,
  original_filename TEXT,
  file_size BIGINT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Features
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.song_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  reason TEXT,
  total_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_song_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.song_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, suggestion_id)
);

-- Feedback & Reports
CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  overall_feeling TEXT,
  overall_feeling_other TEXT,
  enjoyed_most TEXT,
  improvements TEXT,
  time_slot_rating TEXT,
  future_repertoire TEXT,
  price_point TEXT,
  interest_next_month TEXT[],
  best_times_ongoing TEXT[],
  regular_attendance_interest TEXT,
  attendance_frequency TEXT,
  recommend_score INTEGER,
  how_heard TEXT,
  additional_comments TEXT,
  venue_feedback TEXT,
  repertoire_feedback TEXT,
  future_ideas TEXT,
  is_first_time BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  page_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing & Finance
CREATE TABLE IF NOT EXISTS public.event_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_orders (
  order_id TEXT PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  mobile TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  valid_tickets INTEGER DEFAULT 0,
  ticket_sales NUMERIC DEFAULT 0,
  your_earnings NUMERIC DEFAULT 0,
  discount_code TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  energy TEXT,
  has_action BOOLEAN DEFAULT false,
  action_type TEXT,
  days_before INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_task_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES public.marketing_tasks(task_key) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(admin_id, task_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.outreach_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_messaged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS ENABLEMENT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_song_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_targets ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id) OR is_user_admin(auth.uid()));
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id) OR is_user_admin(auth.uid()));

CREATE POLICY "events_read_policy" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_admin_policy" ON public.events FOR ALL TO authenticated USING (is_user_admin(auth.uid()));

CREATE POLICY "resources_read_policy" ON public.resources FOR SELECT USING (is_published OR is_user_admin(auth.uid()));
CREATE POLICY "resources_admin_policy" ON public.resources FOR ALL TO authenticated USING (is_user_admin(auth.uid()));

CREATE POLICY "folders_read_policy" ON public.resource_folders FOR SELECT USING (true);
CREATE POLICY "folders_admin_policy" ON public.resource_folders FOR ALL TO authenticated USING (is_user_admin(auth.uid()));

-- 6. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_song_vote_change ON public.user_song_votes;
CREATE TRIGGER on_user_song_vote_change
  AFTER INSERT OR DELETE ON public.user_song_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_song_suggestion_total_votes();

-- 7. SEED DATA
INSERT INTO public.marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
('email-regulars', 'Email the regular member list', 'Direct Outreach', 'high', true, 'email', 7, 1),
('fb-malvern-noticeboard', 'Post in Malvern/Armadale Notice Board (MONDAY ONLY)', 'Facebook Groups', 'low', true, 'link', 12, 100),
('fb-malvern-community', 'Post in Malvern Community FB Group', 'Facebook Groups', 'low', true, 'link', 10, 101),
('fb-malvern-notice-board-public', 'Post in Malvern Notice Board (Public Group)', 'Facebook Groups', 'low', true, 'link', 11, 102),
('fb-australian-choral-collective', 'Australian Choral Collective', 'Facebook Groups', 'low', true, 'link', 10, 103),
('fb-choirs-of-melbourne', 'Choirs of Melbourne', 'Facebook Groups', 'low', true, 'link', 10, 104),
('fb-community-choir-network', 'Community Choir Network - Melbourne', 'Facebook Groups', 'low', true, 'link', 10, 105)
ON CONFLICT (task_key) DO NOTHING;