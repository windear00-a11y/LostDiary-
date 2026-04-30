import { NextResponse } from "next/server";
import { updateStoryEmotion } from "@/lib/services/emotion-service";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { storyId, paragraphIndex } = await req.json();

    if (!storyId || paragraphIndex === undefined) {
      return NextResponse.json(
        { error: "Story ID and paragraph index are required" },
        { status: 400 },
      );
    }

    const supabase = await getAdminSupabaseClient();
  } catch (error: any) {
    console.error("Echo error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the echo." },
      { status: 500 },
    );
  }
}
