/**
 * Fetches the "Heartbeat" dashboard data for an author.
 * Aggregates resonance data (echoes, energy, views) without just showing raw numbers.
 */
import { NextResponse } from "next/server";
import {
  getAuthenticatedUserOrError,
  getAdminSupabaseClient,
} from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const supabase = await getAdminSupabaseClient();

    // Aggregated Fetch: Stories, Views, Reactions (Energy), Echoes
    const { data: stories, error } = await supabase
      .from("library_stories")
      .select(
        `
        id, 
        title, 
        views_count,
        likes_count,
        library_reactions(*),
        library_echoes(*),
        inspired_by_story_id,
        paper_planes(id, content, sender:users!paper_planes_sender_id_fkey(pen_name, pen_name_tag))
      `,
      )
      .eq("author_id", user.id);

    if (error) throw error;

    return NextResponse.json({ heartbeat: stories });
  } catch (error: any) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
