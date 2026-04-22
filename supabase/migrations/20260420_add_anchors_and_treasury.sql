-- Anchor store progress for a story
CREATE TABLE IF NOT EXISTS public.library_anchors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    paragraph_index INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, story_id)
);

-- Treasury to hold stories close
CREATE TABLE IF NOT EXISTS public.user_treasury (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, story_id)
);

ALTER TABLE public.library_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_treasury ENABLE ROW LEVEL SECURITY;

-- Policies for Anchors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their anchors' AND tablename = 'library_anchors') THEN
        CREATE POLICY "Users can manage their anchors" ON public.library_anchors FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their treasury' AND tablename = 'user_treasury') THEN
        CREATE POLICY "Users can manage their treasury" ON public.user_treasury FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
