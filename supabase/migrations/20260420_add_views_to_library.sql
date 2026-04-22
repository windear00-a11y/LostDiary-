-- 1. Track Views (The "Breathed By")
ALTER TABLE public.library_stories ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Create a table to track unique views to prevent author-inflated views
CREATE TABLE IF NOT EXISTS public.library_views (
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(story_id, viewer_id)
);

ALTER TABLE public.library_views ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view views' AND tablename = 'library_views') THEN
        CREATE POLICY "Anyone can view views" ON public.library_views FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can mark stories as viewed' AND tablename = 'library_views') THEN
        CREATE POLICY "Users can mark stories as viewed" ON public.library_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
    END IF;
END $$;
