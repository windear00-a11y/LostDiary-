import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { user_id, session_id } = await req.json();

    if (!user_id || !session_id) {
      return NextResponse.json(
        { error: "Missing user_id or session_id" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch session and profile
    const [{ data: session }, { data: profile }] = await Promise.all([
      supabase.from("chat_sessions").select("*").eq("id", session_id).single(),
      supabase.from("users").select("personality_summary").eq("id", user_id).single(),
    ]);

    if (!session) throw new Error("Session not found");

    // 2. Fetch recent messages in session
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("content, role")
      .eq("session_id", session_id)
      .eq("role", "user")
      .order("created_at", { ascending: true });

    if (!messages || messages.length === 0) throw new Error("No user messages in session");

    const combinedContent = messages.map(m => m.content).join("\n");

    // 3. Fetch context
    const [
      { data: recentEvents },
      { data: contextChaptersData },
      { data: currentVolume },
    ] = await Promise.all([
      supabase
        .from("life_events")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("chapters")
        .select("narrative")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("volumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "ongoing")
        .maybeSingle(),
    ]);

    const contextChapters = contextChaptersData?.map((c) => c.narrative) || [];
    
    // 4. Trigger Orchestrator
    const orchestrator = new AIOrchestrator(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      profile?.personality_summary,
    );

    const pipelineOutput = await orchestrator.processInteraction(
      {
        userId: user_id,
        message: { role: "user", type: "text", content: combinedContent },
        contextMessages: [],
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
        recentEvents: recentEvents || [],
        contextChapters: contextChapters,
      },
      { isJournal: false },
    );

    // 5. Save extracted event if applicable
    if (pipelineOutput.extractedEvent) {
      await supabase.from("life_events").insert({
        user_id,
        message_id: null, // We should ideally map this to the last message of session? 
        summary: pipelineOutput.extractedEvent.summary,
        emotion: pipelineOutput.extractedEvent.emotion,
        event_score: pipelineOutput.extractedEvent.score || 5,
        created_at: new Date().toISOString(),
      });
    }

    // 6. Save Chapter if applicable
    if (pipelineOutput.narrativeUpdate?.narrative) {
      await supabase.from("chapters").insert({
        user_id,
        volume_id: currentVolume?.id,
        name: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
        narrative: pipelineOutput.narrativeUpdate.narrative,
        created_at: new Date().toISOString(),
      });
      
      // Update session status
      await supabase.from("chat_sessions").update({ 
        processing_status: 'woven',
        updated_at: new Date().toISOString()
      }).eq('id', session_id);
    }

    return NextResponse.json({ success: true, woven: !!pipelineOutput.narrativeUpdate });
  } catch (error: any) {
    console.error("Error in chat weave route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
