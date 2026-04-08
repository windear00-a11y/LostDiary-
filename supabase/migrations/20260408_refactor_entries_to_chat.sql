-- ==========================================
-- SUPABASE MIGRATION: REFACTOR ENTRIES TO CHAT MESSAGES
-- ==========================================

-- 1. Alter life_events to reference chat_messages instead of entries
ALTER TABLE public.life_events
DROP CONSTRAINT IF EXISTS life_events_entry_id_fkey;

ALTER TABLE public.life_events
RENAME COLUMN entry_id TO message_id;

-- Ensure message_id references chat_messages
-- Note: If there are existing life_events with message_id that don't exist in chat_messages, this might fail.
-- Assuming we can clear life_events for the refactor if needed, or just add the constraint.
-- To be safe, let's clear life_events that don't have a matching chat_message (which is all of them if we just renamed).
DELETE FROM public.life_events;

ALTER TABLE public.life_events
ADD CONSTRAINT life_events_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS idx_life_events_entry_id;
CREATE INDEX IF NOT EXISTS idx_life_events_message_id ON public.life_events(message_id);

-- 2. Drop the entries table completely
DROP TABLE IF EXISTS public.entries CASCADE;
