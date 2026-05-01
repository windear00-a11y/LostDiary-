import { NextResponse } from "next/server";
import { getAuthenticatedUserOrError } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { user, supabase, response } = await getAuthenticatedUserOrError();
    if (response) return response;

    const body = await req;
    const json = await body.json();
    
    const { 
      category, 
      description, 
      expected_behavior, 
      screenshot_url, 
      metadata 
    } = json;

    if (!category || !description) {
      return NextResponse.json(
        { error: "category and description are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_reports")
      .insert([
        {
          user_id: user.id,
          category,
          description,
          expected_behavior,
          screenshot_url,
          metadata: metadata || {},
        }
      ]);

    if (error) {
      console.error("Failed to log user report to DB:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error in report telemetry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
