-- 1. Table for the 'Brain Dump' and other admin notes
CREATE TABLE IF NOT EXISTS public.admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    note_key TEXT UNIQUE, -- e.g., 'brain_dump_EVENT_ID'
    content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Table for the '10 People Rule' outreach tracker
CREATE TABLE IF NOT EXISTS public.outreach_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_messaged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Table for the Marketing Execution Checklist status
CREATE TABLE IF NOT EXISTS public.marketing_task_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL, -- e.g., 'personal-10'
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(admin_id, event_id, task_id)
);

-- 4. Table for the 1-Year Growth Strategy missions
CREATE TABLE IF NOT EXISTS public.growth_mission_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_key TEXT NOT NULL, -- e.g., 'google-maps'
    step_index INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(admin_id, mission_key, step_index)
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_mission_steps ENABLE ROW LEVEL SECURITY;

-- Create Policies (Admin only access)
CREATE POLICY "Admins can manage notes" ON public.admin_notes 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage outreach" ON public.outreach_targets 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage task status" ON public.marketing_task_status 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage growth steps" ON public.growth_mission_steps 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));