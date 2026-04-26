import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AIOrchestrator } from '@/ai-core/ai-orchestrator';
import { extractIntelligenceProfile } from '@/ai-core/intelligence-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { content, user_id, metadata } = await req.json();

    if (!content || !user_id) {
      return NextResponse.json({ error: 'Missing content or user_id' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 0. Fetch user profile for context, including the intelligence profile seed
    const { data: profile } = await supabase
      .from('users')
      .select('personality_summary, intelligence_profile')
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
    const orchestrator = new AIOrchestrator(process.env.NEXT_PUBLIC_GEMINI_API_KEY!, profile?.personality_summary);
    
    const [{ data: recentEvents }, { data: contextChaptersData }, { data: currentVolume }] = await Promise.all([
      supabase.from('life_events').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10),
      supabase.from('chapters').select('narrative').eq('user_id', user_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('volumes').select('*').eq('user_id', user_id).eq('status', 'ongoing').maybeSingle()
    ]);

    const contextChapters = contextChaptersData?.map(c => c.narrative) || [];
    let activeVolume = currentVolume;

    if (!activeVolume) {
       const { data: lastVol } = await supabase.from('volumes').select('volume_number').eq('user_id', user_id).order('volume_number', { ascending: false }).limit(1).maybeSingle();
       const nextNum = (lastVol?.volume_number || 0) + 1;
       const { data: newVol } = await supabase.from('volumes').insert({
         user_id, volume_number: nextNum, title: 'The Silent Beginning', status: 'ongoing'
       }).select().single();
       activeVolume = newVol;
    }

    // 2.2 Parallelize legacy extraction and deep structured intelligence profile extraction
    const currentIntelProfile = profile?.intelligence_profile || {
      basic_profile: {}, thinking_style: {}, emotional_state: {},
      interests_goals: {}, behavior_patterns: {}, communication_style: {},
      sensitive_insights: {}, source_weights: { chat: 0.3, diary: 0.7 }
    };

    const [pipelineOutput, updatedIntelProfile] = await Promise.all([
      orchestrator.processInteraction({
        userId: user_id,
        message: { role: 'user', type: 'text', content },
        contextMessages: [], 
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
        recentEvents: recentEvents || [],
        contextChapters: contextChapters
      }, { isJournal: true }),
      extractIntelligenceProfile('diary', content, currentIntelProfile as any)
    ]);

    // 3. Save extracted event if applicable
    if (pipelineOutput.extractedEvent) {
      await supabase.from('life_events').insert({
        user_id,
        ...pipelineOutput.extractedEvent,
        created_at: new Date().toISOString()
      });
    }

    // 4. Update Identity & Memory (Including the new Deep JSON profile)
    await supabase
      .from('users')
      .update({ 
        personality_summary: pipelineOutput.personaUpdate || profile?.personality_summary,
        bio: pipelineOutput.narrativeUpdate ? pipelineOutput.narrativeUpdate.summary : undefined,
        intelligence_profile: updatedIntelProfile
      })
      .eq('id', user_id);

    // 5. Check if we should trigger a new LifeBook chapter
    let processingStatus: 'woven' | 'saved' | 'observed' = 'observed';
    let impactPercentage = 5 + Math.floor(Math.random() * 10);

    if (pipelineOutput.narrativeUpdate?.narrative) {
      processingStatus = 'woven';
      impactPercentage = 90 + Math.floor(Math.random() * 10);
    } else if (pipelineOutput.extractedEvent) {
      processingStatus = 'saved';
      impactPercentage = 50 + Math.floor(Math.random() * 30);
    }

    await supabase.from('diary_entries').update({ 
      processing_status: processingStatus,
      impact_percentage: impactPercentage
    }).eq('id', entry.id);

    if (pipelineOutput.narrativeUpdate && pipelineOutput.narrativeUpdate.narrative) {
      const { data: newChapter } = await supabase.from('chapters').insert({
        user_id,
        volume_id: activeVolume?.id,
        name: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
        narrative: pipelineOutput.narrativeUpdate.narrative,
        inspired_by_story_id: metadata?.inspired_by || null,
        inspiration_author: metadata?.inspiration_author || null,
        created_at: new Date().toISOString()
      }).select().single();

      // Handle Volume Sealing
      if (pipelineOutput.narrativeUpdate.shouldSealVolume && activeVolume) {
        await supabase.from('volumes').update({ 
          status: 'completed',
          epilogue: pipelineOutput.narrativeUpdate.currentVolumeEpilogue || null
        }).eq('id', activeVolume.id);
        
        if (pipelineOutput.narrativeUpdate.newVolumeMetadata) {
          const meta = pipelineOutput.narrativeUpdate.newVolumeMetadata;
          await supabase.from('volumes').insert({
            user_id,
            volume_number: activeVolume.volume_number + 1,
            title: meta.title || 'Next Phase',
            prologue: meta.prologue,
            epigraph: meta.epigraph,
            aura: meta.aura,
            status: 'ongoing'
          });
        }
      }
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error('Error in journal save route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
