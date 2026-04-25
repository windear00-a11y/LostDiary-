import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const bridgeId = params.id;
    if (!bridgeId) return NextResponse.json({ error: 'Bridge ID required' }, { status: 400 });

    const cookieStore = cookies();
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: bridge, error: bridgeError } = await adminSupabase
      .from('bridges')
      .select('*, a:users!bridges_user_a_id_fkey(pen_name, pen_name_tag), b:users!bridges_user_b_id_fkey(pen_name, pen_name_tag)')
      .eq('id', bridgeId)
      .single();

    if (bridgeError || !bridge) return NextResponse.json({ error: 'Bridge not found' }, { status: 404 });
    if (bridge.user_a_id !== user.id && bridge.user_b_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { data: messages, error: messagesError } = await adminSupabase
      .from('bridge_messages')
      .select('*')
      .eq('bridge_id', bridgeId)
      .order('created_at', { ascending: true });

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
    if (bridge.status === 'pending') {
       const { data: plane } = await adminSupabase
         .from('paper_planes')
         .select('content, intent_type')
         .eq('story_id', bridge.origin_story_id)
         .eq('sender_id', bridge.user_a_id) // Assuming sender is user_a
         .eq('receiver_id', bridge.user_b_id) // Assuming receiver is user_b
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
           planeContent
        },
        messages: bridge.status === 'active' ? messages.map((m: any) => ({
           id: m.id,
           content: m.content,
           created_at: m.created_at,
           isMine: m.sender_id === user.id
        })) : []
    });

  } catch (error: any) {
    console.error('Bridge fetch error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
     const bridgeId = params.id;
     const { status } = await req.json();
     const cookieStore = cookies();
     const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
     );

     const { error } = await adminSupabase
       .from('bridges')
       .update({ status })
       .eq('id', bridgeId);
     
     if (error) throw error;
     return NextResponse.json({ success: true });
  } catch (error) {
     return NextResponse.json({ error: 'Failed to update bridge' }, { status: 500 });
  }
}
