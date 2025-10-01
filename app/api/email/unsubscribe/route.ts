import { NextRequest, NextResponse } from 'next/server';
import { validateUnsubscribeToken } from '@/lib/utils/gdpr';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token || !validateUnsubscribeToken(token)) {
    return NextResponse.json(
      { error: 'Invalid unsubscribe token' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // Update database to mark email as unsubscribed
    const { error: dbError } = await supabase
      .from('email_preferences')
      .update({ is_subscribed: false, updated_at: new Date().toISOString() })
      .eq('unsubscribe_token', token);

    if (dbError) {
      console.error('Database error during unsubscribe:', dbError);
      // Continue to show success page even if DB update fails (graceful degradation)
    }

    // Return success response
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    h1 { color: #4CAF50; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>✓ Successfully Unsubscribed</h1>
  <p>You have been unsubscribed from future emails.</p>
  <p>If you change your mind, you can resubscribe by contacting us directly.</p>
</body>
</html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || !validateUnsubscribeToken(token)) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update database to mark email as unsubscribed
    const { error: dbError } = await supabase
      .from('email_preferences')
      .update({ is_subscribed: false, updated_at: new Date().toISOString() })
      .eq('unsubscribe_token', token);

    if (dbError) {
      console.error('Database error during unsubscribe:', dbError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}