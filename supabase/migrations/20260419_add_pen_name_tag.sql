-- ==========================================
-- SUPABASE MIGRATION: ADD PEN NAME & TAG
-- ==========================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pen_name TEXT,
ADD COLUMN IF NOT EXISTS pen_name_tag TEXT;

-- Ensure that the combination of pen_name and pen_name_tag is unique globally
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_pen_name_with_tag'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT unique_pen_name_with_tag UNIQUE (pen_name, pen_name_tag);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_pen_name ON public.users(pen_name);
