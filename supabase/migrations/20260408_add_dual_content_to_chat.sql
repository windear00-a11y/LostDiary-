-- Add original_content and authored_content to chat_messages table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='original_content') THEN
        ALTER TABLE public.chat_messages ADD COLUMN original_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='authored_content') THEN
        ALTER TABLE public.chat_messages ADD COLUMN authored_content TEXT;
    END IF;
END $$;
