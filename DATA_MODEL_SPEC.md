# Elevame Report Data Model

Oct 18, 2026 · @Amina

## Purpose and sources

This spec defines how every Enbiosis report is stored in Supabase so app.elevame.es can show insights by theme, score foods, and compare retests. It is the brief for Claude Code to reorganise the database and the app.

Each test (one stool sample, one kit code) produces two PDFs. We store both against the same test.

| Source | Pages | What we take from it | What we ignore |
| --- | --- | --- | --- |
| Doctor report | about 49 | All analysis: headline metrics, genus breakdown, key bacteria, 13 gut scores, safety screen, risk analysis, condition tables, pathway tables, compound nutrient scores (clinician only), supplements, references | Nothing. The compound nutrient section is stored but never shown to clients |
| User report | about 40 | Whole food scores across 14 categories, top picks / fit / avoid lists | Analysis pages that repeat the doctor report |

Worked example used throughout: kit ELVMWB6271, report date 2026-09-24, male, 71. The client's name is never stored in report tables, only in the clients table.

## Design principles

The database splits into two halves: a catalogue that is the same for every client, and per test results that change every time.

1. **Catalogue vs results.** Names of metrics, bacteria, conditions, foods and supplements live once in catalogue tables. Each test only stores values and comments that point at catalogue ids. This makes retest comparison a simple join.
2. **Report comments are data.** Enbiosis writes interpretation text that changes per client (for example "It appears that your microbiome is younger than you!" or "Poor, With Need For Improvement"). We store this text verbatim, with the section and page it came from. Explanatory text that is identical in every report goes in the catalogue instead.
3. **Keep the raw value and the computed status.** Store what the PDF printed (value, colour badge, label) and what our own rules compute. If they disagree, we flag it.
4. **One source of truth per bacterium.** The same bacterium can carry different statuses in different tables of one report. We store every reading with its context, then resolve one status per test (see Data quality rules).
5. **Every insight belongs to a theme.** Metrics, bacteria, conditions and pathways are each tagged to one of the themes below, so the app can build theme pages without hard coding.
6. **Bilingual by id.** Every catalogue row has one canonical id with name\_en and name\_es (French can be added later as name\_fr). Scores never depend on language.
7. **Two audiences, one dataset.** Every catalogue row and every insight has an audience: client, clinician, or both. Row level security enforces it.
8. **Nutritionist overrides.** Food scores are never edited. Instead, a review flag or a client intolerance hides or annotates a food for that client.

## Theme catalogue

The app is organised around six analysis themes and three action layers. These are seed rows for the `themes` table.

| id | Name (EN) | Name (ES) | Client question | Metrics | Conditions and pathways |
| --- | --- | --- | --- | --- | --- |
| overview | Your gut at a glance | Tu intestino de un vistazo | How healthy is my gut overall? | Microbiome age, diversity, wellness index, F/B ratio | None |
| digestion | Digestion and comfort | Digestión y bienestar | Why do I feel how I feel after eating? | Bowel mobility, carbohydrate, protein and fat metabolism | Diarrhoea, gas, constipation, bloating, IBS |
| metabolism | Metabolism and weight | Metabolismo y peso | How does my gut handle energy and sugar? | Metabolic score, sugar index | Obesity, type 2 diabetes |
| inflammation | Inflammation and gut lining | Inflamación y barrera intestinal | Is my gut protecting me? | Processed food index, antibiotic damage, autoimmune index | IBD, Crohn's, ulcerative colitis, butyrate, propionate, polyamine biosynthesis |
| heart | Heart and long term health | Corazón y salud a largo plazo | What should I keep an eye on? | None | Coronary heart disease, kidney stone, TMA conversion |
| mind | Mind, sleep and vitamins | Mente, sueño y vitaminas | How does my gut affect my energy and mood? | Sleep quality, vitamin synthesis | Serotonin, GABA biosynthesis |
| safety | Safety screen | Control de seguridad | Is anything harmful there? | None | Pathogens, parasites, fungi, overgrowth bacteria, autoimmune triggers |
| food | What to eat | Qué comer | What should I eat more or less of? | None | Food scores |
| supplements | Supplements | Suplementos | Which supplements fit me? | None | Prebiotics, probiotics |

