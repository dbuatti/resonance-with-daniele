-- Adding new strategic tasks to the global marketing timeline
-- These will automatically appear for all future events in your Rolodex and Command Center

INSERT INTO public.marketing_tasks 
(task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
-- 1. Research (4 weeks out)
('research-song', 'Research & Select Repertoire', 'Repertoire', 'high', false, null, 28, 5),

-- 2. Early Posting (3 weeks out)
('post-song-announcement', 'Announce Main Song on Socials', 'Social Media', 'low', false, null, 21, 15),

-- 3. Early Distribution (Approx 2.5 weeks out)
('send-song-to-group', 'Email Song & Materials to Group', 'Email', 'high', true, 'email', 18, 25),

-- 4. Direct Personal Outreach (1.5 weeks out)
('direct-outreach-email', 'Personal Outreach Emails to Regulars', 'Outreach', 'high', true, 'email', 10, 35)

ON CONFLICT (task_key) DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category,
    energy = EXCLUDED.energy,
    has_action = EXCLUDED.has_action,
    action_type = EXCLUDED.action_type,
    days_before = EXCLUDED.days_before,
    sort_order = EXCLUDED.sort_order;

-- Optional: If you want to see these immediately for the May 24 event, 
-- you can run this block as well to initialize their status.
DO $$ 
DECLARE 
    v_may_event_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_may_event_id FROM public.events WHERE date = '2026-05-24' LIMIT 1;
    SELECT id INTO v_admin_id FROM public.profiles WHERE is_admin = true LIMIT 1;

    IF v_may_event_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
        INSERT INTO public.marketing_task_status (admin_id, event_id, task_id, is_completed)
        VALUES 
            (v_admin_id, v_may_event_id, 'research-song', false),
            (v_admin_id, v_may_event_id, 'post-song-announcement', false),
            (v_admin_id, v_may_event_id, 'send-song-to-group', false),
            (v_admin_id, v_may_event_id, 'direct-outreach-email', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;