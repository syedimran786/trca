# OAuth setup for the student portal

**Who this is for:** whoever owns the Google and Microsoft accounts for the
academy. Nothing here can be done from the repo — creating OAuth clients and
holding secrets is an owner job by definition.

**Why it is worth doing now:** this is the long-lead item for Phase 1 (#42).
Provider review, tenant permissions and the verification screen are all
wall-clock waits that have nothing to do with our code, and none of this
depends on which auth PR merges — the redirect URIs and secret names are the
same either way. Everything else in Phase 1 is code that already exists in open
PRs. Until these secrets are set, the portal deliberately shows "coming soon".

There are three tasks. The first two can be done in parallel by different
people; the third takes two minutes once you have the results.

---

## 1. Google

1. Go to <https://console.cloud.google.com/>, and either pick the academy's
   existing project or create one named `rest-coder-academy`.
2. **APIs & Services → OAuth consent screen.**
   - User type: **External**. (Internal only exists for Workspace orgs, and
     students sign in with personal Gmail accounts.)
   - App name: `Rest Coder Academy`. Support email: `restcoderacademy@gmail.com`.
   - Authorised domain: `restcoderacademy.in`.
   - Scopes: **`openid`, `email`, `profile` only.** Do not add anything else —
     any scope beyond these three drops the app into Google's manual
     verification queue, which takes weeks and is not needed to sign a student in.
   - While the app is in **Testing**, only accounts on the test-user list can
     sign in, capped at 100. That is fine for a pilot cohort. Press **Publish**
     before real students use it; with only these three scopes, publishing does
     not trigger a review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
   - Application type: **Web application** — *not* Android. The token exchange
     happens on our server, so this is a confidential client. The Android app
     goes through the same web client (see "Why not a native client" below).
   - Authorised redirect URI, exactly:
     ```
     https://restcoderacademy.in/auth/google/callback
     ```
   - Add `http://localhost:8788/auth/google/callback` too if anyone will run
     the portal locally.
4. Copy the **Client ID** and **Client secret**.

---

## 2. Microsoft

1. Go to <https://entra.microsoft.com/> → **App registrations → New registration**.
2. Name: `Rest Coder Academy`.
3. Supported account types: **Accounts in any organizational directory and
   personal Microsoft accounts**. This is what `MS_TENANT=common` means. Picking
   a single tenant here locks out every student with a personal Outlook account.
4. Redirect URI: platform **Web**, value exactly:
   ```
   https://restcoderacademy.in/auth/microsoft/callback
   ```
5. **Certificates & secrets → New client secret.** Copy the **Value** column,
   not the Secret ID — the value is shown once and is unrecoverable afterwards.
   Set the longest expiry offered and put the expiry date in a calendar: when it
   lapses, Microsoft sign-in stops working with no warning and no error anyone
   will understand.
6. From **Overview**, copy the **Application (client) ID**.

---

## 3. Set the Cloudflare Pages secrets

Cloudflare dashboard → Workers & Pages → `restcoder-academy` → Settings →
Environment variables → **add as Secret (encrypted)**, for Production:

| Secret | Value |
|---|---|
| `SESSION_SECRET` | a long random string — see below |
| `GOOGLE_CLIENT_ID` | from step 1 |
| `GOOGLE_CLIENT_SECRET` | from step 1 |
| `MS_CLIENT_ID` | from step 2 |
| `MS_CLIENT_SECRET` | the secret **Value** from step 2 |
| `MS_TENANT` | `common` |

Generate `SESSION_SECRET` with:

```bash
openssl rand -base64 48
```

It signs the session cookie. Rotating it signs every student out immediately,
which is the emergency lever if a session is ever suspected of being stolen.

Redeploy after adding them — Pages picks up new secrets on the next deploy,
not on save.

---

## Checking it worked

```bash
curl -i https://restcoderacademy.in/auth/me
```

- **503** — secrets are not set, or not deployed yet. The portal shows
  "coming soon". This is the correct state before step 3.
- **401** — configured and working; you are simply not signed in.

Then open `https://restcoderacademy.in/portal/login` and sign in with each
provider once.

---

## Two things that will bite

**Why not a native Android client.** A custom scheme like `rca://` cannot be a
registered redirect for a confidential client, and the code-for-token exchange
has to happen server-side where the client secret lives. So both providers
redirect to this site's own origin, and the native shell is handed back at the
end of the callback via the `rca://` deep link the app already registers. Do
not create an "Android" OAuth client type — it will not be used.

**The Microsoft secret expires.** Google's client secret does not. Microsoft's
does, on whatever expiry you chose. Diary it.

---

## Do not

- Put any of these in `.env`, `wrangler.toml`, or a commit. They are Pages
  secrets. `wrangler.toml` is committed and public.
- Paste a client secret into an issue, a PR or a chat thread. If one is
  exposed, rotate it in the provider console rather than deleting the message —
  by then it is in someone's notification history.
