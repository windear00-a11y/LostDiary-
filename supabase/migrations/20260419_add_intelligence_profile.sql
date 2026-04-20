-- Add intelligence_profile JSONB column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS intelligence_profile JSONB DEFAULT '{
  "basic_profile": {},
  "thinking_style": {},
  "emotional_state": {},
  "interests_goals": {},
  "behavior_patterns": {},
  "communication_style": {},
  "sensitive_insights": {},
  "source_weights": { "chat": 0.3, "diary": 0.7 }
}'::jsonb;
