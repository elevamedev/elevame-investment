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
  App.jsx                 Auth gate + tab shell (Home/Scores/Plan/List/Track/Foods)
  theme.js                Brand colors
  i18n/strings.js         All EN/ES UI copy
  data/
    foods.js               Shared food score catalog (same for every client)
    planTemplate.js         Default 6-week plan template, used to seed new clients
    gutScoresTemplate.js    Default gut score / key bacteria values, used to seed new clients
  lib/supabaseClient.js    Supabase JS client (browser-safe anon key)
  context/AuthContext.jsx  Session state + sign in/out
  hooks/useClientData.js   Fetches/saves a signed-in client's profile, plan,
                           gut scores, shopping checks, tracker entries, milestones
  components/              Small reusable UI pieces (ScorePill, CheckinForm, ...)
  views/                   One file per tab (HomeView, PlanView, ...), plus LoginView
supabase/schema.sql        Full DB schema + Row Level Security policies
scripts/seed.mjs           Creates a client's login + assigns their starter plan
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
     only — used by `scripts/seed.mjs`, never shipped to the browser)

   Put all three in your local `.env` (copied from `.env.example`).

## 3. Seed your first client

The prototype's hardcoded data (Pascale Debain, kit `ELVMHB4178`, her gut
scores, her 6-week plan) is now the *default template* in `src/data/`. Turn
it into a real record for a real client with:

```bash
npm run seed -- --email pascale@example.com --name "Pascale Debain" --kit ELVMHB4178
```

This will:
- upsert the shared food catalog into Supabase,
- create (or reuse, if it already exists) a Supabase Auth user for that email,
- create their `profiles` row,
- assign them the default gut scores and the default 6-week plan.

If you don't pass `--password`, one is generated and printed once at the end
— send it to the client (or have them use Supabase's password-reset flow).
Add `--lang es` for a Spanish-speaking client, `--start-date YYYY-MM-DD` to
back/forward-date their plan start.

Run the same command again with a new `--email`/`--name`/`--kit` for each
additional client. A nutritionist can later customise any client's specific
plan by editing their rows directly in the Supabase table editor
(`plan_phases` / `plan_days` / `plan_meals` / `gut_scores`).

With `.env` filled in and a client seeded, `npm run dev` gives you a fully
working local app — sign in with that client's email/password.

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

- Every table except `foods` has Row Level Security requiring
  `auth.uid() = profile_id` (directly or via a join), so the anon key that
  ships in the browser bundle can never read or write another client's data.
- `profiles.id` **is** the Supabase Auth user id — there's no separate
  client id to keep in sync.
- The app falls back to the bundled default 6-week plan
  (`src/data/planTemplate.js`) if a signed-in client has no `plan_phases`
  rows yet, so a newly created auth user (without having run the seed
  script) still sees something rather than a blank screen — but for a real
  client you should always run `scripts/seed.mjs` so their plan, and their
  shopping-list/tracker data, are tied to real database rows.
