import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In a real production app, you would send this to a logging service 
    // like Sentry, LogRocket, or a custom database.
    // For now, we'll log it to the server console.
    
    const { type, message, timestamp, url, stack, name, line, column, metadata } = body;
    
    console.log(`[CLIENT-LOG] [${type}] [${timestamp}] [${url}]`);
    console.log(`Message: ${message}`);
    if (name || stack) {
      console.log(`Error: ${name} at ${line}:${column}`);
      console.log(`Stack: ${stack?.split('\n').slice(0, 3).join('\n')}...`);
    }
    if (metadata) {
      console.log(`Metadata: ${JSON.stringify(metadata)}`);
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
