# Rest Coder Academy — website

Marketing + enquiry site for Rest Coder Academy. React (Vite) frontend, hosted
on Cloudflare with a small serverless backend for capturing leads.

## Stack at a glance

| Layer | What |
|---|---|
| Frontend | React + Vite (this repo) |
| Hosting | **Cloudflare Pages** — project `restcoder-academy` |
| Backend | **Cloudflare Pages Functions** (`functions/`) — edge serverless, nothing to sleep |
| Database | **Cloudflare D1** — `restcoder-enquiries` (stores enquiry leads) |
| Analytics | **Cloudflare Web Analytics** (automatic, no code) |

Everything runs on **one Cloudflare account** (owned by the academy). Free tier
throughout.

## Domains

- **Live:** https://restcoderacademy.in (and `www.`) — DNS managed on Cloudflare,
  domain registered at **Hostinger**.
- ⚠️ **`restcoderacademy.com` is EXPIRED / abandoned** (it lapsed at GoDaddy).
  Do not rely on it or point anything at it.

## Local development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
```

## Deploying

Deploys are currently **manual** (push-to-deploy is a TODO — connect the repo
under Cloudflare Pages → Settings → Git to automate it):

```bash
# needs Cloudflare auth for the academy account (`wrangler login` once)
npx wrangler pages deploy --branch main
```

`wrangler.toml` holds the Pages project name, the build output dir (`dist`), and
the D1 binding — so `wrangler pages deploy` picks all of that up automatically.

## Enquiry backend (leads)

The enquiry form does **not** talk to any external server. It POSTs same-origin:

```
enquiry form  ->  POST /api/enquiry  ->  functions/api/enquiry.js  ->  D1 (enquiries table)
```

- Endpoint: `functions/api/enquiry.js` (validates + inserts into D1 via `env.DB`).
- Database: D1 `restcoder-enquiries`, table `enquiries` — see `schema.sql`.
- If the write ever fails, the form shows a **WhatsApp fallback** so a lead is
  never lost. Fallback numbers: **80737 62257** and **91104 24403**.

### Viewing the leads

- **Dashboard:** Cloudflare → Storage & Databases → D1 → `restcoder-enquiries` →
  Console → `SELECT * FROM enquiries ORDER BY created_at DESC;`
- **CLI:**
  ```bash
  npx wrangler d1 execute restcoder-enquiries --remote \
    --command "SELECT * FROM enquiries ORDER BY created_at DESC;"
  ```

(A friendly `/admin` lead-list page for the academy is a planned follow-up — see
the issues.)

### Changing the database schema

Edit `schema.sql`, then apply it:

```bash
npx wrangler d1 execute restcoder-enquiries --remote --file=schema.sql
```

## Batch schedule (admin-editable)

The **Upcoming Batches** section and the course-card "Next batch" tags read live
from D1 — the academy edits them at **`/admin/batches`** (same login as `/admin`),
no code change or redeploy.

```
site  ->  GET /api/batches          (functions/api/batches.js, public read from D1)
admin ->  /admin/batches (GET/POST)  (functions/admin/batches.js, password-protected CRUD)
```

- Table: D1 `batches` — see `schema-batches.sql`. Dates are **DD-MM-YYYY**.
- The frontend (`useBatches` hook) falls back to the bundled `batches.js` if the
  API is ever unreachable, so the section always renders.
- A past-dated batch auto-shows "new dates coming soon" on the site, so it can
  never advertise a stale date even if left unedited.

## Trainers (admin-editable)

The **Our Trainers** section on the homepage shows who teaches the courses —
photo, title, experience, expertise, a short bio, their LinkedIn/GitHub, and an
optional certificate link — so prospects can judge the trainers' credibility.
The academy edits these at **`/admin/trainers`** (same login as `/admin`), no
code change or redeploy.

```
site  ->  GET /api/trainers           (functions/api/trainers.js, public read from D1)
admin ->  /admin/trainers (GET/POST)   (functions/admin/trainers.js, password-protected CRUD)
```

- Table: D1 `trainers` — see `schema-trainers.sql`. Only **Name** is required;
  every other field is optional and simply hidden on the site when blank.
- Photos are referenced by URL. Bundled assets live under `public/trainers/`
  (e.g. `/trainers/uday.png`), or point `photo_url` at any hosted image.
- The frontend (`useTrainers` hook) falls back to the bundled `trainers.js` if
  the API is ever unreachable, so the section always renders.
- Set a trainer to **Hidden** to keep the profile but take it off the site.

## Enrolments & payments (FDE)

Course cards say **Enroll Now**. A paid course (FDE, ₹50,000) opens a Razorpay
checkout; any other course opens a free "register interest" form. Enrolments
(paid + registered) are viewable at **`/admin/enrollments`**.

```
Enroll Now (FDE)  -> checkout -> POST /api/enroll/order  (server creates the Razorpay order)
                              -> Razorpay Checkout (EMI available)
                              -> POST /api/enroll/verify (server verifies the signature, records it)
Enroll Now (other) ->            POST /api/enroll/register (free interest, status='registered')
```

**Money rules (enforced in code):**
- The amount is decided on the **server** (`shared/enroll.js` → `COURSE_PRICES`),
  never taken from the browser. Add a course id + price there to make it payable.
- The Razorpay **signature is verified server-side** before an enrolment is
  recorded — a redirect alone can be forged.
- Recording is **idempotent** (one row per Razorpay order id).
- The referral (`?ref=…`) rides into the Razorpay order `notes` and the row.

**Going live (you, in the Razorpay dashboard — the app never sees the keys):**
1. Set the Pages secrets `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test first,
   then live). Until they're set, `/api/enroll/order` returns 503 and the form
   falls back to recording interest — nothing breaks.
