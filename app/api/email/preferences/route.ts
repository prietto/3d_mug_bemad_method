import { NextRequest, NextResponse } from 'next/server';
import { validateUnsubscribeToken } from '@/lib/utils/gdpr';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token || !validateUnsubscribeToken(token)) {
    return NextResponse.json(
      { error: 'Invalid preference token' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // Fetch preferences from database
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('unsubscribe_token', token)
      .single();

    // Use fetched preferences or defaults
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Email Preferences</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 { color: #4CAF50; }
    .preference-group {
      margin: 20px 0;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    label {
      display: block;
      margin: 10px 0;
      cursor: pointer;
    }
    input[type="checkbox"] {
      margin-right: 10px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <h1>Email Preferences</h1>
  <p>Manage your email subscription preferences below:</p>

  <form id="preferences-form">
    <div class="preference-group">
      <h3>Notifications</h3>
      <label>
        <input type="checkbox" name="lead_confirmations" checked>
        Order confirmations and updates
      </label>
      <label>
        <input type="checkbox" name="marketing" checked>
        Marketing and promotional emails
      </label>
      <label>
        <input type="checkbox" name="newsletter">
        Monthly newsletter
      </label>
    </div>

    <button type="submit">Save Preferences</button>
  </form>

  <script>
    document.getElementById('preferences-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const token = new URLSearchParams(window.location.search).get('token');

      try {
        const response = await fetch('/api/email/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            preferences: {
              lead_confirmations: formData.get('lead_confirmations') === 'on',
              marketing: formData.get('marketing') === 'on',
              newsletter: formData.get('newsletter') === 'on',
            },
          }),
        });

        if (response.ok) {
          alert('Preferences saved successfully!');
        } else {
          alert('Failed to save preferences. Please try again.');
        }
      } catch (error) {
        alert('An error occurred. Please try again later.');
      }
    });
  </script>
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
    console.error('Preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to load preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, preferences } = body;

    if (!token || !validateUnsubscribeToken(token)) {
      return NextResponse.json(
        { error: 'Invalid preference token' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update database with new preferences
    const { error: dbError } = await supabase
      .from('email_preferences')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('unsubscribe_token', token);

    if (dbError) {
      console.error('Database error updating preferences:', dbError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    console.log('Email preferences updated successfully:', { token });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}