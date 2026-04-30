import { NextResponse } from "next/server";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const supabase = await getAdminSupabaseClient();

    if (error) {
      throw error;
    }

    return NextResponse.json({ planes });
  } catch (error: any) {
    console.error("Inbox planes error:", error);
    return NextResponse.json(
      { error: "Failed to find paper planes" },
      { status: 500 },
    );
  }
}
