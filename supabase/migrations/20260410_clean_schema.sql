-- ==========================================
-- SUPABASE MIGRATION: CLEAN SCHEMA
-- ==========================================

-- 1. Create users table (formerly profiles/user_profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    personality_summary TEXT,
    responsiveness_level FLOAT DEFAULT 0.5,
    emotional_sensitivity FLOAT DEFAULT 0.5,
    engagement_level FLOAT DEFAULT 0.5,
    interaction_frequency INTEGER DEFAULT 0,
    last_response_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'diary')),
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'location')),
    content TEXT,
    media_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at ON public.chat_messages(user_id, created_at);

-- 3. Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary TEXT,
    narrative TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ,
    dominant_emotion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS for chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chapters" ON public.chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chapters" ON public.chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chapters" ON public.chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapters" ON public.chapters FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON public.chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_start_date ON public.chapters(start_date);

-- 4. Create life_events table
CREATE TABLE IF NOT EXISTS public.life_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    emotion TEXT,
    event_score FLOAT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for life_events
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own life events" ON public.life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own life events" ON public.life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own life events" ON public.life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own life events" ON public.life_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_user_id ON public.life_events(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_chapter_id ON public.life_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_life_events_message_id ON public.life_events(message_id);
CREATE INDEX IF NOT EXISTS idx_life_events_created_at ON public.life_events(created_at);

-- 5. Drop redundant tables and columns if they exist
-- (Assuming this is a fresh schema or we are cleaning up old ones)
DROP TABLE IF EXISTS public.entries CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
