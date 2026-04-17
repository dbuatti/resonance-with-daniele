-- Clear existing tasks to ensure a clean sync with the new timeline
DELETE FROM public.marketing_tasks;

-- Insert the new timeline tasks
INSERT INTO public.marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
-- Thu, Mar 19th (30 days before)
('setup-founder-promo', 'Set up FOUNDER20 promo in Humanitix & DB', 'Admin', 'low', false, null, 30, 1),
('founder-pitch', 'Deliver "Founder Advantage" pitch at end of session', 'Strategy', 'high', false, null, 30, 2),
('founder-email', 'Send "April Legend" follow-up email with code', 'Email', 'low', true, 'email', 30, 3),

-- Thu, Mar 26th (23 days before)
('enable-public-tickets', 'Enable Public Ticket Tiers (GA, Early Bird, Concession)', 'Admin', 'low', false, null, 23, 4),

-- Sat, Apr 11th (7 days before)
('fb-armadale-community', 'Armadale Community', 'Facebook Groups', 'low', true, 'link', 7, 5),
('fb-glen-iris-malvern-armadale', 'Glen Iris, Malvern, Armadale Community', 'Facebook Groups', 'low', true, 'link', 7, 6),
('fb-stonnington-noticeboard', 'Stonnington Community Noticeboard', 'Facebook Groups', 'low', true, 'link', 7, 7),
('fb-melbourne-singers', 'Melbourne Singers & Musicians', 'Facebook Groups', 'low', true, 'link', 7, 8),
('fb-melbourne-musicians', 'Melbourne Musicians & Artists', 'Facebook Groups', 'low', true, 'link', 7, 9),
('fb-gig-guide-melbourne', 'Local Gig Guide Melbourne', 'Facebook Groups', 'low', true, 'link', 7, 10),

-- Mon, Apr 13th (5 days before)
('fb-malvern-armadale-monday', 'Post in Malvern/Armadale Notice Board (MONDAY ONLY)', 'Facebook Groups', 'low', true, 'link', 5, 11),
('fb-melbourne-choir-groups', 'Post in Melbourne Community Choir Groups', 'Facebook Groups', 'low', true, 'link', 5, 12),

-- Wed, Apr 15th (3 days before)
('message-10-people', 'Message 10 specific people personally', 'Outreach', 'high', false, null, 3, 13),
('email-regulars', 'Email the regular member list', 'Email', 'low', true, 'email', 3, 14),
('story-video-songs', 'Story: 30s video on why these songs', 'Social Media', 'high', false, null, 3, 15),

-- Thu, Apr 16th (2 days before)
('post-song-reveal', 'Post the Song Reveal (Billie Eilish & Wailin'' Jennys)', 'Social Media', 'high', false, null, 2, 16),
('share-announcement-stonnington', 'Share song announcement and tag @cityofstonnington', 'Social Media', 'low', false, null, 2, 17),
('dm-helpers', 'DM 3 potential "Helpers" personally', 'Outreach', 'high', false, null, 2, 18),

-- Fri, Apr 17th (1 day before)
('send-kit-newsletter', 'Send Kit.com newsletter (15% discount)', 'Email', 'low', true, 'email', 1, 19),
('story-final-invite', 'Story: Final personal invitation', 'Social Media', 'high', false, null, 1, 20),

-- Sat, Apr 18th (0 days before)
('print-lyrics', 'Print extra lyric sheets/scores', 'Logistics', 'low', false, null, 0, 21),
('focus-room', 'Focus on inhabiting the room', 'Strategy', 'high', false, null, 0, 22);