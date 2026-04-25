-- Migration: Archive Rejected Planes with Schema
CREATE TABLE IF NOT EXISTS public.archived_planes (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    original_intent_type TEXT NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.archived_planes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their archived planes' AND tablename = 'archived_planes') THEN
        CREATE POLICY "Users can view their archived planes" ON public.archived_planes 
        FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
END $$;                
