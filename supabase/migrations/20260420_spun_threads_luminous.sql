-- ==========================================
-- SUPABASE MIGRATION: SPUN THREADS & LUMINOUS LINES
-- ==========================================

-- 1. SPUN THREADS (Inspiration Network)
-- We add an 'inspired_by_story_id' to library_stories to link a new story back to the story that sparked the memory.
ALTER TABLE public.library_stories 
ADD COLUMN IF NOT EXISTS inspired_by_story_id UUID REFERENCES public.library_stories(id) ON DELETE SET NULL;

-- 2. LUMINOUS LINES (The Echoes)
-- We need a way to track which specific paragraph/sentence resonated with which user.
CREATE TABLE IF NOT EXISTS public.library_echoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paragraph_index INTEGER NOT NULL, -- Tracks which paragraph was echoed
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, user_id, paragraph_index) -- A user can only echo a specific paragraph once
);

ALTER TABLE public.library_echoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view echoes' AND tablename = 'library_echoes') THEN
        CREATE POLICY "Anyone can view echoes" ON public.library_echoes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can echo paragraphs' AND tablename = 'library_echoes') THEN
        CREATE POLICY "Users can echo paragraphs" ON public.library_echoes FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can remove their echoes' AND tablename = 'library_echoes') THEN
        CREATE POLICY "Users can remove their echoes" ON public.library_echoes FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
