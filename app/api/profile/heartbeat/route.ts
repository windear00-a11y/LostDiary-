/**
 * Fetches the "Heartbeat" dashboard data for an author.
 * Aggregates resonance data (echoes, energy, views) without just showing raw numbers.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    
    // Auth Check
    const authSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Aggregated Fetch: Stories, Views, Reactions (Energy), Echoes
    const { data: stories, error } = await supabase
      .from('library_stories')
      .select(`
        id, 
        title, 
        views_count,
        likes_count,
        library_reactions(*),
        library_echoes(*),
        inspired_by_story_id,
        paper_planes(id, content, sender:users!paper_planes_sender_id_fkey(pen_name, pen_name_tag))
      `)
      .eq('author_id', user.id);

    if (error) throw error;

    return NextResponse.json({ heartbeat: stories });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
