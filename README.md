# Elevame client app

A client-facing web app for Elevame's gut microbiome program: a 6-week meal
plan, shopping lists, a symptom/milestone tracker, a gut score dashboard, and
a food lookup — in English and Spanish, with each client's own real data
backed by Supabase.

## Project structure

```
index.html               Vite entry HTML
src/
  main.jsx                App bootstrap (wraps App in AuthProvider)
  App.jsx                 Auth gate + claim-kit gate + tab shell (Home/Scores/Plan/List/Track/Foods)
  theme.js                Brand colors
  i18n/strings.js         All EN/ES UI copy
  data/
    foods.js               Shared food score catalog (same for every client)
    planTemplate.js         Default 6-week plan template, used to seed new clients
    gutScoresTemplate.js    Default gut score / key bacteria values, used to seed new clients
  lib/supabaseClient.js    Supabase JS client (browser-safe anon key)
  context/AuthContext.jsx  Session state + sign in/up/out
  hooks/useClientData.js   Fetches/saves a signed-in client's profile, plan,
                           gut scores, shopping checks, tracker entries, milestones
  components/              Small reusable UI pieces (ScorePill, CheckinForm, ...)
  views/                   One file per tab (HomeView, PlanView, ...), plus
                           LoginView, SignUpView, ClaimKitView
supabase/schema.sql        Full DB schema + Row Level Security policies
scripts/
  seed.mjs                 Admin-managed: creates a client's login AND their
                           report in one step, already linked
  registerKit.mjs           Self-serve: registers a kit's report with no login
                           attached yet, for a client to claim themselves
  kits.example.csv          Column layout for bulk kit registration
```

Per-client data (profile, plan, gut scores, shopping list, tracker entries,
milestones) lives in Supabase, scoped by Row Level Security so a client can
only ever read or write their own rows. The food catalog is shared reference
data and ships in the bundle (`src/data/foods.js`), mirrored read-only into a
`foods` table in Supabase so plan rows can reference it by id.

## 1. Local setup

```bash
npm install
cp .env.example .env   # then fill in the Supabase values from step 2
npm run dev
```

