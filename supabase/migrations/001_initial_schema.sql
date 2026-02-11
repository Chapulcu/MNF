-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  position_preference VARCHAR(50) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Settings table for app configuration
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default max_players setting
INSERT INTO settings (key, value, description)
VALUES (
  'max_players',
  '50'::jsonb,
  'Maksimum oyuncu sayısı limiti'
)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Players policies - allow public read/write (you may want to add authentication later)
CREATE POLICY "Allow public read access on players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on players"
  ON players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on players"
  ON players FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on players"
  ON players FOR DELETE
  USING (true);

-- Settings policies - allow public read/write
CREATE POLICY "Allow public read access on settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Allow public update on settings"
  ON settings FOR UPDATE
  USING (true);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position_preference);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
