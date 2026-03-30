-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  update_id UUID REFERENCES updates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT,
  is_like BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'under_review' CHECK (status IN ('under_review', 'planned', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create idea_votes table
CREATE TABLE IF NOT EXISTS idea_votes (
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (idea_id, user_id)
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'ux', 'performance')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Feedback is viewable by everyone" 
ON feedback FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own feedback" 
ON feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON feedback FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for ideas
CREATE POLICY "Ideas are viewable by everyone" 
ON ideas FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own ideas" 
ON ideas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas" 
ON ideas FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for idea_votes
CREATE POLICY "Idea votes are viewable by everyone" 
ON idea_votes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own idea votes" 
ON idea_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own idea votes" 
ON idea_votes FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for issues
CREATE POLICY "Issues are viewable by everyone" 
ON issues FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own issues" 
ON issues FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues" 
ON issues FOR UPDATE 
USING (auth.uid() = user_id);

-- RPCs for upvoting
CREATE OR REPLACE FUNCTION increment_idea_upvotes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ideas SET upvotes = upvotes + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_idea_upvotes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ideas SET upvotes = upvotes - 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
