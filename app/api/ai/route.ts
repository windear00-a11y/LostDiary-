import { NextResponse } from 'next/server';

// Lightweight in-memory usage tracking (Note: Resets on server restart)
let totalAICalls = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, memory_snapshot } = body;

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    // Increment usage tracking
    totalAICalls++;

    // Log tracking info for backend monitoring
    console.log(`[AI USAGE] Total Calls: ${totalAICalls} | Last Input: "${input.substring(0, 50)}..."`);

    /**
     * BACKEND ARCHITECT NOTE:
     * Per platform constraints, the actual Gemini API call MUST happen on the client.
     * This route serves as a coordinator for usage tracking and context validation.
     */
    return NextResponse.json({
      status: 'success',
      tracking: {
        total_calls: totalAICalls,
        timestamp: new Date().toISOString()
      },
      // Provide server-side refined context guidance if needed
      context_guidance: memory_snapshot ? "Focus on the user's recurring patterns during generation." : null
    });
  } catch (error) {
    console.error('[AI API ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
