-- Create Volumes table to support the "Live Autobiography" concept
CREATE TABLE IF NOT EXISTS volumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  prologue TEXT,
  epigraph TEXT,
  aura TEXT,
  epilogue TEXT,
  status TEXT DEFAULT 'ongoing', -- 'ongoing' or 'completed'
  created_at TIMESTAMP WITH TIME_ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME_ZONE DEFAULT NOW(),
  UNIQUE(user_id, volume_number)
);

-- Link chapters to volumes
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS volume_id UUID REFERENCES volumes(id);
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT false; -- If true, it's a finished chapter in the legacy. If false, it's still being "lived".
