import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { planeId } = await req.json();
    const adminSupabase = getSupabaseAdmin();
    
    // 1. Get plane details
    const { data: plane, error: fetchError } = await adminSupabase
      .from('paper_planes')
      .select('*')
      .eq('id', planeId)
      .single();
    
    if (fetchError || !plane) throw new Error('Plane not found');
    
    // 2. Insert into archive
    const { error: archiveError } = await adminSupabase
      .from('archived_planes')
      .insert({
          id: plane.id,
          sender_id: plane.sender_id,
          receiver_id: plane.receiver_id,
          story_id: plane.story_id,
          content: plane.content,
          original_intent_type: plane.intent_type
      });
      
    if (archiveError) throw archiveError;
    
    // 3. Delete from active
    const { error: deleteError } = await adminSupabase
        .from('paper_planes')
        .delete()
        .eq('id', planeId);
        
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive error:', error);
    return NextResponse.json({ error: 'Failed to archive plane' }, { status: 500 });
  }
}
