import { NextResponse } from "next/server";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { storyId, paragraphIndex } = await req.json();
    const { user, supabase, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    const { error } = await supabase.from("library_anchors").upsert(
      {
        user_id: user.id,
        story_id: storyId,
        paragraph_index: paragraphIndex,
      },
      { onConflict: "user_id, story_id" },
    );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to drop anchor" },
      { status: 500 },
    );
  }
}
