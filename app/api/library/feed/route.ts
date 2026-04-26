import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor'); // Timestamp pagination

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

    let query = supabase
      .from('library_stories')
      .select('id, title, story_content, pen_name, pen_name_tag, dominant_emotion, likes_count, created_at, inspired_by_story_id, library_echoes(paragraph_index, user_id)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: libraryStoriesRaw, error } = await query;

    if (error) {
      throw error;
    }

    // Process echoes grouping
    const stories = libraryStoriesRaw.map(story => {
       const echoMap = new Map<number, number>();
       
       if (story.library_echoes) {
          story.library_echoes.forEach((e: any) => {
             echoMap.set(e.paragraph_index, (echoMap.get(e.paragraph_index) || 0) + 1);
          });
       }

       return {
          ...story,
          // We don't expose individual user IDs doing the echo
          library_echoes: undefined, 
          echoes: Array.from(echoMap.entries()).map(([k, v]) => ({ paragraph_index: k, count: v }))
       };
    });

    return NextResponse.json({ stories });
  } catch (error: any) {
    console.error('Library feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch the global library feed' }, { status: 500 });
  }
}
