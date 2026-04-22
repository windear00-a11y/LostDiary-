-- ==========================================
-- SUPABASE MIGRATION: GLOBAL LIBRARY STORIES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.library_stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID UNIQUE REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_content TEXT NOT NULL,
    pen_name TEXT NOT NULL,
    pen_name_tag TEXT NOT NULL,
    dominant_emotion TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect privacy, no one can see author_id in the view
CREATE INDEX IF NOT EXISTS idx_library_stories_created_at ON public.library_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_stories_pen_name ON public.library_stories(pen_name, pen_name_tag);

-- Add simple RLS: Everyone (even unauthenticated, or authenticated depending on usage) can read.
-- Only the author can insert/update.
ALTER TABLE public.library_stories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view library stories' AND tablename = 'library_stories') THEN
        CREATE POLICY "Anyone can view library stories" ON public.library_stories
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can publish their own stories' AND tablename = 'library_stories') THEN
        CREATE POLICY "Users can publish their own stories" ON public.library_stories
            FOR ALL USING (auth.uid() = author_id);
    END IF;
END $$;
