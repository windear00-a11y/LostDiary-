import { SupabaseClient } from '@supabase/supabase-js';

export async function updateStoryEmotion(
  supabase: SupabaseClient,
  storyId: string,
  emotionKey: string,
  weight: number
) {
  // 1. Fetch current scores
  const { data: story, error: fetchError } = await supabase
    .from('library_stories')
    .select('emotion_scores')
    .eq('id', storyId)
    .single();

  if (fetchError || !story) return;

  const scores = story.emotion_scores || { hope: 0, tear: 0, resonance: 0, reflective: 0, courage: 0, calm: 0 };
  
  // 2. Increment
  scores[emotionKey] = (scores[emotionKey] || 0) + weight;

  // 3. Determine new dominant
  let dominant = story.dominant_emotion;
  let maxScore = -1;
  for (const [key, val] of Object.entries(scores)) {
    if ((val as number) > maxScore) {
        maxScore = val as number;
        dominant = key;
    }
  }

  // 4. Update
  await supabase
    .from('library_stories')
    .update({
        emotion_scores: scores,
        dominant_emotion: dominant
    })
    .eq('id', storyId);
}
