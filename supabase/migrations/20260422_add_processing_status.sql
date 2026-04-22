-- Add processing_status to chat_sessions, diary_entries, and chat_messages
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS impact_percentage INTEGER DEFAULT 0;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS impact_percentage INTEGER DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Update types for readability
-- 'woven' (Chapter), 'saved' (Event), 'observed' (Minor), 'pending' (In progress)
