import { NextResponse } from "next/server";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const { user, supabase, response } = await getAuthenticatedUserOrError();
  if (response) return response;

  const { data, error } = await supabase
    .from("bridge_messages")
    .select("id, content, sender_id, created_at")
    .eq("bridge_id", params.id)
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  return NextResponse.json({ messages: data });
}
