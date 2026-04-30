import { NextResponse } from "next/server";
import {
  getAuthenticatedUserOrError,
  getAdminSupabaseClient,
} from "@/lib/supabase-server";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const bridgeId = params.id;
    if (!bridgeId)
      return NextResponse.json(
        { error: "Bridge ID required" },
        { status: 400 },
      );

    const { user, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    const adminSupabase = await getAdminSupabaseClient();

    const { data: bridge, error: bridgeError } = await adminSupabase
      .from("bridges")
      .select(
        "*, a:users!bridges_user_a_id_fkey(pen_name, pen_name_tag), b:users!bridges_user_b_id_fkey(pen_name, pen_name_tag)",
      )
      .eq("id", bridgeId)
      .single();

    if (bridgeError || !bridge)
      return NextResponse.json({ error: "Bridge not found" }, { status: 404 });
    if (bridge.user_a_id !== user.id && bridge.user_b_id !== user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data: messages, error: messagesError } = await adminSupabase
      .from("bridge_messages")
      .select("*")
      .eq("bridge_id", bridgeId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // Mask the other user's identity based on who is asking
    let me, other;
    if (bridge.user_a_id === user.id) {
      me = bridge.a;
      other = bridge.b;
    } else {
      me = bridge.b;
      other = bridge.a;
    }

    let planeContent = null;
    if (bridge.status === "pending") {
      const { data: plane } = await adminSupabase
        .from("paper_planes")
        .select("content, intent_type")
        .eq("story_id", bridge.origin_story_id)
        .eq("sender_id", bridge.user_a_id) // Assuming sender is user_a
        .eq("receiver_id", bridge.user_b_id) // Assuming receiver is user_b
        .single();
      planeContent = plane?.content;
    }

    return NextResponse.json({
      bridge: {
        id: bridge.id,
        status: bridge.status,
        created_at: bridge.created_at,
        me,
        other,
        planeContent,
      },
      messages:
        bridge.status === "active"
          ? messages.map((m: any) => ({
              id: m.id,
              content: m.content,
              created_at: m.created_at,
              isMine: m.sender_id === user.id,
            }))
          : [],
    });
  } catch (error: any) {
    console.error("Bridge fetch error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const bridgeId = params.id;
    const { status } = await req.json();

    const { user, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    const adminSupabase = await getAdminSupabaseClient();

    // Verify ownership before breaking the bridge
    const { data: bridge } = await adminSupabase
      .from("bridges")
      .select("user_a_id, user_b_id")
      .eq("id", bridgeId)
      .single();
    if (
      !bridge ||
      (bridge.user_a_id !== user.id && bridge.user_b_id !== user.id)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await adminSupabase
      .from("bridges")
      .update({ status })
      .eq("id", bridgeId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update bridge" },
      { status: 500 },
    );
  }
}
