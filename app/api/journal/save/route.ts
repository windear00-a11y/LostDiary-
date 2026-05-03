import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AIOrchestrator } from "@/ai-core/ai-orchestrator";
import { extractIntelligenceProfile } from "@/ai-core/intelligence-engine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, user_id, metadata, userId: legacy_user_id } = body;
    const final_user_id = user_id || legacy_user_id;

    console.log(`[JournalSave] Request for user: ${final_user_id}, content length: ${content?.length}`);

    if (!content || !final_user_id) {
      return NextResponse.json(
        { error: "Missing content or user_id" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 0. Fetch user profile for context. If not exists, create it.
    let { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("personality_summary, intelligence_profile")
      .eq("id", final_user_id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') { // PGRST116 is 'no rows found'
       console.error("[JournalSave] Profile fetch error:", profileErr);
    }

    if (!profile) {
      console.log(`[JournalSave] Profile not found for ${final_user_id}, creating default...`);
      // Create a default profile if it doesn't exist yet
      // We only include core fields to avoid failures due to potentially missing schema updates
      const defaultProfile: any = {
        id: final_user_id,
        personality_summary: "A new soul embarking on a journey of self-reflection.",
        intelligence_profile: {
          basic_profile: {},
          thinking_style: {},
          emotional_state: {},
          interests_goals: {},
          behavior_patterns: {},
          communication_style: {},
          sensitive_insights: {},
          source_weights: { chat: 0.3, diary: 0.7 }
        },
        updated_at: new Date().toISOString(),
      };

      // Add preferred_language if it exists in metadata, but be careful
      if (metadata?.language) {
        defaultProfile.preferred_language = metadata.language;
      }
      
      const { data: newProfile, error: creationError } = await supabase
        .from("users")
        .insert(defaultProfile)
        .select("personality_summary, intelligence_profile")
        .single();
        
      if (creationError) {
        console.error("[JournalSave] Critical: Failed to create user profile on-the-fly:", creationError);
        // If it failed because of preferred_language, try one more time without it
        if (creationError.message.includes('preferred_language')) {
           delete defaultProfile.preferred_language;
           const { data: retryProfile, error: retryError } = await supabase
             .from("users")
             .insert(defaultProfile)
             .select("personality_summary, intelligence_profile")
             .single();
           
           if (retryError) {
             console.error("[JournalSave] Retry failed:", retryError);
             throw new Error(`Profile creation failed: ${retryError.message}`);
           } else {
             profile = retryProfile;
           }
        } else {
          throw new Error(`Profile creation failed: ${creationError.message}`);
        }
      } else {
        profile = newProfile;
      }
    }

    // 1. Save or Update the raw diary entry
    const entry_id = body.entry_id;
    let savedEntry: any = null;

    if (entry_id) {
       console.log(`[JournalSave] Updating existing entry: ${entry_id}`);
       const { data, error } = await supabase
         .from("diary_entries")
         .update({ 
           content, 
           metadata: metadata || {},
           updated_at: new Date().toISOString()
         })
         .eq("id", entry_id)
         .eq("user_id", final_user_id)
         .select()
         .single();
       
       if (error) {
         console.error("[JournalSave] Update error:", error);
         throw error;
       }
       savedEntry = data;
    } else {
       const insertData: any = {
         user_id: final_user_id,
         content,
         metadata: metadata || {},
       };
   
       // We only add timestamps if we're sure the DB might need them, 
       // but letting DB handle defaults is safer if schema cache is being weird.
       insertData.created_at = new Date().toISOString();
       insertData.updated_at = new Date().toISOString();
   
       const { data: entry, error: entryError } = await supabase
         .from("diary_entries")
         .insert(insertData)
         .select()
         .single();
   
       if (entryError) {
          console.error("[JournalSave] Entry insert error:", entryError);
          // Check if it's the updated_at error specifically
          if (entryError.message.includes("updated_at") || entryError.message.includes("column")) {
             console.log("[JournalSave] Retrying insert without explicit timestamps...");
             delete insertData.created_at;
             delete insertData.updated_at;
             const { data: retryEntry, error: retryError } = await supabase
               .from("diary_entries")
               .insert(insertData)
               .select()
               .single();
               
             if (retryError) throw retryError;
             savedEntry = retryEntry;
          } else {
             throw entryError;
          }
       } else {
         savedEntry = entry;
       }
    }

    if (!savedEntry) throw new Error("Failed to save entry");
    console.log(`[JournalSave] Entry processed successfully: ${savedEntry.id}`);

    // 2. Trigger the AI Pipeline for LifeBook integration
    const orchestrator = new AIOrchestrator(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      profile?.personality_summary,
    );

    const [
      { data: recentEvents },
      { data: contextChaptersData },
      { data: currentVolume },
    ] = await Promise.all([
      supabase
        .from("life_events")
        .select("*")
        .eq("user_id", final_user_id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("chapters")
        .select("narrative")
        .eq("user_id", final_user_id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("volumes")
        .select("*")
        .eq("user_id", final_user_id)
        .eq("status", "ongoing")
        .maybeSingle(),
    ]);

    const contextChapters = contextChaptersData?.map((c) => c.narrative) || [];
    let activeVolume = currentVolume;

    if (!activeVolume) {
      const { data: lastVol } = await supabase
        .from("volumes")
        .select("volume_number")
        .eq("user_id", final_user_id)
        .order("volume_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextNum = (lastVol?.volume_number || 0) + 1;
      const { data: newVol } = await supabase
        .from("volumes")
        .insert({
          user_id: final_user_id,
          volume_number: nextNum,
          title: "The Silent Beginning",
          status: "ongoing",
        })
        .select()
        .single();
      activeVolume = newVol;
    }

    // 2.2 Parallelize legacy extraction and deep structured intelligence profile extraction
    const currentIntelProfile = profile?.intelligence_profile || {
      basic_profile: {},
      thinking_style: {},
      emotional_state: {},
      interests_goals: {},
      behavior_patterns: {},
      communication_style: {},
      sensitive_insights: {},
      source_weights: { chat: 0.3, diary: 0.7 },
    };

    const [pipelineOutput, updatedIntelProfile] = await Promise.all([
      orchestrator.processInteraction(
        {
          userId: final_user_id,
          message: { role: "user", type: "text", content },
          contextMessages: [],
          apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
          recentEvents: recentEvents || [],
          contextChapters: contextChapters,
        },
        { isJournal: true },
      ),
      extractIntelligenceProfile("diary", content, currentIntelProfile as any),
    ]);

    // 3. Save extracted event if applicable
    if (pipelineOutput.extractedEvent) {
      const eventData = {
        user_id: final_user_id,
        diary_entry_id: savedEntry.id,
        summary: pipelineOutput.extractedEvent.summary || "Life Reflection",
        emotion: pipelineOutput.extractedEvent.emotion || "neutral",
        category: pipelineOutput.extractedEvent.category || "Growth",
        intensity: String(pipelineOutput.extractedEvent.score || 5),
        created_at: new Date().toISOString(),
      };
      
      const { error: eventErr } = await supabase
        .from("life_events")
        .upsert(eventData, { onConflict: 'diary_entry_id' });
      
      if (eventErr) {
        console.error("[JournalSave] Failed to save life event:", eventErr);
        // Fallback to simple insert if upsert fails due to missing constraint during migration lag
        if (eventErr.message.includes("constraint")) {
           await supabase.from("life_events").insert(eventData);
        }
      } else {
        console.log("[JournalSave] Life event upserted successfully");
      }
    }

    // 4. Update Identity & Memory (Including the new Deep JSON profile)
    await supabase
      .from("users")
      .update({
        personality_summary:
          pipelineOutput.personaUpdate || profile?.personality_summary,
        bio: pipelineOutput.narrativeUpdate
          ? pipelineOutput.narrativeUpdate.summary
          : undefined,
        intelligence_profile: updatedIntelProfile,
      })
      .eq("id", final_user_id);

    // 5. Check if we should trigger a new LifeBook chapter
    let processingStatus: "woven" | "saved" | "observed" = "saved";
    let impactPercentage = 5 + Math.floor(Math.random() * 10);

    if (pipelineOutput.narrativeUpdate?.narrative) {
      processingStatus = "woven";
      impactPercentage = 90 + Math.floor(Math.random() * 10);
    } else if (pipelineOutput.extractedEvent) {
      processingStatus = "observed";
      impactPercentage = 50 + Math.floor(Math.random() * 30);
    }

    await supabase
      .from("diary_entries")
      .update({
        processing_status: processingStatus,
        impact_percentage: impactPercentage,
      })
      .eq("id", savedEntry.id);

    if (
      pipelineOutput.narrativeUpdate &&
      pipelineOutput.narrativeUpdate.narrative
    ) {
      const { data: newChapter } = await supabase
        .from("chapters")
        .insert({
          user_id: final_user_id,
          volume_id: activeVolume?.id,
          name: pipelineOutput.narrativeUpdate.summary.substring(0, 50),
          narrative: pipelineOutput.narrativeUpdate.narrative,
          inspired_by_story_id: metadata?.inspired_by || null,
          inspiration_author: metadata?.inspiration_author || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Handle Volume Sealing
      if (pipelineOutput.narrativeUpdate.shouldSealVolume && activeVolume) {
        await supabase
          .from("volumes")
          .update({
            status: "completed",
            epilogue:
              pipelineOutput.narrativeUpdate.currentVolumeEpilogue || null,
          })
          .eq("id", activeVolume.id);

        if (pipelineOutput.narrativeUpdate.newVolumeMetadata) {
          const meta = pipelineOutput.narrativeUpdate.newVolumeMetadata;
          await supabase.from("volumes").insert({
            user_id: final_user_id,
            volume_number: activeVolume.volume_number + 1,
            title: meta.title || "Next Phase",
            prologue: meta.prologue,
            epigraph: meta.epigraph,
            aura: meta.aura,
            status: "ongoing",
          });
        }
      }
    }

    return NextResponse.json({ success: true, entry: savedEntry, processingStatus });
  } catch (error: any) {
    console.error("Error in journal save route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
