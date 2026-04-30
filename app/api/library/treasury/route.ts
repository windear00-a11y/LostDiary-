import { NextResponse } from "next/server";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { storyId } = await req.json();
    const { user, supabase, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    // Toggle: if exists delete, else add
    const { data: existing } = await supabase
      .from("user_treasury")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .single();

    if (existing) {
      await supabase.from("user_treasury").delete().eq("id", existing.id);
      return NextResponse.json({ success: true, action: "removed" });
    } else {
      await supabase
        .from("user_treasury")
        .insert({ user_id: user.id, story_id: storyId });
      return NextResponse.json({ success: true, action: "added" });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update treasury" },
      { status: 500 },
    );
  }
}
