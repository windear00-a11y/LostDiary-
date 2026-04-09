-- ==========================================
-- SUPABASE MIGRATION: REFACTOR CHAPTERS FOR ENGINE
-- ==========================================

-- 1. Rename title to name in chapters
ALTER TABLE public.chapters 
RENAME COLUMN title TO name;

-- 2. Add unique constraint to prevent duplicate chapters per category per user
-- We use the 'name' column which stores 'Love', 'Work', etc.
ALTER TABLE public.chapters
ADD CONSTRAINT unique_user_chapter_name UNIQUE (user_id, name);

-- 3. Ensure life_events has chapter_id (it already does from previous migrations)
-- We'll also add a 'chapter' string field for flexibility as requested
ALTER TABLE public.life_events
ADD COLUMN IF NOT EXISTS chapter_name TEXT;
