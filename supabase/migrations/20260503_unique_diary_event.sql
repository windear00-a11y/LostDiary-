-- ==========================================
-- SUPABASE MIGRATION: UNIQUE DIARY_ENTRY_ID
-- ==========================================

-- 1. Add unique constraint to diary_entry_id in life_events
-- This allows us to use upsert to prevent duplicates when updating a journal entry
ALTER TABLE public.life_events 
ADD CONSTRAINT unique_diary_entry_id UNIQUE (diary_entry_id);
