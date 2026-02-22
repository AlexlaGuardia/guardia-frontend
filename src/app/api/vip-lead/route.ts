import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.guardiacontent.com';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.business || !data.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send to backend API
    const response = await fetch(`${API_URL}/vip-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        business: data.business,
        email: data.email,
        phone: data.phone || null,
        vision: data.vision || null,
        source: 'vipstart_page',
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Backend API error:', await response.text());
      // Still return success to user - we don't want to lose the lead
      // The backend might be down but we can log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing VIP lead:', error);
    // Return success anyway - better UX, we can check logs
    return NextResponse.json({ success: true });
  }
}
