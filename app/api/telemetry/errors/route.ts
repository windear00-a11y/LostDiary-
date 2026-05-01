import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { 
      error_message, 
      error_stack, 
      route, 
      user_agent, 
      metadata, 
      user_id 
    } = body;

    if (!error_message) {
      return NextResponse.json(
        { error: "error_message is required" },
        { status: 400 }
      );
    }

    // Prepare payload
    const payload: any = {
      error_message,
      error_stack,
      route,
      user_agent,
      metadata: metadata || {},
    };

    if (user_id) {
      payload.user_id = user_id;
    }

    const { error } = await supabase
      .from("system_errors")
      .insert([payload]);

    if (error) {
      console.error("Failed to log system error to DB:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error in error telemetry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
