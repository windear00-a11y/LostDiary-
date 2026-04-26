import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { storyId } = await req.json();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Toggle: if exists delete, else add
    const { data: existing } = await supabase
      .from('user_treasury')
      .select('id')
      .eq('user_id', user.id)
      .eq('story_id', storyId)
      .single();

    if (existing) {
        await supabase.from('user_treasury').delete().eq('id', existing.id);
        return NextResponse.json({ success: true, action: 'removed' });
    } else {
        await supabase.from('user_treasury').insert({ user_id: user.id, story_id: storyId });
        return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update treasury' }, { status: 500 });
  }
}
