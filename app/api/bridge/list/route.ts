import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('bridges')
    .select(`
      id, 
      mode,
      status,
      created_at, 
      updated_at,
      user_a:users!bridges_user_a_id_fkey(pen_name, pen_name_tag),
      user_b:users!bridges_user_b_id_fkey(pen_name, pen_name_tag)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq('status', 'active');

  if (error) {
    console.error('Fetch bridges error:', error);
    return NextResponse.json({ error: 'Failed to fetch bridges' }, { status: 500 });
  }

  // Format to identify 'other' user
  const formattedBridges = data.map((b: any) => {
    const isUserA = b.user_a_id === user.id; // Wait, we need the IDs to check
    // Actually, let's select IDs too
    return b;
  });

  // Re-selecting to include IDs for formatting
  const { data: dataWithIds } = await supabase
    .from('bridges')
    .select(`
      id, 
      user_a_id, 
      user_b_id,
      mode,
      status,
      created_at, 
      updated_at,
      user_a:users!bridges_user_a_id_fkey(pen_name, pen_name_tag),
      user_b:users!bridges_user_b_id_fkey(pen_name, pen_name_tag)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq('status', 'active');

  const finalBridges = (dataWithIds || []).map((b: any) => ({
    id: b.id,
    mode: b.mode,
    status: b.status,
    created_at: b.created_at,
    updated_at: b.updated_at,
    other: b.user_a_id === user.id ? b.user_b : b.user_a
  }));

  return NextResponse.json({ bridges: finalBridges });
}
