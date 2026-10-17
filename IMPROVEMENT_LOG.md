# Elevame app — improvement log

This branch (`explore/app-improvements`) is a sandbox for an ongoing audit
and improvement pass: UI/UX and design-best-practice fixes, plus new
feature exploration, implemented directly here so they can be reviewed as
a whole rather than pushed live incrementally. **Nothing on this branch
reaches `app.elevame.es` until it's reviewed and merged by hand.**

Each cycle below is a self-contained pass: audit a slice of the app,
implement what's worth implementing, note what's deferred and why.

---

## Cycle 0 — baseline audit + foundational fixes

### Audit findings

Reviewed all six tabs (Home, Scores, Plan, List, Track, Foods) plus the
auth screens, against standard UI/UX and accessibility practice. Notable
gaps found:

1. **Silent save failures.** Every background write (shopping checklist
   toggle, tracker check-in, milestone check-in, language/start-date
   change) swallowed its error into a `error` state nothing rendered for
   those cases — a client could tick a grocery item, lose connectivity,
   and never know it didn't save. This was the most consequential finding:
   it directly undermines trust in the app ("did that actually save?").
2. **No destructive-action confirmation.** The shopping list's "Reset"
   button cleared every checked item instantly, no undo, no confirmation.
3. **No empty state for food search.** Searching for something not in the
   catalog just showed a blank list under the "N results" line — reads as
   broken rather than "nothing found."
4. **Accessibility gaps.** Icon-only buttons (sign out, day-navigation
   chevrons, clear-search) had no `aria-label`; the bottom tab bar wasn't
   a semantic `<nav>` and didn't mark the active tab (`aria-current`);
   range sliders in the check-in form had no accessible name/value for
   screen readers; language toggle buttons didn't expose pressed state.
5. **No safe-area handling.** The fixed bottom nav didn't account for the
   home-indicator inset on notched iPhones (and the viewport meta tag
   didn't even opt into `env(safe-area-inset-*)` being populated).
6. **No save feedback in the check-in form.** Tapping "Save" gave no
   indication anything happened beyond the screen quietly updating —
   no busy state, no way to tell a slow network from a broken button.

### Implemented this cycle

- **Toast notification system** (`src/context/ToastContext.jsx`,
  `src/components/ToastStack.jsx`): a minimal, dependency-free toast
  provider wired in at the root. `useClientData`'s mutations now call a
  shared `reportSaveError` on failure instead of silently setting
  unused state — addresses finding #1 for every write path (shopping
  checks, tracker entries, milestones, profile/language updates).
