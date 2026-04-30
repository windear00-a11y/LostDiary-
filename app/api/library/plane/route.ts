import { NextResponse } from "next/server";
import { validateMessageSafety } from "@/lib/utils/safety";
import {
  getAuthenticatedUserOrError,
  getAdminSupabaseClient,
} from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { storyId, message } = await req.json();

    if (!storyId || !message) {
      return NextResponse.json(
        { error: "Story ID and message are required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch story to find author_id (using service role to bypass restrictive RLS if needed)
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const { data: story, error: storyError } = await adminSupabase
      .from("library_stories")
      .select("author_id")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.author_id === user.id) {
      return NextResponse.json(
        { error: "You cannot send a plane to yourself" },
        { status: 400 },
      );
    }

    // 2. WinDear Quality / Safety Gate (AI Filter)
    const isSafe = await validateMessageSafety(message, "plane");

    if (!isSafe) {
      // The filter caught it. We record it as burned.
      await adminSupabase.from("paper_planes").insert({
        sender_id: user.id,
        receiver_id: story.author_id,
        story_id: storyId,
        intent_type: "bridge_request",
        content: message,
        status: "burned",
      });
      return NextResponse.json(
        {
          status: "burned",
          message:
            "Your plane burned before it could arrive. WinDear ensures only pure, supportive intentions pass through.",
        },
        { status: 400 },
      );
    }

    // 3. Send securely
    const { error: insertError } = await adminSupabase
      .from("paper_planes")
      .insert({
        sender_id: user.id,
        receiver_id: story.author_id,
        story_id: storyId,
        intent_type: "bridge_request",
        content: message,
        status: "delivered",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to deliver your plane" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, status: "delivered" });
  } catch (error: any) {
    console.error("Paper plane error:", error);
    return NextResponse.json(
      { error: "An unexpected current caught your plane." },
      { status: 500 },
    );
  }
}
