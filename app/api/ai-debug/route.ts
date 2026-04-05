import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const { logs } = await request.json();

  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

  const prompt = `
    You are a senior software engineer debugging a Next.js application.
    Analyze the following logs and provide:
    1. Root cause of the issue.
    2. A clear fix.
    3. A code suggestion.

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
