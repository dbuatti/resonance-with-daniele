-- Add URL column to marketing_tasks if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_tasks' AND column_name='url') THEN
        ALTER TABLE public.marketing_tasks ADD COLUMN url TEXT;
    END IF;
END $$;

-- Update existing Facebook tasks with placeholder URLs so they are editable
UPDATE public.marketing_tasks 
SET url = 'https://facebook.com/groups/...'
WHERE category = 'Facebook Groups' AND (url IS NULL OR url = '');