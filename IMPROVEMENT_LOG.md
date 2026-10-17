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

<!-- Cycle 1, 2, 3 append below as they run. -->
