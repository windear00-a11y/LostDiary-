import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { user_id, entry_id } = await req.json();

    if (!user_id || !entry_id) {
      return NextResponse.json(
        { error: "Missing user_id or entry_id" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch entry and profile
    const [{ data: entry }, { data: profile }] = await Promise.all([
      supabase.from("diary_entries").select("*").eq("id", entry_id).single(),
      supabase.from("users").select("personality_summary").eq("id", user_id).single(),
    ]);

    if (!entry) throw new Error("Entry not found");

    // 2. Fetch context
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
    
    // 3. Trigger Orchestrator
    const orchestrator = new AIOrchestrator(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      profile?.personality_summary,
    );

    const pipelineOutput = await orchestrator.processInteraction(
      {
        userId: user_id,
        message: { role: "user", type: "text", content: entry.content },
        contextMessages: [],
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
        recentEvents: recentEvents || [],
        contextChapters: contextChapters,
      },
      { isJournal: true },
    );

    // 4. Save extracted event if applicable
    if (pipelineOutput.extractedEvent) {
      await supabase.from("life_events").insert({
        user_id,
        diary_entry_id: entry_id,
        ...pipelineOutput.extractedEvent,
        created_at: new Date().toISOString(),
      });
    }

    // 5. Save Chapter if applicable
    if (pipelineOutput.narrativeUpdate?.narrative) {
      await supabase.from("chapters").insert({
        user_id,
        volume_id: currentVolume?.id,
        name: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
        narrative: pipelineOutput.narrativeUpdate.narrative,
        created_at: new Date().toISOString(),
      });
      
      // Update entry status
      await supabase.from("diary_entries").update({ 
        processing_status: 'woven',
        updated_at: new Date().toISOString()
      }).eq('id', entry_id);
    }

    return NextResponse.json({ success: true, woven: !!pipelineOutput.narrativeUpdate });
  } catch (error: any) {
    console.error("Error in journal weave route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
