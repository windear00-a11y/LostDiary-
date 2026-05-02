-- ==========================================
-- SUPABASE MIGRATION: ADD DIARY_ENTRY_ID TO LIFE_EVENTS
-- ==========================================

-- 1. Add diary_entry_id column to life_events
ALTER TABLE public.life_events
ADD COLUMN IF NOT EXISTS diary_entry_id UUID REFERENCES public.diary_entries(id) ON DELETE CASCADE;

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_life_events_diary_entry_id ON public.life_events(diary_entry_id);

-- 3. Update existing life_events if they were from entries that we migrated (not needed if we re-sync, but good for schema consistency)
