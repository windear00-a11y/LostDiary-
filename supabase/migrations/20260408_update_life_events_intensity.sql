-- ==========================================
-- SUPABASE MIGRATION: UPDATE LIFE EVENTS INTENSITY
-- ==========================================

ALTER TABLE public.life_events 
RENAME COLUMN impact_score TO intensity;

ALTER TABLE public.life_events 
ALTER COLUMN intensity TYPE FLOAT;