Lactose and gluten sensitivity sit under **digestion**. The similar profiles results are tagged to whichever theme the condition belongs to (for example heart related disorders go to **heart**, food allergy to **digestion**, attention disorders to **mind**).

## Catalogue tables (same for every client)

These 14 tables are seeded once from the doctor and user report templates and only change when Enbiosis adds items.

| Table | Holds | Key columns | Seed count from example |
| --- | --- | --- | --- |
| themes | The 9 themes above | id, name\_en, name\_es, client\_question\_en/es, sort\_order | 9 |
| metrics | Headline metrics and the 13 gut scores | id, theme\_id, name\_en/es, kind (headline / gut\_score), direction, scale\_min, scale\_max, explanation\_en/es (static text), audience | 4 headline + 13 gut scores |
| taxa | Every bacterium, archaeon, fungus or parasite named anywhere in the report | id, name, rank (phylum / family / genus / species), parent\_id, roles\[\] (butyrate, propionate, mucus, TMA, probiotic, pathogen...), audience | about 120 |
| conditions | Symptoms, diseases and pathways from the risk analysis and condition pages | id, theme\_id, kind (symptom / disease / pathway), name\_en/es, explanation\_en/es | 12 conditions + 6 pathways |
| condition\_taxa | Which bacteria raise or lower each condition | condition\_id, taxon\_id, association (positive / negative), reference\_ids\[\] | about 100 rows |
| similar\_conditions | Conditions used in the similar profiles panel | id, theme\_id, name\_en/es | 8 seen, list may grow |
| screen\_panels | The 5 safety panels | id (pathogens, parasites, fungi, overgrowth, autoimmune\_triggers), name\_en/es | 5 |
| screen\_items | Organisms in each panel | panel\_id, taxon\_id | 33 unique |
| food\_categories | The 14 user report categories | id, name\_en/es, sort\_order, shopping\_list\_group | 14 |
| foods | Every whole food scored in the user report | id, category\_id, name\_en/es, image\_url, common\_in\_spain (bool), use\_in\_plans (bool, false for mutton and goat), family (for example allium, zingiberaceae) | about 330 |
| compound\_groups | The 5 compound sections | id (fermented, phytochemicals, carbohydrates, lipids, proteins) | 5 |
| compounds | Compound level nutrients (clinician only) | id, group\_id, name, strain (for fermented foods), linked\_food\_ids\[\] | about 200 |
| supplements | Prebiotic and probiotic products | id, type (prebiotic / probiotic), product, brand, region (UK / US / EU / ES), eu\_equivalent\_id | 20 seen |
| references | Numbered literature references (table name references\_lit, since references is reserved in SQL) | id, number, citation, doi\_url | 70 |

`foods.family` and `compounds.linked_food_ids` let the app explain mismatches, for example why ginger (2) and turmeric (4) score low while curcumin scores 9.

## Per test tables (values and comments that change per report)

Every row below carries `test_id`. Values that print in the PDF also carry `source_document_id` and `page`, so any number can be traced back.

**Clients, kits and tests**

| Table | Holds | Key columns |
| --- | --- | --- |
| clients | One row per person | id, auth\_user\_id, name, sex, birth\_year, language, ghl\_contact\_id |
| kits | One row per kit sold | id, client\_id, kit\_code (ELVMWB6271), status (synced from GoHighLevel), dispatched\_at, received\_at |
| tests | One row per analysed sample | id, kit\_id, client\_id, test\_number (1, 2, 3 for retests), report\_date, age\_at\_test, parse\_status, reviewed\_by, published\_at |
| source\_documents | The two PDFs per test | id, test\_id, type (doctor / user), storage\_path, enbiosis\_version, parsed\_at |

**Analysis results**

