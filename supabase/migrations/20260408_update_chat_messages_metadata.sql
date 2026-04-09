-- ==========================================
-- SUPABASE MIGRATION: UPDATE CHAT MESSAGES SCHEMA
-- ==========================================

-- 1. Add metadata column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure content can hold URLs for media (it's already TEXT, so it's fine)
-- We'll keep media_url for now to avoid breaking existing data, but we'll prefer content.

-- 3. Update RLS policies if needed (they are already user-based, so they should be fine)
