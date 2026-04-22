-- Bridge rooms to link two anonymous users
CREATE TABLE IF NOT EXISTS public.bridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.library_stories(id),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Chat messages between two users
CREATE TABLE IF NOT EXISTS public.bridge_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_id UUID NOT NULL REFERENCES public.bridges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_safe BOOLEAN DEFAULT true
);

ALTER TABLE public.bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Bridge
CREATE POLICY "Users can view their bridges" ON public.bridges FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages to their bridge" ON public.bridge_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view messages of their bridge" ON public.bridge_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.bridges WHERE id = bridge_id AND (auth.uid() = sender_id OR auth.uid() = receiver_id)));
