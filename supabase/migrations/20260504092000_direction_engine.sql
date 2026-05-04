-- ==========================================
-- WINDEAR DIRECTION ENGINE (PURPOSE LAYER)
-- ==========================================

-- 1. Values Extraction Module
CREATE TABLE public.core_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    value_name TEXT NOT NULL, -- e.g., 'independence', 'growth', 'creativity'
    confidence_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.core_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own values" ON public.core_values FOR ALL USING (auth.uid() = user_id);

-- 2. Energy Mapping Module
CREATE TABLE public.energy_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL, -- e.g., 'problem-solving', 'repetitive tasks'
    energy_level TEXT CHECK (energy_level IN ('energizing', 'draining', 'neutral')),
    confidence_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.energy_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own energy maps" ON public.energy_maps FOR ALL USING (auth.uid() = user_id);

-- 3. Experiment Engine
CREATE TABLE public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    findings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own experiments" ON public.experiments FOR ALL USING (auth.uid() = user_id);

-- 4. Direction Insights Module
CREATE TABLE public.direction_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    insight_type TEXT CHECK (insight_type IN ('role', 'environment', 'strength', 'growth')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.direction_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own direction insights" ON public.direction_insights FOR ALL USING (auth.uid() = user_id);

-- 5. Evolution Tracking Module (Interest shifts, behavior changes)
CREATE TABLE public.evolution_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trend_description TEXT NOT NULL,
    time_period TEXT NOT NULL, -- e.g., 'last 2 months'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.evolution_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own evolution trends" ON public.evolution_trends FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_core_values_updated_at BEFORE UPDATE ON public.core_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_energy_maps_updated_at BEFORE UPDATE ON public.energy_maps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
