-- 1. Enable the extension that allows the database to make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. After you've enabled it and triggered a change in your 'profiles' table,
-- run this to see if the database is successfully sending the data:
SELECT 
  created_at, 
  status, 
  error_msg, 
  url,
  body
FROM net.http_requests 
ORDER BY created_at DESC 
LIMIT 10;