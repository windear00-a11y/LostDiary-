/**
 * Dedicated API route for the Bridge (Anonymous chat)
 * Handles safety via AI filtering before inserting into DB.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { message } = await req.json();
    const bridgeId = params.id;

    if (!bridgeId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    // 1. Verify Bridge State
    const { data: bridge, error: bridgeError } = await adminSupabase
      .from('bridges')
      .select('status, user_a_id, user_b_id')
      .eq('id', bridgeId)
      .single();

    if (bridgeError || !bridge) return NextResponse.json({ error: 'Bridge not found' }, { status: 404 });
    if (bridge.status === 'broken') return NextResponse.json({ error: 'This bridge has been broken.' }, { status: 403 });
    if (bridge.user_a_id !== user.id && bridge.user_b_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // 2. WinDear Quality / Safety Gate (AI Filter)
    const { generateContentWithFallback } = await import('@/lib/genai-utils');
    const prompt = `
      You are WinDear, an empathetic silent guardian monitoring an anonymous emotional support chat ("The Bridge").
      Analyze the following message.
      Reject it with "REJECT" if it contains: toxicity, abuse, sexual advances, attempts to extract personally identifiable information (PII / location / real name), spam, or severe hostility.
      Otherwise, reply with "SAFE".
      Message: "${message}"
    `;

    const response = await generateContentWithFallback({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.1 }
    });

    const aiVerdict = response.text?.trim().toUpperCase() || 'REJECT';

    if (aiVerdict !== 'SAFE') {
       // Burn the bridge
       await adminSupabase.from('bridges').update({ status: 'broken' }).eq('id', bridgeId);
       return NextResponse.json({ 
         status: 'broken', 
         message: 'The Guardian intervened. A safety rule was violated and the bridge has been permanently dismantled.' 
       }, { status: 403 });
    }

    // 3. Insert Message
    const { error: insertError } = await adminSupabase
       .from('bridge_messages')
       .insert({
           bridge_id: bridgeId,
           sender_id: user.id,
           content: message
       });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Bridge processing error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
