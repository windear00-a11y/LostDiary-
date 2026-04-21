-- Add emotion_scores column to library_stories to track engagement over time
ALTER TABLE public.library_stories 
ADD COLUMN IF NOT EXISTS emotion_scores JSONB DEFAULT '{
  "hope": 0,
  "tear": 0,
  "resonance": 0,
  "reflective": 0,
  "courage": 0,
  "calm": 0
}'::jsonb;
