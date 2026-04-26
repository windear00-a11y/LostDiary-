import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { updateStoryEmotion } from '@/lib/services/emotion-service';

export async function POST(req: Request) {
  try {
    const { storyId, reactionType } = await req.json();

    if (!storyId || !reactionType) {
      return NextResponse.json({ error: 'Story ID and reaction type are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert the reaction into the energy jar
    const { error: upsertError } = await supabase
      .from('library_reactions')
      .upsert({
        story_id: storyId,
        user_id: user.id,
        reaction_type: reactionType
      }, { onConflict: 'story_id, user_id, reaction_type' });

    if (upsertError) {
      console.error("Reaction Upsert Error:", upsertError);
      return NextResponse.json({ error: 'Failed to add your energy' }, { status: 500 });
    }

    // Dynamic Emotion Update
    const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    
    await updateStoryEmotion(adminSupabase, storyId, reactionType, 1);
    await adminSupabase.rpc('increment_story_likes', { story_id: storyId });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Energy Jar error:', error);
    return NextResponse.json({ error: 'An unexpected current caught your energy.' }, { status: 500 });
  }
}    
