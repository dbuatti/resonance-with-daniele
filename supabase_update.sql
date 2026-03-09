-- Add the ai_chat_link column to the events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ai_chat_link TEXT;

-- Optional: Add a comment to explain the column's purpose
COMMENT ON COLUMN events.ai_chat_link IS 'Private link for administrators to access AI chat tools for this specific event.';