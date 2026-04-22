-- ==========================================
-- SUPABASE MIGRATION: BRIDGE MESSAGES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.bridge_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_id UUID NOT NULL REFERENCES public.bridges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bridge_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their bridge messages' AND tablename = 'bridge_messages') THEN
        CREATE POLICY "Users can view their bridge messages" ON public.bridge_messages 
        FOR SELECT USING (
            bridge_id IN (
                SELECT id FROM public.bridges 
                WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own bridge messages' AND tablename = 'bridge_messages') THEN
        CREATE POLICY "Users can insert their own bridge messages" ON public.bridge_messages 
        FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            bridge_id IN (
                SELECT id FROM public.bridges 
                WHERE (user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active'
            )
        );
    END IF;
END $$;
