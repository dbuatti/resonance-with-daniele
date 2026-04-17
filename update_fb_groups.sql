-- Add more Facebook groups to the marketing tasks
INSERT INTO public.marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
('fb-armadale-community', 'Armadale Community', 'Facebook Groups', 'low', true, 'link', 7, 10),
('fb-glen-iris-malvern-armadale', 'Glen Iris, Malvern, Armadale Community', 'Facebook Groups', 'low', true, 'link', 7, 11),
('fb-stonnington-noticeboard', 'Stonnington Community Noticeboard', 'Facebook Groups', 'low', true, 'link', 7, 12),
('fb-melbourne-singers', 'Melbourne Singers & Musicians', 'Facebook Groups', 'low', true, 'link', 7, 13),
('fb-melbourne-musicians', 'Melbourne Musicians & Artists', 'Facebook Groups', 'low', true, 'link', 7, 14),
('fb-gig-guide-melbourne', 'Local Gig Guide Melbourne', 'Facebook Groups', 'low', true, 'link', 7, 15)
ON CONFLICT (task_key) DO NOTHING;