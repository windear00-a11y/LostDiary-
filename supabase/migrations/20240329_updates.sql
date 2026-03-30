-- Create updates table
CREATE TABLE IF NOT EXISTS updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new', 'improvement', 'upcoming')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_major BOOLEAN DEFAULT FALSE
);

-- Create user_updates table
CREATE TABLE IF NOT EXISTS user_updates (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  update_id UUID REFERENCES updates(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, update_id)
);

-- Enable RLS
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_updates ENABLE ROW LEVEL SECURITY;

-- Policies for updates
CREATE POLICY "Updates are viewable by everyone" 
ON updates FOR SELECT 
USING (is_active = TRUE);

-- Policies for user_updates
CREATE POLICY "Users can view their own update status" 
ON user_updates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own update status" 
ON user_updates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own update status" 
ON user_updates FOR UPDATE 
USING (auth.uid() = user_id);
