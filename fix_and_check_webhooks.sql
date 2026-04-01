-- 1. Ensure the extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Check if the extension is actually active
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 3. Query the CORRECT table for Supabase logs (http_request_queue)
SELECT 
  id,
  created_at, 
  status, 
  error_msg, 
  url
FROM net.http_request_queue 
ORDER BY created_at DESC 
LIMIT 10;