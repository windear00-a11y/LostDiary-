import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const { logs } = await request.json();

  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

  const prompt = `
    You are an expert Next.js debugger. Analyze these logs and provide a structured response:
    
    ### 🔍 Root Cause
    (Briefly explain what went wrong)

    ### 🛠️ Recommended Fix
    (Step-by-step instructions to fix the issue)

    ### 💻 Code Suggestion
    \`\`\`typescript
    // Provide the corrected code snippet here
    \`\`\`

    ### 🚀 Next Steps
    (What the user should do immediately after applying the fix, e.g., "Restart the dev server", "Check the network tab", etc.)

    Logs:
    ${JSON.stringify(logs, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return NextResponse.json({ analysis: response.text });
  } catch (error) {
    console.error('AI Debug error:', error);
    return NextResponse.json({ error: 'Failed to analyze logs' }, { status: 500 });
  }
}
