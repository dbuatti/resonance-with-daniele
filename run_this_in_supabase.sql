-- 1. Get the Event ID for May 24 and an Admin ID using unique variable names
DO $$ 
DECLARE 
    v_may_event_id UUID;
    v_admin_id UUID;
BEGIN
    -- Find the event by date
    SELECT id INTO v_may_event_id FROM public.events WHERE date = '2026-05-24' LIMIT 1;
    
    -- Find your admin profile ID
    SELECT id INTO v_admin_id FROM public.profiles WHERE is_admin = true LIMIT 1;

    IF v_may_event_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
        -- 2. Mark Facebook Group Post as Completed
        INSERT INTO public.marketing_task_status (admin_id, event_id, task_id, is_completed)
        VALUES (v_admin_id, v_may_event_id, 'advertise-fb', true)
        ON CONFLICT (admin_id, task_id, event_id) DO UPDATE SET is_completed = true;

        -- 3. Create the FOUNDER20 Promo Code record for tracking
        INSERT INTO public.marketing_promos (event_id, code, discount_percent, start_date, end_date, description, is_active)
        VALUES (
            v_may_event_id, 
            'FOUNDER20', 
            20, 
            '2026-04-28 00:00:00+00', 
            '2026-05-05 23:59:59+00', 
            'Founding Member Early Access (April Legends)', 
            true
        )
        ON CONFLICT DO NOTHING;

        -- 4. Add the Instagram Bio update to your to-do list
        INSERT INTO public.marketing_task_status (admin_id, event_id, task_id, is_completed)
        VALUES (v_admin_id, v_may_event_id, 'update-insta-bio', false)
        ON CONFLICT DO NOTHING;
        
        -- 5. Ensure the Email Regulars task is visible in your checklist
        INSERT INTO public.marketing_task_status (admin_id, event_id, task_id, is_completed)
        VALUES (v_admin_id, v_may_event_id, 'email-regulars', false)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Successfully updated tasks and promo for event %', v_may_event_id;
    ELSE
        RAISE EXCEPTION 'Could not find May 24 event or an admin profile.';
    END IF;
END $$;