Without real Supabase values, `npm run dev` still runs and shows the login
screen (Sign in will fail — that's expected until Supabase is wired up).

## 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick a name
   (e.g. `elevame-app`) and a region close to your clients.
2. Once it's provisioned, open **SQL Editor** → New query, paste the full
   contents of `supabase/schema.sql`, and run it. This creates every table
   (profiles, foods, gut_scores, plan_phases/days/meals, shopping_checks,
   tracker_entries, milestones) with Row Level Security already enabled.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
   You don't need magic links or social login for this app — clients sign in
   with an email + password you (or the seed script) set for them.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` (server-side
     only — used by `scripts/seed.mjs` and `scripts/registerKit.mjs`, never
     shipped to the browser)

   Put all three in your local `.env` (copied from `.env.example`).

## 3. Onboard a client

There are two ways a client ends up with a working login, depending on
whether staff create their account directly or the client signs up
themselves.

### 3a. Admin-managed (you create the login)

```bash
npm run seed -- --email pascale@example.com --name "Pascale Debain" --kit ELVMHB4178
```

This creates (or reuses) a Supabase Auth user for that email, a `profiles`
row already linked to it, and the default gut scores + 6-week plan. If you
don't pass `--password`, one is generated and printed once at the end — send
it to the client (or have them use Supabase's password-reset flow). Add
`--lang es` for a Spanish-speaking client, `--start-date YYYY-MM-DD` to
back/forward-date their plan start.

### 3b. Self-serve (client creates their own login, then links their kit)

Use this when a client should pick their own password rather than you
handing one to them — their lab results usually exist *before* they've ever
signed up, so registering the report and creating their login are two
separate steps:

1. **Register the kit** (staff side, once results are ready) — either one at
   a time:
   ```bash
   npm run register-kit -- --kit ELVXXXXXXX --email client@example.com --name "Client Name" [--lang en|es]
   ```
   or in bulk from a spreadsheet. Build a CSV with the columns in
   `scripts/kits.example.csv` — `kit_code`, `expected_email`, `full_name`,
   `language`, `plan_start_date`, `microbiome_age`, `diversity_value`, plus a
   `<key>_value`/`<key>_avg` pair of columns per gut score (see that file for
   the full list). Leave a score's columns blank to use the template's
   default numbers for it. Export from Excel/Sheets as CSV, then:
   ```bash
   npm run register-kit -- --csv path/to/kits.csv
   ```
   This creates the `profiles` row (and gut scores + default plan) with no
   `user_id` attached — it's "unclaimed" until the client links it.
2. **Client signs up** in the app with their own email + password (the
   "Create one" link on the login screen).
3. **Client claims their kit** — right after signing up, the app asks for
   their kit code and the email their results were registered under. If both
   match an unclaimed kit, their new account is linked to that report and
   they land in the app with their real data.

Either path works for the rest of the app identically once a client is
linked — a nutritionist can customise any client's plan afterward by editing
their rows directly in the Supabase table editor (`plan_phases` /
`plan_days` / `plan_meals` / `gut_scores`).

With `.env` filled in and at least one client set up (either path),
`npm run dev` gives you a fully working local app.

## 4. Push to GitHub

This repo is already set up with git. If you're working from a fresh clone:

```bash
git add -A
git commit -m "Your message"
git push -u origin <your-branch>
```

## 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import
   this GitHub repository.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` (also auto-detected — `vercel.json` in this repo
   adds the SPA rewrite so client-side routing/refresh works).
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — that key is only
   for running `scripts/seed.mjs` from your own machine (or a trusted admin
   environment), never from the deployed client-facing app.
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately — good for
   testing before the custom domain is live.

## 6. Point app.elevame.es at it

1. In the Vercel project, go to **Settings → Domains** → add `app.elevame.es`.
2. Vercel will show you a DNS record to add (typically a `CNAME` for `app`
   pointing at `cname.vercel-dns.com`, but use whatever Vercel displays for
   your project — it can vary).
3. Add that record at your DNS provider for `elevame.es` (wherever you
   manage the domain's DNS — your registrar or a service like Cloudflare).
4. Wait for DNS to propagate (usually minutes, sometimes longer) — Vercel's
   domain page will show it as verified and issue an SSL certificate
   automatically once it sees the record.

## Notes on the auth/data model

- `profiles.id` is an **internal id, separate from the Supabase Auth user
  id**. A profile can exist before its client has ever signed up (that's the
  whole point of the self-serve flow) — `profiles.user_id` stays `NULL`
  until a client links their account by calling the `claim_kit(kit_code,
  email)` database function from the app with a matching kit code and email.
  Every other table (`gut_scores`, `plan_phases`, `shopping_checks`, ...)
  references `profiles.id`, and Row Level Security checks ownership by
  joining through `profiles.user_id = auth.uid()` (see `owns_profile()` in
  `supabase/schema.sql`) — the anon key that ships in the browser bundle can
  never read or write another client's data, claimed or not.
- `claim_kit` is a `security definer` Postgres function, not a plain table
  update — that's what lets it look up an unclaimed kit by code (which
  isn't yet owned by anyone, so normal RLS would block it) while still
  safely enforcing the email match and preventing two people from claiming
  the same kit in a race.
- The app falls back to the bundled default 6-week plan
  (`src/data/planTemplate.js`) if a linked client has no `plan_phases` rows
  of their own yet, so an account still sees something sensible rather than
  a blank screen — but for a real client you should always run the gut-score
  seed/register step so their plan and scores are tied to real rows, not
  just the fallback.
- `supabase/schema.sql` is written to be re-run safely against a database
  that already has the *older* schema (where `profiles.id` directly was the
  auth user id) — it migrates existing rows in place rather than requiring
  a fresh project.
