-- ==========================================
-- SUPABASE MIGRATION: UPDATE LIFE EVENTS INTENSITY TO TEXT
-- ==========================================

ALTER TABLE public.life_events 
ALTER COLUMN intensity TYPE TEXT USING intensity::TEXT;
