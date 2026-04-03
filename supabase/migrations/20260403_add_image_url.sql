-- Add image_url column to entries table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='image_url') THEN
        ALTER TABLE entries ADD COLUMN image_url TEXT;
    END IF;
END $$;
