import { t2 } from "./foods.js";

/* ============================================================
   SCREENING (pathogens, parasites, fungi, dysbiotic bacteria,
   autoimmune triggers) — addresses the gap where the app had no
   equivalent of the microbiome report's "Bacteria and Diseases
   Report" section. Same pattern as gutScoresTemplate.js: this is
   the default/seed shape, used as starter data via scripts/seed.mjs.
   A client's real findings live in the `screening_findings` table
   and are entered from their actual lab report (see
   supabase/schema.sql) — whoever processes the report (nutritionist
   or future lab-intake tool) should confirm the exact organism list
   against the lab's own panel before relying on this as final.

   status: 'not_detected' | 'detected'. abundance is only meaningful
   when status is 'detected' (percentage, 0-100).
============================================================ */
export const SCREENING_CATEGORY_ORDER = [
  "pathogenic_bacteria",
  "parasites",
  "fungi",
  "dysbiotic_bacteria",
  "autoimmune_triggers",
];

export const SCREENING_CATEGORY_LABELS = {
  pathogenic_bacteria: t2("Pathogenic Bacteria", "Bacterias Patógenas"),
  parasites: t2("Parasites", "Parásitos"),
  fungi: t2("Fungi / Yeast", "Hongos / Levaduras"),
  dysbiotic_bacteria: t2("Dysbiotic / Overgrowth Bacteria", "Bacterias Disbióticas / de Sobrecrecimiento"),
  autoimmune_triggers: t2("Potential Autoimmune Triggers", "Posibles Desencadenantes Autoinmunes"),
};

export const SCREENING_CATEGORY_NOTES = {
  pathogenic_bacteria: t2(
    "Bacteria that can cause acute gut infection if present in meaningful numbers.",
    "Bacterias que pueden causar una infección intestinal aguda si están presentes en cantidades significativas."
  ),
  parasites: t2(
    "Single-celled or multicellular organisms that can live in the gut and cause digestive symptoms.",
    "Organismos unicelulares o multicelulares que pueden vivir en el intestino y causar síntomas digestivos."
  ),
  fungi: t2(
    "Yeasts and moulds that are normally kept in check by bacterial diversity — overgrowth is usually the concern, not simple presence.",
    "Levaduras y mohos que normalmente están controlados por la diversidad bacteriana: el problema suele ser el sobrecrecimiento, no la simple presencia."
  ),
  dysbiotic_bacteria: t2(
    "Bacteria that are a normal part of many gut communities in small numbers, but are linked to symptoms when they overgrow.",
    "Bacterias que forman parte normal de muchas comunidades intestinales en pequeñas cantidades, pero que se asocian con síntomas cuando crecen en exceso."
  ),
  autoimmune_triggers: t2(
    "Bacteria research has linked to autoimmune activity via molecular mimicry or immune-system cross-reaction. A result here is a profile signal, not a diagnosis.",
    "Bacterias que la investigación ha relacionado con actividad autoinmune por mimetismo molecular o reacción cruzada del sistema inmunitario. Un resultado aquí es una señal de perfil, no un diagnóstico."
  ),
};

// Organism list and category grouping transcribed directly from a real
// Elevame "Bacteria and Diseases Report" (replacing Cycle 1's placeholder
// representative list, which was a reasonable guess but not the lab's
// actual panel).
export const SCREENING_DEFAULT = [
  // Pathogenic Bacteria
  { category: "pathogenic_bacteria", key: "campylobacter", name: t2("Campylobacter", "Campylobacter"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "campylobacter_jejuni", name: t2("Campylobacter jejuni", "Campylobacter jejuni"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "campylobacter_coli", name: t2("Campylobacter coli", "Campylobacter coli"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "campylobacter_upsaliensis", name: t2("Campylobacter upsaliensis", "Campylobacter upsaliensis"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "campylobacter_lari", name: t2("Campylobacter lari", "Campylobacter lari"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "c_difficile", name: t2("Clostridium difficile", "Clostridium difficile"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "plesiomonas", name: t2("Plesiomonas shigelloides", "Plesiomonas shigelloides"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "salmonella", name: t2("Salmonella", "Salmonella"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "yersinia", name: t2("Yersinia enterocolitica", "Yersinia enterocolitica"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "vibrio_parahaemolyticus", name: t2("Vibrio parahaemolyticus", "Vibrio parahaemolyticus"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "vibrio_vulnificus", name: t2("Vibrio vulnificus", "Vibrio vulnificus"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "vibrio_cholerae", name: t2("Vibrio cholerae", "Vibrio cholerae"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "h_pylori", name: t2("Helicobacter pylori", "Helicobacter pylori"), status: "not_detected" },

  // Parasites
  { category: "parasites", key: "cryptosporidium", name: t2("Cryptosporidium", "Cryptosporidium"), status: "not_detected" },
  { category: "parasites", key: "entamoeba", name: t2("Entamoeba histolytica", "Entamoeba histolytica"), status: "not_detected" },
  { category: "parasites", key: "giardia", name: t2("Giardia intestinalis", "Giardia intestinalis"), status: "not_detected" },

  // Fungi / Yeast
  { category: "fungi", key: "candida", name: t2("Candida", "Candida"), status: "not_detected" },
  { category: "fungi", key: "candida_albicans", name: t2("Candida albicans", "Candida albicans"), status: "not_detected" },

  // Dysbiotic / Overgrowth Bacteria
  { category: "dysbiotic_bacteria", key: "bacillus", name: t2("Bacillus", "Bacillus"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "e_faecalis", name: t2("Enterococcus faecalis", "Enterococcus faecalis"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "staphylococcus", name: t2("Staphylococcus", "Staphylococcus"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "s_aureus", name: t2("Staphylococcus aureus", "Staphylococcus aureus"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "streptococcus", name: t2("Streptococcus", "Streptococcus"), status: "not_detected" },

  // Potential Autoimmune Triggers
  { category: "autoimmune_triggers", key: "citrobacter", name: t2("Citrobacter", "Citrobacter"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "citrobacter_freundii", name: t2("Citrobacter freundii", "Citrobacter freundii"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "fusobacterium", name: t2("Fusobacterium", "Fusobacterium"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "klebsiella", name: t2("Klebsiella", "Klebsiella"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "klebsiella_pneumoniae", name: t2("Klebsiella pneumoniae", "Klebsiella pneumoniae"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "mycobacterium_avium", name: t2("Mycobacterium avium", "Mycobacterium avium"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "prevotella_copri", name: t2("Prevotella copri", "Prevotella copri"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "proteus", name: t2("Proteus", "Proteus"), status: "not_detected" },
  { category: "autoimmune_triggers", key: "proteus_mirabilis", name: t2("Proteus mirabilis", "Proteus mirabilis"), status: "not_detected" },
];