- **Confirm before clearing the shopping list** (finding #2) — plain
  `window.confirm`, kept deliberately simple rather than building a
  custom modal for one use case.
- **Empty state for food search** (finding #3) — "No foods found — try a
  different search" instead of a blank box.
- **Accessibility pass** (finding #4): `aria-label`s on sign-out, day-nav
  chevrons, clear-search; bottom nav is now a `<nav aria-label>` with
  `aria-current="page"` on the active tab; language toggle buttons expose
  `aria-pressed`; check-in sliders have `aria-label`/`aria-valuetext`;
  shopping list items expose `aria-pressed` for checked state.
- **Safe-area support** (finding #5): `viewport-fit=cover` added to the
  viewport meta tag; bottom nav gets `paddingBottom:
  env(safe-area-inset-bottom)`.
- **Save/busy state in the check-in form** (finding #6): the Save button
  now disables and shows "Saving..." while the write is in flight.

All of the above verified with `npm run build`, `npx eslint .` (clean,
same pre-existing warnings as main), and a headless-browser smoke test of
the toast, empty-state, and nav changes (no console errors).

### Deferred / backlog for later cycles

- Loading skeletons instead of the current full-page "Loading your
  plan..." text — cheap visual upgrade, didn't fit this cycle's scope.
- The toast can visually overlap the client-name chip at the very top of
  the screen on short viewports — works, but worth a layout tweak.
- Dark mode — not attempted; worth scoping separately given it touches
  every view's inline color usage.
- Bundle size warning from Vite (recharts pulls in a lot) — code-splitting
  candidate, not a user-facing issue yet.
- Bigger feature ideas (gamification/streaks, richer food detail view,
  admin-side plan editor, etc.) — to be explored in a later cycle once the
  foundational polish above is reviewed.

---

## Cycle 1 — score drill-down + pathogen/parasite screening

### Why this cycle

Prompted directly by the user uploading a real 51-page Elevame microbiome
report and its matching 15-page diet plan, with two specific complaints:

1. *"When someone sees their motility score, there's no way to click in
   and get more information."* — every `ScoreRow` was static; nothing was
   tappable.
2. *"There's also information around pathogenic bacteria etc etc."* — the
   real report has a whole "Bacteria and Diseases Report" section
   (pathogenic bacteria, parasites, fungi, dysbiotic bacteria, autoimmune
   triggers, each marked Detected/Not Detected with an abundance % when
   detected) that the app had no equivalent of at all.

The real report also has per-score deep-dive pages (what the score means,
a labelled reference-range bar, related bacteria) and 12 disease-specific
association deep-dives, taxonomic/genus-level charts, a Wellness Index,
nutrient/supplement scoring, and branded product recommendations — far
more than this cycle covers. This cycle intentionally tackles the two
things the user named explicitly; the rest is listed below as backlog
for a follow-up cycle, to be prioritised with the user rather than
built unilaterally.

### Implemented this cycle

- **Score detail drill-down** (`src/components/ScoreDetailSheet.jsx`):
  every row in "Your gut scores" and "Key bacteria" is now a tappable
  button (`ScoreRow.jsx`, with a chevron affordance) that opens a bottom
  sheet showing the score's value/tag, a labelled Low/Typical/High
  reference bar with the client's value and community average marked,
  the existing per-client note, a plain-language "About this score"
  explanation, and (where relevant) the specific bacteria genera that
  score is derived from. Explanatory copy lives in
  `src/data/scoreDetails.js` — one entry per score/bacteria key, en/es —
  since it's the same educational content for every client (like a
  report's printed glossary), while the value/avg/tag/note stay
  per-client from the database as before.
- **Bacteria & pathogen screening report**
  (`src/components/ScreeningReport.jsx`): a new collapsible section
  below Key Bacteria, grouped into the same five categories as the real
  report (Pathogenic Bacteria, Parasites, Fungi, Dysbiotic Bacteria,
  Autoimmune Triggers), each collapsed to an at-a-glance "Nothing
  detected" / "Found in your sample" summary with a shield icon, and
  expandable to show each organism individually with a Detected
  (+ abundance %) or Not Detected pill. Default content lives in
  `src/data/screeningTemplate.js`, seeded all-clear (matching the
  uploaded sample report) but structured to carry a real "detected"
  result per client.
- **Schema + data pipeline**: new `screening_findings` table in
  `supabase/schema.sql` (profile-scoped, RLS select-own, same shape as
  `gut_scores`), fetched and grouped in `useClientData.js`, and seeded
  by default in `scripts/seed.mjs` via `seedScreeningFindings()` so new
  clients get sensible "not detected" starter rows alongside their
  gut scores.

Verified with `npm run build` (clean, same pre-existing bundle-size
warning as before), `npx eslint .` (clean, same 3 pre-existing
fast-refresh warnings), and a headless-browser smoke test of the Scores
tab: default view, the Bowel Mobility (motility) detail sheet open, and
the Pathogenic Bacteria category expanded with one item flipped to
"Detected" to confirm that render path too — no console errors.

### Known limitation — confirm before relying on this for real clients

The organism list in `screeningTemplate.js` (*C. difficile*, *Giardia*,
*Candida albicans*, etc.) is representative of what a commercial gut
panel like this typically screens for, **not a transcription of
Elevame's actual lab panel** — the exact list wasn't available to copy
from this cycle. Before this ships real per-client data, whoever enters
a client's lab results should confirm the category/organism list against
the lab's own report and adjust `screeningTemplate.js` / the seeded rows
to match exactly.

### Deferred / backlog for later cycles

- **Per-score deep-dive pages** from the report (exact labelled
  reference ranges, Wellness Index, F/B ratio) — this cycle's reference
  bar is a generic Low/Typical/High band, not the report's precise
  per-score clinical thresholds.
- **Taxonomic/genus-level breakdown** (the report's genus-level bar
  chart and Krona sunburst) — no equivalent in the app yet.
- **12 disease-association deep-dives** (Positively/Negatively
  Associated bacteria tables per disease) — not started.
- **Nutrient/Supplement Report** (Fermented Food/Phytochemicals/
  Carbohydrates/Lipids/Proteins scored 0-10, branded probiotic/prebiotic
  recommendations) — not started.
- **Client-specific food exclusions overriding score** (the diet plan's
  pattern of excluding a disliked/intolerant food regardless of its
  Elevame score, e.g. the sample client's lamb and cinnamon) — not
  modeled in the app's food/plan data at all; would need a per-client
  exclusion list and a check wherever a food is recommended.
- Everything already listed in Cycle 0's backlog (loading skeletons,
  toast/name-chip overlap, dark mode, bundle-size code-splitting).

---

## Cycle 2 — real reference ranges, full bacteria panel, reworded pattern insights

### Why this cycle

The user shared a second, real 43-page Elevame report (Microbiome Analysis
+ Nutrient Scores + Supplements Report) and gave direct feedback on
Cycle 1's backlog:

1. **Reference ranges** — previously deferred as "we don't have the
   boundaries yet." They're actually in the report: every gut score page
   prints real named anchor points (e.g. Metabolic Score: 15 "Lean" / 35
   community / 72 "Overweight"). This cycle uses them.
2. **Taxonomy/sunburst** — explicitly deprioritized. The user's framing:
   "knowing what bacteria they have simply is useless... it must be added
   in context, such as when the report shows bacteria related to
   bloating or autoimmune diseases." No standalone taxonomy chart was
   built; bacteria are surfaced instead through the existing Key Bacteria
   drill-down, now covering all 9 bacteria the report actually tracks,
   each with a plain-language context paragraph.
3. **Disease-association wording** — useful content, but must not be
   framed as "disease risk." See below for the section this cycle built
   and the wording it uses instead.
4. **Nutrient scores** — deprioritized as "too much detail" for now. Not
   touched this cycle. The user also clarified the future workflow: two
   separate per-client uploads going forward — a "normal report" (food
   scores) and a "doctor's report" (clinical detail, excluding nutrient/
   food scores). Confirmed by reading the full 43-page PDF: pages 17-36
   ("Nutrient Scores Report") are purely the per-food 0-10 catalog across
   14 categories — i.e. what the "normal report" upload will contain.

### Implemented this cycle

- **Real reference-range labels** (`src/data/scoreReferenceRanges.js`):
  replaced Cycle 1's generic "Low / Typical / High" zone labels with the
  report's actual named extremes for all 13 gut scores (e.g. Bowel
  Mobility: "Decreased intestinal motility" / "Increased intestinal
  motility", ideal in the middle; Lactose Sensitivity: "No sensitivity" /
  "Lactose sensitivity"). The reference bar's gradient direction now
  follows each score's real "good side" (low/high/mid) instead of a
  generic purple gradient. `ScoreDetailSheet.jsx` updated accordingly.
- **Full 9-bacteria panel**: the report's "Important Bacteria" page tracks
  9 genera, not 3 — added Alistipes, Eubacterium, Collinsella,
  Haemophilus, Roseburia and Phascolarctobacterium to Key Bacteria
  (`gutScoresTemplate.js`), each with a context paragraph in
  `scoreDetails.js` (what it does, why it matters) rather than a bare
  percentage — this is the "context, not raw taxonomy" approach the user
  asked for. Bacteria detail sheets now render a simpler "you vs.
  community" comparison (matching the report's own bacteria page format)
  instead of the gut-score reference bar, since bacteria don't have a
  "good/bad direction" the way scores do.
- **Corrected screening panel** (`screeningTemplate.js`): replaced Cycle
  1's representative-but-invented organism list with the exact organisms
  and category names transcribed from the real "Bacteria and Diseases
  Report" page (Pathogenic Bacteria, Parasites, Fungi / Yeast, Dysbiotic /
  Overgrowth Bacteria, Potential Autoimmune Triggers — 29 organisms
  total, up from 19 placeholders).
- **"Similar profile patterns" section** (new, `SimilarProfilesReport.jsx`
  + `similar_profiles` table): the report's "Your Similar Profiles"
  content — how often a symptom shows up among people with a similar
  microbiome profile, vs. the population baseline — reworded away from
  "disease risk." Title is "Similar profile patterns," every card carries
  an explicit "Not a diagnosis" line, and condition names are shown as
  symptom/pattern labels rather than inside any "risk" framing.
  **Caveat worth flagging**: the underlying data is profile-similarity
  based (not a specific bacterium linked to a specific symptom), so
  "bacteria-symptom association" as literal wording would overstate what
  this data shows — used "similar profile patterns" instead, matching
  what the report itself actually measures.
- **Dashboard additions**: Wellness Index and Firmicutes/Bacteroidetes
  ratio cards (new `profiles.wellness_index` / `profiles.f_b_ratio`
  columns), and the Diversity card now shows a "Needs improvement /
  Average / Very good" band using the report's own 0–2.94 / 2.94–6.17 /
  6.17–10 thresholds — all derived from data already in hand, no new
  per-client upload needed.
- **Fixed a Cycle 1 inaccuracy**: the Protein Metabolism explanation
  claimed high fermentation was undesirable ("favours a middle range").
  The actual report says the opposite — high scores indicate a large,
  beneficial bacterial variety, same as Carb and Fat Metabolism. Fixed to
  match the source.

Verified with `npm run build` (clean), `npx eslint .` (clean, same 3
pre-existing warnings), and a headless smoke test: full Scores tab,
Bowel Mobility detail sheet (real reference-range labels + mid-good
gradient), and Alistipes detail sheet (value-vs-community format, no
zone bar) — no console errors.

### Deferred / backlog for later cycles

- **Nutrient/food score catalog** — explicitly out of scope this cycle.
  To be driven by the client's separate "normal report" (food) upload
  once that per-client upload flow exists; the real report's 14-category,
  ~250-food structure (pp.17-36 of the PDF read this cycle) is a good
  reference for that future data model, but no app changes were made
  toward it.
- Everything already listed in Cycle 0/1's backlog (loading skeletons,
  dark mode, bundle-size code-splitting, client-specific food exclusions
  overriding score).

---

<!-- Cycle 3 append below as it runs. -->