| Table | Holds | Key columns | Example row |
| --- | --- | --- | --- |
| metric\_results | Value of each headline metric and gut score | metric\_id, value, value\_text, community\_value, printed\_badge (good / watch / act), computed\_status, printed\_comment | bowel\_mobility, 69, community 35, badge act |
| metric\_markers | The reference markers drawn on each score bar | metric\_id, label\_en (as printed), value | bowel\_mobility, "Increased intestinal motility", 69 |
| genus\_abundance | Genus breakdown vs world average | taxon\_id, client\_pct, world\_pct | Roseburia, 17.7, 0.7 |
| key\_bacteria | The 9 important bacteria bars | taxon\_id, client\_score, community\_score | Akkermansia, 7, 78 |
| krona\_abundance | Krona chart slices (clinician) | taxon\_id, pct | Ruminococcus, 22 |
| taxon\_readings | Every status a bacterium gets anywhere in the report, with context | taxon\_id, context\_type (screen / condition / pathway), context\_id, status (not\_detected / low / normal / high), abundance\_pct | Bacillus, pathway tma, high |
| taxon\_status | One resolved status per bacterium per test | taxon\_id, status, rule\_applied, has\_conflict | Bacillus, high, "detected beats not detected", true |
| condition\_results | Risk analysis summary | condition\_id, at\_risk (bool), flagged\_taxon\_ids\[\], printed\_text | ulcerative\_colitis, true, \[Dorea, Ruminococcus\] |
| similar\_profile\_results | Similar profiles panel | similar\_condition\_id, client\_pct, overall\_pct | heart\_related, 10, 2.5 |
| screen\_results | Safety screen | screen\_item\_id, status, abundance\_pct | Salmonella, not\_detected |

**Nutrition results**

| Table | Holds | Key columns | Example row |
| --- | --- | --- | --- |
| food\_scores | Whole food scores from the user report | food\_id, score (0 to 10), band (prioritise / include / reduce, computed) | radish, 10, prioritise |
| food\_highlights | The three short lists on the user report summary page | food\_id, list (top / fit / avoid), position | ginger, avoid, 6 |
| compound\_scores | Compound nutrient scores (clinician only) | compound\_id, score | curcumin, 9 |
| supplement\_scores | Supplement ratings | supplement\_id, score (decimal) | Omni-biotic 10 AAD, 9.6 |

**Comments and context that change per report**

This is the catch all for any text Enbiosis writes about this specific client.

| Table | Holds | Key columns |
| --- | --- | --- |
| report\_comments | Every piece of client specific text, verbatim | section\_key, metric\_id / condition\_id (optional), text, language, source\_document\_id, page |

Examples from kit ELVMWB6271 that must land in `report_comments` or `printed_comment`:

| section\_key | Text as printed |
| --- | --- |
| microbiome\_age | It appears that your microbiome is younger than you! The personalized nutrition plan we've put together for you, will help you keep your microbiome young longer! |
| wellness\_index | Your Wellness Index is high, indicating a low risk of chronic disease. The microbiome profile is not associated with chronic disease linked microbial patterns. |
| diversity | Poor, With Need For Improvement: Although you have a pretty low level of diversity, our personalized nutrition plan will help you improve it... |
| fb\_ratio | Your F/B ratio is high. This means Firmicutes are more dominant, which may be linked to increased calorie extraction... |
| risk\_analysis | One line per condition: either "The bacteria are not at risk levels" or the bacteria names |

**Our own layer (written by Elevame, not Enbiosis)**

| Table | Holds | Key columns |
| --- | --- | --- |
| insights | The text shown on each theme page | theme\_id, status (good / watch / act), title\_en/es, client\_text\_en/es, clinician\_text, linked\_metric\_ids\[\], linked\_taxon\_ids\[\], linked\_condition\_ids\[\], linked\_food\_ids\[\], author (ai / nutritionist), approved (bool) |
| food\_review\_flags | Foods that need a nutritionist's eye for this client | food\_id, reason, theme\_id, action (hide / annotate / keep), note\_en/es, reviewed\_by |
| client\_intolerances | Foods the client says harm them | client\_id, food\_id or family, severity, source (consultation / symptom tracker) |
| data\_quality\_issues | Conflicts found while parsing | issue\_type, detail, taxon\_id / metric\_id, resolved (bool) |
| symptom\_checkins | The 4 milestone check ins | client\_id, test\_id, milestone (baseline, end\_phase\_1/2/3), energy, digestion, sleep, mood, bloating, notes |

## Status and direction rules

Every metric needs a direction, or the app will colour scores the wrong way. The PDF badge (blue plus = good, beige diamond = watch, red cross = act) is stored as `printed_badge`; our status is computed from these rules and compared against it.

