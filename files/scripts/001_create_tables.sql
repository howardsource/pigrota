-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_name TEXT,
  subtitle TEXT,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  custom_start_time TEXT,
  custom_end_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public access (no login required)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shifts
CREATE POLICY "Allow public read access to shifts" ON shifts
  FOR SELECT USING (true);

-- Allow anyone to insert shifts
CREATE POLICY "Allow public insert access to shifts" ON shifts
  FOR INSERT WITH CHECK (true);

-- Allow anyone to delete shifts
CREATE POLICY "Allow public delete access to shifts" ON shifts
  FOR DELETE USING (true);

-- Allow anyone to read events
CREATE POLICY "Allow public read access to events" ON events
  FOR SELECT USING (true);

-- Allow anyone to insert events
CREATE POLICY "Allow public insert access to events" ON events
  FOR INSERT WITH CHECK (true);

-- Allow anyone to delete events
CREATE POLICY "Allow public delete access to events" ON events
  FOR DELETE USING (true);
