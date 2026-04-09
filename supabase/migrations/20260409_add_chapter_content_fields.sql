-- ==========================================
-- SUPABASE MIGRATION: ADD CONTENT FIELDS TO CHAPTERS
-- ==========================================

-- 1. Add original_content and authored_content to chapters
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS authored_content TEXT;

-- 2. Migrate existing story_content to authored_content if it exists
UPDATE public.chapters 
SET authored_content = story_content 
WHERE authored_content IS NULL AND story_content IS NOT NULL;
