-- Add breakdown column to store ticket type data
ALTER TABLE event_ticket_sales ADD COLUMN IF NOT EXISTS breakdown JSONB;

-- Re-run policies just in case (idempotent)
DROP POLICY IF EXISTS "Admins can manage ticket sales" ON event_ticket_sales;
CREATE POLICY "Admins can manage ticket sales" ON event_ticket_sales
  FOR ALL USING (auth.jwt() ->> 'email' IN ('daniele.buatti@gmail.com', 'resonancewithdaniele@gmail.com'));