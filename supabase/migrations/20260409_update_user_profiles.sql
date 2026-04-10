-- ==========================================
-- SUPABASE MIGRATION: UPDATE USER PROFILES
-- ==========================================

ALTER TABLE IF EXISTS public.user_profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS personality_summary TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure RLS is enabled (it might already be)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own profile' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
