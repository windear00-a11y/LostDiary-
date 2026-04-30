import { NextResponse } from "next/server";
import { updateStoryEmotion } from "@/lib/services/emotion-service";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { storyId, reactionType } = await req.json();

    if (!storyId || !reactionType) {
      return NextResponse.json(
        { error: "Story ID and reaction type are required" },
        { status: 400 },
      );
    }

    const supabase = await getAdminSupabaseClient();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Energy Jar error:", error);
    return NextResponse.json(
      { error: "An unexpected current caught your energy." },
      { status: 500 },
    );
  }
}
