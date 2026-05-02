-- ==========================================
-- SUPABASE MIGRATION: ADD PREFERRED_LANGUAGE
-- ==========================================

ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS is_pending_deletion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;
