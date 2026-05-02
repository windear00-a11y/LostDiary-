-- ==========================================
-- SUPABASE MIGRATION: ENSURE DIARY_ENTRIES COLUMNS
-- ==========================================

-- 1. Ensure processing_status exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='processing_status') THEN
        ALTER TABLE public.diary_entries ADD COLUMN processing_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 2. Ensure impact_percentage exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='impact_percentage') THEN
        ALTER TABLE public.diary_entries ADD COLUMN impact_percentage INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Ensure metadata exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='metadata') THEN
        ALTER TABLE public.diary_entries ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 4. Ensure updated_at exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='updated_at') THEN
        ALTER TABLE public.diary_entries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 5. Ensure created_at exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diary_entries' AND column_name='created_at') THEN
        ALTER TABLE public.diary_entries ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Reset schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
