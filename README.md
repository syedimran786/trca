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

**Nothing sends or consumes that callback yet, on either side.** No server
route redirects to `rca://`, and no JavaScript listens for it — #109 only
guaranteed the scheme is registered and the shell builds.

Registering the scheme is also not sufficient on its own: a session cookie set
during a system-browser sign-in does not reach the app's WebView, so resuming
the app is not the same as being signed in inside it. See #163 for the gap and
what closing it needs.

### Offline assets

slick-carousel's stylesheets used to be pulled from cdnjs, which meant they
simply did not exist offline inside the app. #105 bundled them; every style the
app needs now ships in the APK.

## History / context

- The previous backend (`trcabe.onrender.com`) was a separate repo by the prior
  developer, on a sleeping free tier with an undocumented database and no way to
  view leads — so form submissions were silently dropped whenever it was asleep.
  It was **replaced** by the D1 + Pages Function setup above (see issues #2, #17,
  #19, #20). `trcabe.onrender.com` is no longer used.

## Student portal (Phase 1)

`/portal/login` and `/portal` are the student portal UI (#110, #111). The auth
backend behind them — the OIDC endpoints, the session cookie, and the D1 schema
— is #112 / #113 / #114 and lands separately. This half owns only the screens
and the reading of `GET /auth/me`.

They are **inert until configured**: with no OAuth secrets or no database the
backend answers `/auth/me` with a 503, and the login screen says "coming soon"
rather than rendering buttons that lead to a provider error page. The marketing
site is unaffected either way.

The exact shape of `/auth/me` is the seam between the two halves, so it is
pinned by `tests/portal.session-contract.test.js` — a change to the backend's
response fails a test here rather than showing up as a blank portal on a
student's phone.

### Owner-provisioned secrets

These cannot be created from the repo. See `docs/OAUTH-SETUP.md` for the
step-by-step; the short version is that someone with a Google Cloud and an
Entra account has to create two OAuth clients and set the results as Cloudflare
Pages secrets. **This is the long-lead item for Phase 1** — it can be started
before any of the auth PRs merge.

### The endpoints (#113, #114)

| Route | What it does |
|---|---|
| `GET /auth/:provider/start` | redirect to consent, with PKCE + state. **503 when unconfigured.** |
| `GET /auth/:provider/callback` | exchange the code, verify the ID token against the provider's JWKS, upsert the user, issue the session |
| `GET /auth/me` | the current user, 401 when signed out, 503 when unconfigured |
| `POST /auth/logout` | clear the session cookie |
