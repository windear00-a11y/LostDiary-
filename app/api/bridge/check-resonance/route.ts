import { NextResponse } from "next/server";
import {
  getAuthenticatedUserOrError,
  getAdminSupabaseClient,
} from "@/lib/supabase-server";

const NUDGES = {
  first: [
    "A quiet moment of validation. Take your time.",
    "Bridges are built one gentle word at a time.",
    "The universe brought you two here. Let it unfold naturally.",
  ],
  early: [
    "Patience is the foundation of trust.",
    "A slow, steady connection often lasts the longest.",
    "You are doing well. Consistency builds safety.",
  ],
  later: [
    "Consider asking them a deeper question when the moment feels right.",
    "You've built a strong foundation. What matters to them?",
    "If it feels right, gently share what brought you to this bridge.",
  ],
};

function getRandomNudge(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: Request) {
  const { bridgeId } = await req.json();
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: bridge } = await supabase
    .from("bridges")
    .select("nudge_count")
    .eq("id", bridgeId)
    .single();

  // Increment nudge count
  const newCount = (bridge?.nudge_count || 0) + 1;
  await supabase
    .from("bridges")
    .update({ nudge_count: newCount })
    .eq("id", bridgeId);

  // AI Dynamic Nudge replaced with local heuristic arrays
  let message = "";
  if (newCount === 1) message = getRandomNudge(NUDGES.first);
  else if (newCount <= 3) message = getRandomNudge(NUDGES.early);
  else message = getRandomNudge(NUDGES.later);

  return NextResponse.json({ message });
}
