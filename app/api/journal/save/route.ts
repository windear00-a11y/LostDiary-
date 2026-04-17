import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AIOrchestrator } from '@/ai-core/ai-orchestrator';
import { authService } from '@/lib/services/auth-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { content, user_id } = await req.json();

    if (!content || !user_id) {
      return NextResponse.json({ error: 'Missing content or user_id' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 0. Fetch user profile for context
    const { data: profile } = await supabase
      .from('users')
      .select('personality_summary')
      .eq('id', user_id)
      .single();

    // 1. Save the raw diary entry
    const { data: entry, error: entryError } = await supabase
      .from('diary_entries')
      .insert({
        user_id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // 2. Trigger the AI Pipeline for LifeBook integration
    // We treat the journal entry as a high-importance interaction
    const orchestrator = new AIOrchestrator(process.env.NEXT_PUBLIC_GEMINI_API_KEY!, profile?.personality_summary);
    
    // Fetch some context (recent events) to help with narrative weaving
    const { data: recentEvents } = await supabase
      .from('life_events')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const pipelineOutput = await orchestrator.processInteraction({
      userId: user_id,
      message: { role: 'user', type: 'text', content },
      contextMessages: [], // No chat context for raw journal
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      recentEvents: recentEvents || []
    }, { isJournal: true });

    // 3. Save extracted event if applicable
    if (pipelineOutput.extractedEvent) {
      await supabase.from('life_events').insert({
        user_id,
        ...pipelineOutput.extractedEvent,
        created_at: new Date().toISOString()
      });
    }

    // 4. Update Identity & Memory
    if (pipelineOutput.personaUpdate) {
      await supabase
        .from('users')
        .update({ personality_summary: pipelineOutput.personaUpdate })
        .eq('id', user_id);
    }

    if (pipelineOutput.narrativeUpdate) {
      await supabase
        .from('users')
        .update({ bio: pipelineOutput.narrativeUpdate.summary })
        .eq('id', user_id);
    }

    // 5. Check if we should trigger a new LifeBook chapter
    if (pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative) {
      // In a real scenario, we might collect events, but here we can directly
      // update or create a chapter if the narrative is rich enough.
      await supabase.from('chapters').insert({
        user_id,
        title: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
        content: pipelineOutput.narrativeUpdate.narrative,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error('Error in journal save route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
