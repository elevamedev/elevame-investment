# Deferred features

Features explicitly requested but intentionally NOT built yet, so they aren't lost.

## Groups / gamified progress sharing

Requested alongside the v2 data model changes (item 7): people should be able to join
a "group" to see each other's progress, with some kind of gamification. Explicitly
deferred by the requester ("Not for now though") — no schema, no UI exists for this.

Worth scoping before building: what "progress" is shared (plan adherence? tracker
check-ins? score deltas across retests?), whether groups are opt-in and how private
health data (gut scores, conditions) is kept out of anything shown to a group, and
what the gamification mechanic actually is (streaks, badges, a leaderboard). The v2
`clients`/`tests` split and `symptom_checkins` table would need a new `groups` +
`group_members` table, plus explicit RLS deciding exactly what a group member can see
about another member — none of that exists today.
