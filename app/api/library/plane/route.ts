import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { storyId, message } = await req.json();

    if (!storyId || !message) {
      return NextResponse.json({ error: 'Story ID and message are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
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

    // 1. Fetch story to find author_id (using service role to bypass restrictive RLS if needed, but lets try with authenticated client first if policy allows, wait, we need service role to get author_id because the library feed view might not expose it)
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
         cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: story, error: storyError } = await adminSupabase
      .from('library_stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.author_id === user.id) {
       return NextResponse.json({ error: 'You cannot send a plane to yourself' }, { status: 400 });
    }

    // 2. WinDear Quality / Safety Gate (AI Filter)
    const { generateContentWithFallback } = await import('@/lib/genai-utils');
    const prompt = `
      You are WinDear, an empathetic guardian AI. A user is attempting to send a "Paper Plane" message to an anonymous author of a journal entry.
      Analyze the following message. Is it empathetic, supportive, and completely free of toxicity, romance/flirting, harassment, or spam? We only allow messages that offer genuine resonance or a desire to hold space/help.
      Reply ONLY with the exact word "SAFE" if it passes, or "REJECT" if it fails.
      
      Message to analyze:
      "${message}"
    `;

    const response = await generateContentWithFallback({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.1 }
    });

    const aiVerdict = response.text?.trim().toUpperCase() || 'REJECT';

    if (aiVerdict !== 'SAFE') {
      // The filter caught it. We record it as burned.
      await adminSupabase.from('paper_planes').insert({
        sender_id: user.id,
        receiver_id: story.author_id,
        story_id: storyId,
        intent_type: 'bridge_request',
        content: message,
        status: 'burned'
      });
      return NextResponse.json({ 
        status: 'burned', 
        message: 'Your plane burned before it could arrive. WinDear ensures only pure, supportive intentions pass through.' 
      }, { status: 400 });
    }

    // 3. Send securely
    const { error: insertError } = await adminSupabase.from('paper_planes').insert({
      sender_id: user.id,
      receiver_id: story.author_id,
      story_id: storyId,
      intent_type: 'bridge_request',
      content: message,
      status: 'delivered'
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: 'Failed to deliver your plane' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: 'delivered' });

  } catch (error: any) {
    console.error('Paper plane error:', error);
    return NextResponse.json({ error: 'An unexpected current caught your plane.' }, { status: 500 });
  }
}