| Metric | Direction | Example value | Printed badge |
| --- | --- | --- | --- |
| Microbiome age | below\_age (better when lower than age\_at\_test) | 62 at age 71 | good |
| Diversity | higher\_better, fixed bands: 0 to 2.94 act, 2.94 to 6.17 watch, 6.17 to 10 good | 0.5 | act |
| F/B ratio | flag\_high (no fixed band published yet) | 6.3 | act |
| Wellness index | categorical (store the word) | Good | good |
| Carbohydrate metabolism | higher\_better | 47 | watch |
| Protein metabolism | higher\_better | 19 | watch |
| Fat metabolism | higher\_better | 48 | good |
| Vitamin synthesis | higher\_better | 72 | watch |
| Sleep quality | higher\_better | 74 | watch |
| Metabolic score | lower\_better | 45 | watch |
| Lactose sensitivity | lower\_better | 26 | watch |
| Gluten sensitivity | lower\_better | 16 | good |
| Sugar index | lower\_better | 68 | watch |
| Processed food index | lower\_better | 68 | act |
| Antibiotic damage | lower\_better | 63 | watch |
| Autoimmune index | lower\_better | 23 | good |
| Bowel mobility | middle\_best (ideal between the two markers) | 69 | act |

**Computing status.** Use the metric's own markers from `metric_markers` (for example "No sensitivity" 15 and "Lactose sensitivity" 82) to place the value. Until Enbiosis confirms their cut offs, the printed badge wins and the computed status is used only to flag disagreements.

**Food bands.** 8 to 10 = Prioritise / Prioriza, 4 to 7 = Include / Incluye, 0 to 3 = Reduce. Badge colours: teal #1fb6b6, amber #e3a95e, red #e2574c. Never use any other wording.

**Key bacteria.** Status comes from client score vs community score. A gap of 20 points or more either way is flagged (for example Akkermansia 7 vs 78, Roseburia 19 vs 2). Whether high is good depends on the taxon's role, stored in `taxa.roles`.

## Extraction map

The parser should find sections by their heading text, not by page number, because page counts shift when a client has more or fewer flagged items. Page numbers below are from the example only.

**Doctor report**

| Section heading | Example page | Goes to | Static text (catalogue) | Changing text (per test) |
| --- | --- | --- | --- | --- |
| Welcome to your microbiome world | 2 | metric\_results (all 13 scores + age + diversity, with badge) | Intro paragraph | Values, badges |
| Your Microbiome Age / Wellness Index | 3 | metric\_results | Explanation paragraphs | Value, italic comment |
| Your Microbiome Diversity / F/B Ratio | 4 | metric\_results | Band explanations | Value, italic comment |
| Your Taxonomic Analysis | 5 | genus\_abundance | Taxonomy explainer | Client % and world % per genus |
| Krona Analysis | 6 | krona\_abundance | Explainer | Slice percentages |
| Important Bacteria | 7 to 8 | key\_bacteria | None | Client and community scores |
| Your Similar Profiles | 9 | similar\_profile\_results | Explainer, note | Which conditions appear, client % and overall % |
| Pathogenic Bacteria to Potential Autoimmune Triggers | 10 to 11 | screen\_results, taxon\_readings | None | Status, abundance |
| Risk Analysis (two tables) | 12 | condition\_results | None | At risk flag and bacteria names |
| Metabolic Score to Sleep Quality | 14 to 18 | metric\_markers | Score explanations | Value, community value, marker labels and values |
| Diarrhea to Kidney Stone, Anti-inflammatory Activity, TMA Conversion, Bacterial Neurotransmitters | 19 to 32 | condition\_taxa (catalogue), taxon\_readings (per test) | Condition explanations, association direction, reference numbers | Status per bacterium (Low / Normal / High / Not Detected) |
| Nutrient Suggestions to Proteins | 33 to 41 | compound\_scores | Score band explainer | Score per compound |
| Prebiotics, Probiotics | 44 to 45 | supplement\_scores | Supplements explainer | Products listed and their scores |
| References | 46 to 48 | references\_lit (catalogue) | All | None |

**User report**

| Section heading | Example page | Goes to | Notes |
| --- | --- | --- | --- |
| Here's Your Food! / Foods That Fit With You! / Foods To Avoid! | 19 | food\_highlights | 6 foods per list |
| Milk and Dairy Products to Others (14 categories) | 20 to 36 | food\_scores | Category heading maps to food\_categories; a food can appear in two categories (lobster, Gruyère) with one score |
| All other pages | 1 to 18, 37 to 40 | Skip | Duplicates of doctor report |

