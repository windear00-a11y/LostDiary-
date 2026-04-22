import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
    const { bridgeId } = await req.json();
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: bridge } = await supabase.from('bridges').select('nudge_count').eq('id', bridgeId).single();
    
    // Increment nudge count
    const newCount = (bridge?.nudge_count || 0) + 1;
    await supabase.from('bridges').update({ nudge_count: newCount }).eq('id', bridgeId);

    // AI Dynamic Nudge
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let instructions = "";
    if (newCount === 1) instructions = "Poetic, gentle, first encounter vibe.";
    else if (newCount <= 3) instructions = "Patient, steady growth vibe.";
    else instructions = "Grounded, actionable coaching vibe, suggest they ask deeper questions to partner.";

    const prompt = `You are the WinDear Guardian. A user is checking if their connection is ready to graduate to 'Trusted Mode'.
    This is their ${newCount} attempt. 
    Instructions: ${instructions}. 
    Tone: Empathic, NOT repetitive, NEVER use rejection words.`;

    const response = await model.generateContent(prompt);
    
    return NextResponse.json({ message: response.text() });
}
