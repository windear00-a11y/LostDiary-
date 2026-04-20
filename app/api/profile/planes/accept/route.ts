import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { planeId } = await req.json();
    if (!planeId) return NextResponse.json({ error: 'Plane ID required' }, { status: 400 });

    const cookieStore = cookies();
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
         cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
      }
    );

    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
      }
    );
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Verify plane belongs to user
    const { data: plane, error: planeError } = await adminSupabase
      .from('paper_planes')
      .select('*')
      .eq('id', planeId)
      .eq('receiver_id', user.id)
      .single();

    if (planeError || !plane) return NextResponse.json({ error: 'Plane not found' }, { status: 404 });

    // 2. Update plane status
    await adminSupabase.from('paper_planes').update({ status: 'accepted' }).eq('id', planeId);

    // 3. Create Bridge
    const { data: bridge, error: bridgeError } = await adminSupabase
      .from('bridges')
      .insert({
         user_a_id: plane.sender_id,
         user_b_id: plane.receiver_id,
         origin_story_id: plane.story_id,
         status: 'active'
      })
      .select()
      .single();

    if (bridgeError) throw bridgeError;

    return NextResponse.json({ success: true, bridgeId: bridge.id });

  } catch (error: any) {
    console.error('Accept plane error:', error);
    return NextResponse.json({ error: 'Failed to build the bridge' }, { status: 500 });
  }
}
