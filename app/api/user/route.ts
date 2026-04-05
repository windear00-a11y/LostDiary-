import { NextResponse } from 'next/server';

export async function GET() {
  // Mock user data
  return NextResponse.json({ name: 'User' });
}
