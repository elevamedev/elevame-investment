import { t2 } from "./foods.js";

/* ============================================================
   SIMILAR PROFILE PATTERNS — the report's "Your Similar Profiles"
   section: how often a given symptom/condition shows up among
   people whose microbiome profile is similar to this client's,
   compared with the overall population baseline.

   Deliberately NOT framed as "disease risk" — the underlying model
   links profile similarity to an outcome, not a specific bacterium
   to a symptom, so a stronger causal claim than that isn't something
   this data actually supports. Every surface says "pattern", not
   "risk", and the non-diagnostic disclaimer is always shown with it.

   This is per-client data (varies enormously client to client) and
   lives in the `similar_profiles` table — this file is just the
   seed/default shape, reusing the sample client's real report values
   as the starter template (same precedent as GUT_SCORES_DEFAULT).
============================================================ */
export const SIMILAR_PROFILES_DEFAULT = [
  { key: "autoimmune", label: t2("Autoimmune Disorder(s)", "Trastorno(s) Autoinmune(s)"), client_pct: 29, baseline_pct: 9.4 },
  { key: "ibd", label: t2("Inflammatory Bowel Issues", "Problemas Intestinales Inflamatorios"), client_pct: 29, baseline_pct: 4.2 },
  { key: "skin", label: t2("Skin Related Disorders", "Trastornos Relacionados con la Piel"), client_pct: 21, baseline_pct: 18.3 },
  { key: "food_allergy", label: t2("Food Allergy", "Alergia Alimentaria"), client_pct: 15, baseline_pct: 10.7 },
  { key: "migraine", label: t2("Migraine", "Migraña"), client_pct: 15, baseline_pct: 12.9 },
  { key: "blood_sugar", label: t2("Blood Sugar Related Disorders", "Trastornos Relacionados con el Azúcar en Sangre"), client_pct: 3, baseline_pct: 1.7 },
];
