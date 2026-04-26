import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for elevated access or simple insert without strict RLS hurdles around complex joins for now, but auth must be validated
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    // Get true authenticated user via standard supabase client (not service role initially, just to verify session)
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    const { data: { user } } = await authSupabase.auth.getUser();
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
      return NextResponse.json({ error: 'Chapter not found or you do not own it' }, { status: 404 });
    }

    // 1.5. NEW: Apply Sealing/Generalization Logic
    const { sealedTitle, sealedContent } = await req.json(); // Optionally pass from preview
    let finalTitle = sealedTitle || chapter.title;
    let finalContent = sealedContent || chapter.content;

    // If not passed from preview, we auto-seal it to be safe
    if (!sealedContent) {
      const { sealAndGeneralizeStory } = await import('@/ai-core/library-engine');
      const sealingResult = await sealAndGeneralizeStory(finalTitle, finalContent);
      if (sealingResult) {
        finalTitle = sealingResult.title;
        finalContent = sealingResult.content;
      }
    }

    // AI classify emotion
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Analyze this story content and classify it into one of these emotions: hope, tear, resonance, reflective, courage, calm. Return only the emotion word. Content: ${chapter.content.substring(0, 500)}`
    });
    const emotion = (result.text || '').trim().toLowerCase() || 'reflective';

    // 2. Fetch User Profile for Pen Name
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('pen_name, pen_name_tag')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.pen_name || !profile.pen_name_tag) {
      return NextResponse.json({ error: 'Please set a Pen Name in your Mirror profile before publishing.' }, { status: 400 });
    }

    // 3. Insert into library
    const { data: libraryStory, error: insertError } = await supabase
      .from('library_stories')
      .insert({
        author_id: user.id,
        chapter_id: chapter.id,
        title: finalTitle,
        story_content: finalContent,
        pen_name: profile.pen_name,
        pen_name_tag: profile.pen_name_tag,
        inspired_by_story_id: chapter.inspired_by_story_id || null,
        dominant_emotion: emotion,
        emotion_scores: {
          hope: emotion === 'hope' ? 1 : 0,
          tear: emotion === 'tear' ? 1 : 0,
          resonance: emotion === 'resonance' ? 1 : 0,
          reflective: emotion === 'reflective' ? 1 : 0,
          courage: emotion === 'courage' ? 1 : 0,
          calm: emotion === 'calm' ? 1 : 0
        }
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // unique violation
         return NextResponse.json({ error: 'This chapter has already been published to the library.' }, { status: 400 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true, story: libraryStory });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Failed to publish story to the Global Library' }, { status: 500 });
  }
}
