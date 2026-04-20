-- ==========================================
-- SUPABASE MIGRATION: LIBRARY INTERACTIONS (ENERGY JAR & PAPER PLANES)
-- ==========================================

-- 1. Energy Jar Reactions
CREATE TABLE IF NOT EXISTS public.library_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- e.g., 'hope', 'tear', 'resonance'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, user_id, reaction_type)
);

ALTER TABLE public.library_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view reactions' AND tablename = 'library_reactions') THEN
        CREATE POLICY "Anyone can view reactions" ON public.library_reactions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can add their own reactions' AND tablename = 'library_reactions') THEN
        CREATE POLICY "Users can add their own reactions" ON public.library_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can remove their own reactions' AND tablename = 'library_reactions') THEN
        CREATE POLICY "Users can remove their own reactions" ON public.library_reactions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 2. Paper Planes & Golden Letters
CREATE TABLE IF NOT EXISTS public.paper_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.library_stories(id) ON DELETE CASCADE,
    intent_type TEXT NOT NULL, -- 'golden_letter' (one-way appreciation), 'bridge_request' (two-way connection)
    content TEXT NOT NULL,
    status TEXT DEFAULT 'delivered', -- 'delivered', 'accepted' (bridge formed), 'burned' (filtered/rejected)
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.paper_planes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Senders can see planes they sent
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Senders can view their sent planes' AND tablename = 'paper_planes') THEN
        CREATE POLICY "Senders can view their sent planes" ON public.paper_planes FOR SELECT USING (auth.uid() = sender_id);
    END IF;
    -- Receivers can see planes delivered to them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Receivers can view their received planes' AND tablename = 'paper_planes') THEN
        CREATE POLICY "Receivers can view their received planes" ON public.paper_planes FOR SELECT USING (auth.uid() = receiver_id);
    END IF;
    -- Users can send planes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send planes' AND tablename = 'paper_planes') THEN
        CREATE POLICY "Users can send planes" ON public.paper_planes FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
    -- Receivers can update status (e.g., accept or reject)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Receivers can update status' AND tablename = 'paper_planes') THEN
        CREATE POLICY "Receivers can update status" ON public.paper_planes FOR UPDATE USING (auth.uid() = receiver_id);
    END IF;
END $$;

-- 3. Bridges (Anonymous Chat Rooms) - Groundwork
CREATE TABLE IF NOT EXISTS public.bridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_story_id UUID REFERENCES public.library_stories(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- 'active', 'broken'
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bridges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Bridge participants can view bridge' AND tablename = 'bridges') THEN
        CREATE POLICY "Bridge participants can view bridge" ON public.bridges FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
    END IF;
END $$;
