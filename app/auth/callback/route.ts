import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener && window.opener !== window) {
              window.opener.postMessage({ 
                type: 'OAUTH_CALLBACK', 
                url: window.location.href 
              }, '*');
              window.close();
            } else {
              window.location.href = '/auth?code=${code}&next=${encodeURIComponent(next)}';
            }
          </script>
          <p>Authentication successful. Returning to application...</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return NextResponse.redirect(`${origin}/auth?error=auth-code-missing`);
}