**Validation after parsing**

- The 13 gut scores on the dashboard page must equal the values on the detail pages.
- The same food appearing in two sections must have the same score.
- Every food and compound name must match a catalogue row. Unknown names go to `data_quality_issues` and the test stays unpublished until reviewed.
- Kit code and report date must match on both PDFs.

## Data quality rules and known conflicts

The example report already contains conflicts, so the database must expect them rather than assume one clean value.

**Resolving a bacterium's status (taxon\_status)**

1. Any reading of Low, Normal or High beats Not Detected. A detected reading comes from a measured abundance; Not Detected in a screen can mean below that panel's threshold.
2. If two detected readings disagree (Low vs High), keep both, set `has_conflict = true`, and show the clinician view only.
3. Species and genus are separate taxa. Prevotella (genus) and Prevotella copri (species) never overwrite each other.

**Conflicts seen in kit ELVMWB6271**

| Type | Detail | Handling |
| --- | --- | --- |
| Status conflict | Bacillus: Not Detected in overgrowth panel, High in TMA table | Rule 1, flag |
| Status conflict | Prevotella copri: Not Detected in autoimmune triggers, Low in propionate table | Rule 1, flag |
| Catalogue conflict | Dorea listed as positively associated with ulcerative colitis but negatively with Crohn's | Store as printed in condition\_taxa; ask Enbiosis |
| Duplicate row | Campylobacter coli appears twice in the pathogen panel | Deduplicate on import |
| Compound vs food | Curcumin 9 but turmeric 4; omega 3 fatty acids 1 and salmon 2 but fish oil supplement 8; FOS 2 but garlic and onion 6 | Expected; never show compound scores to clients |
| Signal vs signal | Wellness index Good while diversity is 0.5 (act) | Insight text must explain both |

**Clinical review flags (food\_review\_flags)**

A food is flagged for nutritionist review when it scores 8 to 10 but conflicts with an at risk theme for that client. Seed rules:

- Heart theme at risk (TMA bacteria high, or heart related in similar profiles above overall) AND age 60 or over: flag foods high in saturated fat (ghee 10, lard 9, mascarpone 10, double cream 9, pork 9 in the example).
- Any client intolerance: hide that food whatever its score; when the intolerance is recorded by family (for example allium), hide the whole family.
- Never put mutton or goat in plans (`foods.use_in_plans = false`).

## Client view vs clinician view

One dataset feeds both views; the `audience` column and row level security decide what each role can read.

| Data | Client | Clinician (Elevame team and partner nutritionists) |
| --- | --- | --- |
| Theme pages and approved insights | Yes | Yes, plus clinician\_text |
| Headline metrics and 13 gut scores | Yes | Yes |
| Genus breakdown and key bacteria | Simplified (top 6 genera, key bacteria with plain labels) | Full, plus Krona |
| Safety screen | One "all clear" card, expandable | Full panels |
| Risk analysis and condition tables | Only as worded insights, never disease names alone | Full tables with bacteria and references |
| Similar profiles | Hidden until we agree the wording | Yes |
| Food scores | Yes, with review flags applied | Yes, with flags visible |
| Compound nutrient scores | Never | Yes |
| Supplements | EU equivalents only | Original list plus EU equivalents |
| report\_comments | Only sections we choose to show | All |
| data\_quality\_issues | Never | Yes |

**Roles:** `client` (reads own tests only, and only once `tests.published_at` is set), `clinician` (reads tests of clients assigned to them), `admin` (everything, can approve insights and publish tests).

**Publishing flow:** parse both PDFs, run validation, resolve conflicts, generate draft insights, nutritionist reviews flags and approves insights, then publish. Clients see nothing before publish.

## SQL schema draft

A starting point for Claude Code. Postgres on Supabase; catalogue ids are readable text slugs, per test rows use uuids. RLS policies are left to Claude Code, following the roles above.

