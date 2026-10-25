# Backlog

Lower-priority follow-ups, logged so they aren't lost — not being worked on right now.

## Data quality review workflow (admin panel)

The admin review panel (`src/views/AdminView.jsx`, `src/hooks/useAdminData.js`) ships a
working first pass: resolve `data_quality_issues`, see clinician-only at-risk conditions,
write/approve insights, flag foods, publish/unpublish. Deprioritized for now — further
polish (bulk actions, filtering/sorting the issue list, a real "review complete" gate
before publish, clinician-to-client assignment UI) is backlog, not active work.

See `FUTURE_FEATURES.md` for the other deferred item (groups/gamification).
