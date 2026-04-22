-- Update chapters table to store inspired_by flag so it can carry over to the library when published
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS inspired_by_story_id UUID;