```sql
-- ===== Catalogue =====
create table themes (
  id text primary key,                 -- 'overview', 'digestion', ...
  name_en text not null, name_es text not null,
  client_question_en text, client_question_es text,
  sort_order int not null
);

create table metrics (
  id text primary key,                 -- 'bowel_mobility'
  theme_id text references themes,
  kind text check (kind in ('headline','gut_score')),
  name_en text not null, name_es text not null,
  direction text check (direction in ('higher_better','lower_better','middle_best','below_age','flag_high','categorical')),
  scale_min numeric, scale_max numeric,
  explanation_en text, explanation_es text,
  audience text default 'both' check (audience in ('client','clinician','both'))
);

create table taxa (
  id text primary key,                 -- 'akkermansia_muciniphila'
  name text not null,
  rank text check (rank in ('phylum','class','order','family','genus','species')),
  parent_id text references taxa,
  roles text[] default '{}',           -- {'butyrate','mucus','tma','probiotic','pathogen'}
  audience text default 'clinician'
);

create table conditions (
  id text primary key,                 -- 'ulcerative_colitis', 'tma_conversion'
  theme_id text references themes,
  kind text check (kind in ('symptom','disease','pathway')),
  name_en text not null, name_es text not null,
  explanation_en text, explanation_es text
);

create table references_lit (
  id int primary key, citation text not null, doi_url text
);

create table condition_taxa (
  condition_id text references conditions,
  taxon_id text references taxa,
  association text check (association in ('positive','negative')),
  reference_ids int[] default '{}',
  primary key (condition_id, taxon_id)
);

create table similar_conditions (
  id text primary key, theme_id text references themes,
  name_en text not null, name_es text not null
);

create table screen_panels (id text primary key, name_en text, name_es text);
create table screen_items (
  panel_id text references screen_panels, taxon_id text references taxa,
  primary key (panel_id, taxon_id)
);

create table food_categories (
  id text primary key, name_en text, name_es text,
  sort_order int, shopping_list_group text
);

create table foods (
  id text primary key,                 -- 'radish'
  category_id text references food_categories,
  name_en text not null, name_es text not null,
  image_url text, family text,
  common_in_spain boolean default true,
  use_in_plans boolean default true
);

create table compound_groups (id text primary key, name_en text);
create table compounds (
  id text primary key, group_id text references compound_groups,
  name text not null, strain text, linked_food_ids text[] default '{}'
);

create table supplements (
  id text primary key,
  type text check (type in ('prebiotic','probiotic')),
  product text not null, brand text,
  region text, eu_equivalent_id text references supplements
);

-- ===== Clients, kits, tests =====
create table clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users,
  name text, sex text, birth_year int, language text default 'es',
  ghl_contact_id text
);

create table kits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients,
  kit_code text unique not null,       -- 'ELVMWB6271'
  status text, dispatched_at timestamptz, received_at timestamptz
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid references kits, client_id uuid references clients,
  test_number int not null, report_date date, age_at_test int,
  parse_status text default 'pending', reviewed_by uuid,
  published_at timestamptz
);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  type text check (type in ('doctor','user')),
  storage_path text not null, enbiosis_version text, parsed_at timestamptz
);

-- ===== Per test results =====
create table metric_results (
  test_id uuid references tests on delete cascade,
  metric_id text references metrics,
  value numeric, value_text text, community_value numeric,
  printed_badge text check (printed_badge in ('good','watch','act')),
  computed_status text, printed_comment text,
  source_document_id uuid references source_documents, page int,
  primary key (test_id, metric_id)
);

create table metric_markers (
  test_id uuid references tests on delete cascade,
  metric_id text references metrics,
  label_en text, value numeric
);

create table genus_abundance (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, client_pct numeric, world_pct numeric,
  primary key (test_id, taxon_id)
);

create table key_bacteria (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, client_score numeric, community_score numeric,
  primary key (test_id, taxon_id)
);

create table krona_abundance (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, pct numeric
);

create table taxon_readings (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa,
  context_type text check (context_type in ('screen','condition','pathway')),
  context_id text,
  status text check (status in ('not_detected','low','normal','high')),
  abundance_pct numeric, page int
);

create table taxon_status (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa,
  status text, rule_applied text, has_conflict boolean default false,
  primary key (test_id, taxon_id)
);

create table condition_results (
  test_id uuid references tests on delete cascade,
  condition_id text references conditions,
  at_risk boolean, flagged_taxon_ids text[] default '{}', printed_text text,
  primary key (test_id, condition_id)
);

create table similar_profile_results (
  test_id uuid references tests on delete cascade,
  similar_condition_id text references similar_conditions,
  client_pct numeric, overall_pct numeric,
  primary key (test_id, similar_condition_id)
);

create table screen_results (
  test_id uuid references tests on delete cascade,
  panel_id text, taxon_id text,
  status text, abundance_pct numeric,
  foreign key (panel_id, taxon_id) references screen_items,
  primary key (test_id, panel_id, taxon_id)
);

create table food_scores (
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  score int check (score between 0 and 10),
  band text generated always as (
    case when score >= 8 then 'prioritise' when score >= 4 then 'include' else 'reduce' end
  ) stored,
  primary key (test_id, food_id)
);

create table food_highlights (
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  list text check (list in ('top','fit','avoid')), position int
);

create table compound_scores (
  test_id uuid references tests on delete cascade,
  compound_id text references compounds, score int,
  primary key (test_id, compound_id)
);

create table supplement_scores (
  test_id uuid references tests on delete cascade,
  supplement_id text references supplements, score numeric,
  primary key (test_id, supplement_id)
);

create table report_comments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  section_key text not null,
  metric_id text references metrics, condition_id text references conditions,
  text text not null, language text default 'en',
  source_document_id uuid references source_documents, page int,
  show_to_client boolean default false
);

-- ===== Elevame layer =====
create table insights (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  theme_id text references themes,
  status text check (status in ('good','watch','act')),
  title_en text, title_es text,
  client_text_en text, client_text_es text, clinician_text text,
  linked_metric_ids text[] default '{}', linked_taxon_ids text[] default '{}',
  linked_condition_ids text[] default '{}', linked_food_ids text[] default '{}',
  author text check (author in ('ai','nutritionist')),
  approved boolean default false
);

create table food_review_flags (
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  reason text, theme_id text references themes,
  action text check (action in ('hide','annotate','keep')),
  note_en text, note_es text, reviewed_by uuid,
  primary key (test_id, food_id)
);

create table client_intolerances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  food_id text references foods, family text,
  severity text, source text check (source in ('consultation','symptom_tracker'))
);

create table data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  issue_type text, detail text,
  taxon_id text, metric_id text, resolved boolean default false
);

create table symptom_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  test_id uuid references tests,
  milestone text check (milestone in ('baseline','end_phase_1','end_phase_2','end_phase_3')),
  energy int, digestion int, sleep int, mood int, bloating int, notes text,
  created_at timestamptz default now()
);
```

