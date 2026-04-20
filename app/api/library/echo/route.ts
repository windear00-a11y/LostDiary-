import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { storyId, paragraphIndex } = await req.json();

    if (!storyId || paragraphIndex === undefined) {
      return NextResponse.json({ error: 'Story ID and paragraph index are required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attempt to insert (toggle logic: if it fails due to unique constraint, we delete it to "un-echo")
    const { error: insertError } = await supabase
      .from('library_echoes')
      .insert({
        story_id: storyId,
        user_id: user.id,
        paragraph_index: paragraphIndex
      });

    if (insertError) {
       if (insertError.code === '23505') {
          // It exists, so we "un-echo" (toggle off)
          const { error: deleteError } = await supabase
            .from('library_echoes')
            .delete()
            .eq('story_id', storyId)
            .eq('user_id', user.id)
            .eq('paragraph_index', paragraphIndex);
            
          if(deleteError) throw deleteError;
          return NextResponse.json({ success: true, action: 'removed' });
       }
       throw insertError;
    }

    return NextResponse.json({ success: true, action: 'added' });

  } catch (error: any) {
    console.error('Echo error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while processing the echo.' }, { status: 500 });
  }
}
