-- Create the marketing tasks definition table
CREATE TABLE IF NOT EXISTS marketing_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    energy TEXT CHECK (energy IN ('high', 'low')),
    has_action BOOLEAN DEFAULT false,
    action_type TEXT,
    days_before INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;

-- Allow admins to read tasks
CREATE POLICY "Admins can read marketing tasks" ON marketing_tasks
    FOR SELECT USING (true);

-- Seed the table with existing and new tasks
INSERT INTO marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
    ('personal-10', 'Message 10 specific people personally', '3 Days Before', 'high', false, null, 3, 10),
    ('email-regulars', 'Email the regular member list', '3 Days Before', 'low', true, 'email-regulars', 3, 20),
    ('insta-story-why', 'Story: 30s video on why these songs', '3 Days Before', 'high', false, null, 3, 30),
    ('song-reveal', 'Post the Song Reveal (Billie Eilish & Wailin'' Jennys)', '2 Days Before', 'high', false, null, 2, 40),
    ('duo-mention', 'Highlight Duo/Pair tickets in Stories', '2 Days Before', 'low', false, null, 2, 50),
    ('direct-outreach-interest', 'Email the "Express Interest" list personally', '2 Days Before', 'high', true, 'email-interest', 2, 60),
    ('tag-local-page', 'Share song announcement and tag @cityofstonnington', '2 Days Before', 'low', false, null, 2, 70),
    ('fb-bump', 'Bump previous posts in local groups with song reveal comment', '2 Days Before', 'low', false, null, 2, 80),
    ('insta-story-chords', 'Story: Play chords from the repertoire', '2 Days Before', 'low', false, null, 2, 90),
    ('helper-outreach', 'DM 3 potential "Helpers" personally', '2 Days Before', 'high', false, null, 2, 100),
    ('flash-sale-newsletter', 'Send Kit.com newsletter (15% discount)', '1 Day Before', 'low', true, 'email-regulars', 1, 110),
    ('fb-groups-invite', 'Post in community groups', '1 Day Before', 'low', false, null, 1, 120),
    ('insta-story-final', 'Story: Final personal invitation', '1 Day Before', 'high', false, null, 1, 130),
    ('print-lyrics', 'Print extra lyric sheets/scores', 'Day Of', 'low', false, null, 0, 140),
    ('inhabit-room', 'Focus on inhabiting the room', 'Day Of', 'high', false, null, 0, 150)
ON CONFLICT (task_key) DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category,
    energy = EXCLUDED.energy,
    has_action = EXCLUDED.has_action,
    action_type = EXCLUDED.action_type,
    days_before = EXCLUDED.days_before,
    sort_order = EXCLUDED.sort_order;