## Open questions and instructions for Claude Code

**Questions for Enbiosis**

- [ ] Can we get these values through the API as JSON instead of parsing PDFs? If yes, the extraction map becomes a field mapping.
- [ ] Are the score bar markers (for example Lean 15, Overweight 72) fixed for everyone or recalculated per report?
- [ ] What are the cut offs behind the printed badges for each gut score?
- [ ] How are whole food scores derived: from compound composition or from separate food studies?
- [ ] Is the Dorea association for Crohn's vs ulcerative colitis correct?

**Questions for us**

- [ ] Do we show the similar profiles panel to clients, and with what wording?
- [ ] Which `report_comments` sections do we show to clients as printed, and which do we rewrite in our own voice?
- [ ] Do partner nutritionists get the full clinician view, including compound scores?

**Instructions for Claude Code**

1. Read this doc in full, then compare it with the current Supabase schema and the app in the elevamedev/elevame-investment repo. List what already exists, what changes, and what is new before touching anything.
2. Write migrations that create the catalogue tables first, then per test tables, then the Elevame layer. Do not drop existing tables with client data; migrate their rows.
3. Seed `themes`, `metrics` (with directions from the Status and direction rules table), `food_categories` and `screen_panels` from this doc.
4. Build the parser as a separate script that takes the two PDFs and a kit code, finds sections by heading text, fills the per test tables, and writes every conflict to `data_quality_issues`. Test it on kit ELVMWB6271 and check every value against the PDFs.
5. Add RLS policies for the client, clinician and admin roles as described in Client view vs clinician view.
6. Restructure the app navigation around the theme pages, the food page and the supplements page, reading only from these tables.
7. Keep the app UI decoupled from Enbiosis: the app reads Supabase only, never the PDFs or the Enbiosis API directly.
