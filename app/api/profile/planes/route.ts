import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since paper planes anonymous, we use service role to join and fetch sender details safely
    const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
           cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
        }
    );

    const { data: planes, error } = await adminSupabase
      .from('paper_planes')
      .select(`
        id,
        content,
        created_at,
        status,
        story_id,
        sender:users!paper_planes_sender_id_fkey(pen_name, pen_name_tag),
        story:library_stories(title)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ planes });

  } catch (error: any) {
    console.error('Inbox planes error:', error);
    return NextResponse.json({ error: 'Failed to find paper planes' }, { status: 500 });
  }
}