2. Enable **EMI** on the Razorpay account so it's offered at checkout.
3. `npx wrangler d1 execute restcoder-enquiries --remote --file=schema-enrollments.sql`
   to create the `enrollments` table.

## Android app (Capacitor shell)

The student portal ships as an installable Android app. It is the **same React
build** the website serves, wrapped by [Capacitor](https://capacitorjs.com) —
there is no second codebase, and nothing about the marketing site changes.

`npm run build` writes `dist/`, and `cap sync` copies that into
`android/app/src/main/assets/public`. So the app is only ever as fresh as the
last sync — editing `src/` alone does not change what the installed app shows.

```bash
npm run app:sync    # build the web app + copy it into the native project
npm run app:open    # open android/ in Android Studio
npm run app:apk     # build a debug APK (needs the Android SDK, see below)
npm run app:assets  # regenerate launcher icons + splash from assets/
```

The debug APK lands at
`android/app/build/outputs/apk/debug/app-debug.apk` — install it with
`adb install -r <that path>`, or press Run in Android Studio.

### What you need installed

Android Studio (which brings the SDK and an emulator) or, headless, the
command-line tools plus a platform and build-tools. `./gradlew` will tell you
which SDK component is missing. JDK 21 works.

### Icons and splash

`assets/` holds the sources — `icon.png`, `icon-foreground.png`,
`icon-background.png`, `splash.png`, `splash-dark.png` — all generated from
`src/assets/new logo.svg` on the brand navy `#03084C`. The launcher icon uses
the **mark alone**: the full lockup's wordmark is unreadable at 48dp, and
Android's adaptive-icon mask crops the outer quarter of the canvas anyway.

`npm run app:assets` regenerates the 136 density variants under
`android/app/src/main/res/`. Edit the files in `assets/`, never those.

### The OAuth deep link

The app registers the **`rca://` scheme** (`AndroidManifest.xml`, host `auth`),
so a provider can redirect to `rca://auth/callback` and land back inside the
running app rather than in a browser tab. `MainActivity` uses
`launchMode="singleTask"`, so that redirect resumes the existing task instead of
starting a second copy of the app.

Nothing consumes that callback yet — the auth endpoints are #113 and the login
screen is #110. This ticket (#109) only guarantees the scheme is registered and
the shell builds.

### Known gap

`index.html` still pulls the slick-carousel stylesheets from cdnjs. On the web
that is a render-blocking third-party request (#105); **inside the app it also
means those styles simply do not exist offline.** Worth closing #105 before the
app ships to students on rural connections.

## History / context

- The previous backend (`trcabe.onrender.com`) was a separate repo by the prior
  developer, on a sleeping free tier with an undocumented database and no way to
  view leads — so form submissions were silently dropped whenever it was asleep.
  It was **replaced** by the D1 + Pages Function setup above (see issues #2, #17,
  #19, #20). `trcabe.onrender.com` is no longer used.

## Student portal (Phase 1)

`/portal/login`, `/portal` and `/portal/courses/:slug` are the student portal
(#110, #111, #137). They are
**inert until configured**: with no OAuth secrets set, `/auth/me` reports no
providers and the login screen says "coming soon" rather than rendering buttons
that lead to a provider error page. The marketing site is unaffected either way.

Sessions are **stateless** — a signed HS256 JWT in an HttpOnly cookie, no
`sessions` table, so a request verifies a signature instead of paying a D1 read.
Logout clears the cookie; it cannot revoke a token server-side before its 30-day
expiry. See the note at the foot of `schema-users.sql`.

### Owner-provisioned secrets

These cannot be created from the repo. Set them as Cloudflare Pages secrets:

| Secret | Where it comes from |
|---|---|
| `SESSION_SECRET` | any long random string — signs the session cookie |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client ID (Web application) |
| `MS_CLIENT_ID` / `MS_CLIENT_SECRET` | Entra → App registrations → Certificates & secrets |
| `MS_TENANT` | optional; defaults to `common` (work **and** personal accounts) |

Register these redirect URIs with **both** providers:

```
https://restcoderacademy.in/auth/google/callback
https://restcoderacademy.in/auth/microsoft/callback
```

The redirect is always this site's own origin, never the `rca://` deep link —
a custom scheme cannot be a registered redirect for a confidential client, and
the token exchange has to happen server-side. The native shell is handed back
at the end of the callback.

### Database

```
npx wrangler d1 execute restcoder-enquiries --file=./schema-users.sql
```

### The endpoints

| Route | What it does |
|---|---|
| `GET /auth/:provider/start` | redirect to consent, with PKCE + state in HttpOnly cookies. **503 when unconfigured.** |
| `GET /auth/:provider/callback` | exchange the code, **verify the ID token against the provider's JWKS**, upsert into `users`, issue the session cookie |
| `GET /auth/me` | the current user, or 401. Also reports which providers are configured. |
| `POST /auth/logout` | clear the session cookie |
| `GET /api/portal/courses` | the signed-in student's enrolled courses, or 401 |
| `GET /api/portal/courses/:slug` | one enrolled course with its published lessons. **404 when the student is not enrolled**, so slugs cannot be probed. |

### Course content (Phase 2)

Courses and lessons live in the same D1 database as `users`:

```
npx wrangler d1 execute restcoder-enquiries --file=./schema-courses.sql
```

`enrolments_users` is the resolved link between a portal account and a course.
The older `enrollments` table cannot serve that role: it identifies a person by
the email typed into the enquiry form and a course by free text, and its rows
predate any sign-in. The backfill that maps one to the other is at the foot of
`schema-courses.sql`.
