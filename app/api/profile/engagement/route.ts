import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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

  try {
    // 1. Fetch user's stories to aggregate resonances and content
    const { data: userStories } = await supabase
      .from('library_stories')
      .select('id, echoes, ahsas, likes_count, title, story_content')
      .eq('author_id', user.id);

    const storyIds = userStories?.map(s => s.id) || [];

    // 1b. Fetch Energy Jar Breakdown
    const { data: reactions } = await supabase
      .from('library_reactions')
      .select('reaction_type')
      .in('story_id', storyIds);

    const energyJar = {
      hope: reactions?.filter(r => r.reaction_type === 'hope').length || 0,
      tear: reactions?.filter(r => r.reaction_type === 'tear').length || 0,
      resonance: reactions?.filter(r => r.reaction_type === 'resonance').length || 0
    };
    
    const totalLikes = (energyJar.hope + energyJar.tear + energyJar.resonance) || 
                       userStories?.reduce((acc, story) => acc + (story.likes_count || 0), 0) || 0;
    
    // Aggregate Top Resonances (Luminous Lines)
    let totalResonances = 0;
    const shiningMoments: { text: string, count: number, storyTitle: string }[] = [];

    userStories?.forEach(story => {
      const echoes = (story as any).ahsas || (story as any).echoes;
      if (echoes && Array.isArray(echoes)) {
        const paragraphs = story.story_content.split('\n').filter(p => p.trim());
        echoes.forEach((echo: any) => {
          totalResonances += (echo.count || 0);
          if (echo.count > 0 && paragraphs[echo.paragraph_index]) {
            shiningMoments.push({
              text: paragraphs[echo.paragraph_index].trim(),
              count: echo.count,
              storyTitle: story.title
            });
          }
        });
      }
    });

    // Sort by resonance count
    shiningMoments.sort((a, b) => b.count - a.count);

    // 2. Fetch Paper Planes received
    const { count: planeCount } = await supabase
      .from('paper_planes')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id);

    // 3. Fetch Active Bridges
    const { count: bridgeCount } = await supabase
      .from('bridges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    // 4. Fetch Spin Threads (Inspired by your stories)
    const { count: threadCount } = await supabase
        .from('library_stories')
        .select('*', { count: 'exact', head: true })
        .not('inspired_by_story_id', 'is', null)
        .in('inspired_by_story_id', userStories?.map(s => s.id) || []);

    return NextResponse.json({
      metrics: {
        luminous_lines: totalLikes,
        resonances: totalResonances,
        paper_planes: planeCount || 0,
        active_bridges: bridgeCount || 0,
        spin_threads: threadCount || 0,
        energy_jar: energyJar,
        shining_moments: shiningMoments.slice(0, 10) // Top 10 moments
      }
    });
  } catch (error) {
    console.error('Engagement API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
