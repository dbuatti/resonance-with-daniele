-- Add new specific feedback columns to the event_feedback table
ALTER TABLE event_feedback 
ADD COLUMN IF NOT EXISTS venue_feedback TEXT,
ADD COLUMN IF NOT EXISTS repertoire_feedback TEXT,
ADD COLUMN IF NOT EXISTS future_ideas TEXT,
ADD COLUMN IF NOT EXISTS ai_insights JSONB;

-- Add comments for clarity
COMMENT ON COLUMN event_feedback.venue_feedback IS 'Specific thoughts on the venue location and setup';
COMMENT ON COLUMN event_feedback.repertoire_feedback IS 'Specific thoughts on the songs chosen for the session';
COMMENT ON COLUMN event_feedback.future_ideas IS 'Specific ideas for repertoire going forward';
COMMENT ON COLUMN event_feedback.ai_insights IS 'AI-generated analysis of the feedback for a specific event';