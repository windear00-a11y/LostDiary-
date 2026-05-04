import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const { user, supabase, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    // Export Data payload
    const exportData: any = {
      user: {
        id: user.id,
        email: user.email,
        exported_at: new Date().toISOString(),
      },
      vault: {},
    };

    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    exportData.vault.profile = profile || {};

    // 2. Fetch Chat Sessions & Messages
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id);
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id);

    exportData.vault.chronicles = {
      sessions: sessions || [],
      messages: messages || [],
    };

    // 3. Fetch Signals & Patterns
    const { data: signals } = await supabase
      .from("extracted_signals")
      .select("*")
      .eq("user_id", user.id);
    const { data: patterns } = await supabase
      .from("behavior_patterns")
      .select("*")
      .eq("user_id", user.id);
    const { data: insights } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id);

    // Purpose Layer
    const { data: core_values } = await supabase.from("core_values").select("*").eq("user_id", user.id);
    const { data: energy_maps } = await supabase.from("energy_maps").select("*").eq("user_id", user.id);
    const { data: direction_insights } = await supabase.from("direction_insights").select("*").eq("user_id", user.id);

    exportData.vault.awareness_engine = {
      signals: signals || [],
      patterns: patterns || [],
      insights: insights || []
    };

    exportData.vault.purpose_layer = {
      core_values: core_values || [],
      energy_maps: energy_maps || [],
      direction_insights: direction_insights || [],
    };

    // Return as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="windear-vault-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Export Error: ", error);
    return NextResponse.json(
      { error: "Failed to generate export file. Sanctuary is intact." },
      { status: 500 },
    );
  }
}

