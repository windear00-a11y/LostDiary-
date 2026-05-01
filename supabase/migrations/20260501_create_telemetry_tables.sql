CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    route TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feedback', 'feature_request')),
    description TEXT NOT NULL,
    expected_behavior TEXT,
    screenshot_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Policies for system_errors
-- Allow anyone (even unauthenticated, so errors don't fail to log if auth drops) to insert errors
CREATE POLICY "Allow anyone to insert system errors" ON public.system_errors
    FOR INSERT WITH CHECK (true);

-- Users can read their own errors (although mostly for admin dashboard)
CREATE POLICY "Users can read their own errors" ON public.system_errors
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for user_reports
-- Allow authenticated users to insert reports
CREATE POLICY "Users can insert reports" ON public.user_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own reports" ON public.user_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Create a storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug-reports', 'bug-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated users to upload screenshots" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'bug-reports' AND auth.uid() = owner);

CREATE POLICY "Allow authenticated users to read their screenshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'bug-reports' AND auth.uid() = owner);
