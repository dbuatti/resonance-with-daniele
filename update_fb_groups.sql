-- Ensure RLS is enabled
ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage marketing tasks" ON public.marketing_tasks;
DROP POLICY IF EXISTS "Admins can read marketing tasks" ON public.marketing_tasks;

-- Create a comprehensive policy for administrators to perform all operations
CREATE POLICY "Admins can manage marketing tasks" ON public.marketing_tasks
FOR ALL TO authenticated
USING (is_user_admin(auth.uid()))
WITH CHECK (is_user_admin(auth.uid()));

-- Allow all authenticated users to read tasks (needed for the timeline view)
CREATE POLICY "Anyone can read marketing tasks" ON public.marketing_tasks
FOR SELECT TO authenticated
USING (true);