-- Run this in your Supabase SQL Editor to add the new Facebook group tasks
INSERT INTO public.marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
('fb-malvern-noticeboard', 'Post in Malvern/Armadale Notice Board (MONDAY ONLY)', 'Community Outreach', 'low', true, 'link', 12, 15),
('fb-malvern-community', 'Post in Malvern Community FB Group', 'Community Outreach', 'low', true, 'link', 10, 16),
('fb-malvern-notice-board-public', 'Post in Malvern Notice Board (Public Group)', 'Community Outreach', 'low', true, 'link', 11, 17),
('fb-australian-choral-collective', 'Post in Australian Choral Collective FB Group', 'Community Outreach', 'low', true, 'link', 10, 18),
('fb-choirs-of-melbourne', 'Post in Choirs of Melbourne FB Group', 'Community Outreach', 'low', true, 'link', 10, 19),
('fb-community-choir-network', 'Post in Community Choir Network - Melbourne FB Group', 'Community Outreach', 'low', true, 'link', 10, 20)
ON CONFLICT (task_key) DO UPDATE SET label = EXCLUDED.label;