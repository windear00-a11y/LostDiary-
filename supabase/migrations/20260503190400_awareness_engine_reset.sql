-- ==========================================
-- WINDEAR SELF-AWARENESS ENGINE - DATABASE RESET
-- ==========================================
-- WARNING: This will drop old tables to make way for the new structured architecture.

-- 1. DROP OBSOLETE TABLES
DROP TABLE IF EXISTS public.bridge_messages CASCADE;
DROP TABLE IF EXISTS public.bridges CASCADE;
DROP TABLE IF EXISTS public.library_views CASCADE;
DROP TABLE IF EXISTS public.library_reactions CASCADE;
DROP TABLE IF EXISTS public.library_anchors CASCADE;
DROP TABLE IF EXISTS public.library_ahsas CASCADE;
DROP TABLE IF EXISTS public.library_echoes CASCADE;
DROP TABLE IF EXISTS public.archived_planes CASCADE;
DROP TABLE IF EXISTS public.library_stories CASCADE;
DROP TABLE IF EXISTS public.life_events CASCADE;
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.volumes CASCADE;
DROP TABLE IF EXISTS public.diary_entries CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- ==========================================
-- 2. CREATE NEW ENGINE TABLES
-- ==========================================

-- A. Profiles (Tracking Engine & Identity)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    awareness_score INTEGER DEFAULT 0,
    reaction_ratio FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- B. Capture Layer: Sessions
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    processing_status TEXT DEFAULT 'active', -- active, woven
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- C. Capture Layer: Messages (Raw Input)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- D. Understanding Module: Extracted Signals
CREATE TABLE public.extracted_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emotion TEXT,
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
    trigger_context TEXT, -- e.g., 'boss feedback', 'morning rush'
    behavior_type TEXT, -- e.g., 'reactive', 'avoidance', 'delayed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.extracted_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signals" ON public.extracted_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signals" ON public.extracted_signals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- E. Pattern Engine: Repeated Behaviors
CREATE TABLE public.behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pattern_description TEXT NOT NULL,
    frequency_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- active, observing, resolved
    last_detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own patterns" ON public.behavior_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON public.behavior_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON public.behavior_patterns FOR UPDATE USING (auth.uid() = user_id);

-- F. Insight & Action Engine
CREATE TABLE public.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pattern_id UUID REFERENCES public.behavior_patterns(id) ON DELETE SET NULL,
    content TEXT NOT NULL, -- "Tumne is week same situation me 3 baar react kiya"
    action_suggestion TEXT, -- "Next time reply se pehle 3 sec pause karo"
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights" ON public.insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON public.insights FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 3. TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
