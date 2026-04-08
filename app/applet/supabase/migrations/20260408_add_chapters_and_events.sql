-- ==========================================
-- SUPABASE MIGRATION: LIFEBOOK CHAPTERS & EVENTS
-- ==========================================

-- 1. Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_content TEXT, -- The generated narrative chapter text
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ, -- Null means it's the currently active chapter
    dominant_emotion TEXT,
    dominant_categories TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create life_events table (extracted from entries)
CREATE TABLE IF NOT EXISTS public.life_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    emotion TEXT,
    category TEXT,
    impact_score INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for chapters
CREATE POLICY "Users can view their own chapters" ON public.chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chapters" ON public.chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chapters" ON public.chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapters" ON public.chapters FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS Policies for life_events
CREATE POLICY "Users can view their own life events" ON public.life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own life events" ON public.life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own life events" ON public.life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own life events" ON public.life_events FOR DELETE USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON public.chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_user_id ON public.life_events(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_chapter_id ON public.life_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_life_events_entry_id ON public.life_events(entry_id);
