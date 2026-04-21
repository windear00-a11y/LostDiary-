import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { bridgeId, content } = await req.json();
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch bridge mode
    const { data: bridge } = await supabase.from('bridges').select('mode').eq('id', bridgeId).single();
    
    // AI Safety Guard: Check toxicity based on bridge mode
    if (bridge?.mode === 'protected') {
        // Strict Check: Toxin + PII
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const safetyCheck = await model.generateContent(`Analyze this message for toxicity AND PII (personal info, real identity). Return 'SAFE' or 'UNSAFE'. Message: "${content}"`);
        if (safetyCheck.text().trim() !== 'SAFE') return NextResponse.json({ error: 'Message flagged for safety.' }, { status: 400 });
    } else if (bridge?.mode === 'trusted') {
        // Light Check: Only Toxin (PII allowed as they are trusted)
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const safetyCheck = await model.generateContent(`Analyze this message ONLY for toxicity/harassment. Ignore PII. Return 'SAFE' or 'UNSAFE'. Message: "${content}"`);
        if (safetyCheck.text().trim() !== 'SAFE') return NextResponse.json({ error: 'Message flagged for toxicity.' }, { status: 400 });
    }
    // If 'raw', no check

    // Insert message
    const { error } = await supabase
      .from('bridge_messages')
      .insert({ bridge_id: bridgeId, sender_id: user.id, content, is_safe: true });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
