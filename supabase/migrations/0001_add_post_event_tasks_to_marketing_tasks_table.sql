INSERT INTO marketing_tasks (task_key, label, category, energy, has_action, action_type, days_before, sort_order)
VALUES 
    ('post-concert-insta', 'Post Choir Instagram photo', 'Post-Event', 'low', false, null, -1, 200),
    ('thank-you-email', 'Send thank you email to attendees', 'Post-Event', 'low', true, 'email-regulars', -1, 210),
    ('feedback-review', 'Review event feedback & metrics', 'Post-Event', 'high', false, null, -2, 220)
ON CONFLICT (task_key) DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category,
    energy = EXCLUDED.energy,
    has_action = EXCLUDED.has_action,
    action_type = EXCLUDED.action_type,
    days_before = EXCLUDED.days_before,
    sort_order = EXCLUDED.sort_order;