import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
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
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to export data.' }, { status: 401 });
    }

    // Export Data payload
    const exportData: any = {
      user: {
        id: user.id,
        email: user.email,
        exported_at: new Date().toISOString()
      },
      vault: {}
    };

    // 1. Fetch Profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    exportData.vault.profile = profile || {};

    // 2. Fetch Chat Sessions & Messages
    const { data: sessions } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id);
    const { data: messages } = await supabase.from('chat_messages').select('*').eq('user_id', user.id);
    
    exportData.vault.chat_history = {
        sessions: sessions || [],
        messages: messages || []
    };

    // 3. Fetch Chapters & Volumes
    const { data: volumes } = await supabase.from('volumes').select('*').eq('user_id', user.id);
    const { data: chapters } = await supabase.from('chapters').select('*').eq('user_id', user.id);

    exportData.vault.story = {
        volumes: volumes || [],
        chapters: chapters || []
    };

    // 4. Fetch Connections (Bridges)
    const { data: bridges } = await supabase.from('bridges').select('*').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
    exportData.vault.connections = bridges || [];

    // Return as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="windear-vault-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Export Error: ", error);
    return NextResponse.json({ error: 'Failed to generate export file. Sanctuary is intact.' }, { status: 500 });
  }
}
