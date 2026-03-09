-- Table for tracking event expenses
CREATE TABLE IF NOT EXISTS event_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT, -- e.g., 'Venue', 'Marketing', 'Sheet Music'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking ticket sales snapshots
CREATE TABLE IF NOT EXISTS event_ticket_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tickets_sold INTEGER NOT NULL,
  revenue DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for marketing promotions (Flash Sales)
CREATE TABLE IF NOT EXISTS marketing_promos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_promos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Admins can manage expenses" ON event_expenses;
DROP POLICY IF EXISTS "Admins can manage ticket sales" ON event_ticket_sales;
DROP POLICY IF EXISTS "Admins can manage promos" ON marketing_promos;

-- Re-create Admin-only policies
CREATE POLICY "Admins can manage expenses" ON event_expenses
  FOR ALL USING (auth.jwt() ->> 'email' IN ('daniele.buatti@gmail.com', 'resonancewithdaniele@gmail.com'));

CREATE POLICY "Admins can manage ticket sales" ON event_ticket_sales
  FOR ALL USING (auth.jwt() ->> 'email' IN ('daniele.buatti@gmail.com', 'resonancewithdaniele@gmail.com'));

CREATE POLICY "Admins can manage promos" ON marketing_promos
  FOR ALL USING (auth.jwt() ->> 'email' IN ('daniele.buatti@gmail.com', 'resonancewithdaniele@gmail.com'));