-- Add original_content and authored_content to entries table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='original_content') THEN
        ALTER TABLE entries ADD COLUMN original_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='authored_content') THEN
        ALTER TABLE entries ADD COLUMN authored_content TEXT;
    END IF;
END $$;
