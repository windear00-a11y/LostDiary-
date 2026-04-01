-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  insight TEXT,
  suggestion TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  translated_content TEXT,
  normalized_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='mood') THEN
        ALTER TABLE entries ADD COLUMN mood TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='insight') THEN
        ALTER TABLE entries ADD COLUMN insight TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='suggestion') THEN
        ALTER TABLE entries ADD COLUMN suggestion TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='summary') THEN
        ALTER TABLE entries ADD COLUMN summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='tags') THEN
        ALTER TABLE entries ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='translated_content') THEN
        ALTER TABLE entries ADD COLUMN translated_content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='normalized_content') THEN
        ALTER TABLE entries ADD COLUMN normalized_content TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'Users can view their own entries') THEN
        CREATE POLICY "Users can view their own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'Users can insert their own entries') THEN
        CREATE POLICY "Users can insert their own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'Users can update their own entries') THEN
        CREATE POLICY "Users can update their own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'Users can delete their own entries') THEN
        CREATE POLICY "Users can delete their own entries" ON entries FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
