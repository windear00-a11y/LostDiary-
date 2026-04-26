import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sealAndGeneralizeStory } from '@/ai-core/library-engine';

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
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

    // 1. Fetch chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('user_id', user.id)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // 2. Perform Sealing
    const sealingResult = await sealAndGeneralizeStory(chapter.title, chapter.content);

    if (!sealingResult) {
      return NextResponse.json({ error: 'Failed to generate privacy seal' }, { status: 500 });
    }

    return NextResponse.json(sealingResult);
  } catch (error: any) {
    console.error('Sealing Preview error:', error);
    return NextResponse.json({ error: 'Failed to preview sealed story' }, { status: 500 });
  }
}
