// GET /portal/parent — placeholder for the parent dashboard (#147).
// Renders a "coming soon" page until the placement-readiness score
// dashboard (issue #147) ships. The OIDC callback (#113) redirects
// a parent role user here after login.
//
// Auth: once #114 (session cookie + /auth/me) lands, this function will
// validate the session cookie and gate on role=parent before rendering.
// For now it renders the stub unconditionally — the route simply needs to
// exist so the post-login redirect doesn't 404.
export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Parent Dashboard — Rest Coder Academy</title>
  <meta name="robots" content="noindex">
  <style>
    body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;
         justify-content:center;min-height:100vh;margin:0;background:#f6f8fa;color:#24292f;text-align:center;padding:1rem}
    h1{font-size:1.5rem;margin:0 0 .5rem}
    p{color:#57606a;max-width:36ch;margin:.5rem auto}
    a{color:#0969da;font-size:.875rem}
  </style>
</head>
<body>
  <h1>Parent dashboard</h1>
  <p>Your child's progress view is being built. Check back soon.</p>
  <a href="/">← Back to Rest Coder Academy</a>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
