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
  pathogenic_bacteria: t2("Pathogenic bacteria", "Bacterias patógenas"),
  parasites: t2("Parasites", "Parásitos"),
  fungi: t2("Fungi", "Hongos"),
  dysbiotic_bacteria: t2("Dysbiotic bacteria", "Bacterias disbióticas"),
  autoimmune_triggers: t2("Autoimmune triggers", "Desencadenantes autoinmunes"),
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

export const SCREENING_DEFAULT = [
  // Pathogenic bacteria
  { category: "pathogenic_bacteria", key: "c_diff", name: t2("Clostridioides difficile", "Clostridioides difficile"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "salmonella", name: t2("Salmonella spp.", "Salmonella spp."), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "campylobacter", name: t2("Campylobacter jejuni", "Campylobacter jejuni"), status: "not_detected" },
  { category: "pathogenic_bacteria", key: "shigella", name: t2("Shigella spp.", "Shigella spp."), status: "not_detected" },

  // Parasites
  { category: "parasites", key: "giardia", name: t2("Giardia duodenalis", "Giardia duodenalis"), status: "not_detected" },
  { category: "parasites", key: "blastocystis", name: t2("Blastocystis hominis", "Blastocystis hominis"), status: "not_detected" },
  { category: "parasites", key: "entamoeba", name: t2("Entamoeba histolytica", "Entamoeba histolytica"), status: "not_detected" },
  { category: "parasites", key: "cryptosporidium", name: t2("Cryptosporidium spp.", "Cryptosporidium spp."), status: "not_detected" },

  // Fungi
  { category: "fungi", key: "c_albicans", name: t2("Candida albicans", "Candida albicans"), status: "not_detected" },
  { category: "fungi", key: "c_glabrata", name: t2("Candida glabrata", "Candida glabrata"), status: "not_detected" },
  { category: "fungi", key: "aspergillus", name: t2("Aspergillus spp.", "Aspergillus spp."), status: "not_detected" },

  // Dysbiotic bacteria
  { category: "dysbiotic_bacteria", key: "klebsiella", name: t2("Klebsiella pneumoniae", "Klebsiella pneumoniae"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "desulfovibrio", name: t2("Desulfovibrio spp.", "Desulfovibrio spp."), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "fusobacterium", name: t2("Fusobacterium nucleatum", "Fusobacterium nucleatum"), status: "not_detected" },
  { category: "dysbiotic_bacteria", key: "strep_overgrowth", name: t2("Streptococcus spp. (overgrowth)", "Streptococcus spp. (sobrecrecimiento)"), status: "not_detected" },

  // Autoimmune triggers
  { category: "autoimmune_triggers", key: "klebsiella_aut", name: t2("Klebsiella pneumoniae", "Klebsiella pneumoniae"), status: "not_detected",
    note: t2("Linked in research to ankylosing spondylitis via molecular mimicry.", "Relacionada en la investigación con la espondilitis anquilosante por mimetismo molecular.") },
  { category: "autoimmune_triggers", key: "proteus", name: t2("Proteus mirabilis", "Proteus mirabilis"), status: "not_detected",
    note: t2("Linked in research to rheumatoid arthritis via molecular mimicry.", "Relacionada en la investigación con la artritis reumatoide por mimetismo molecular.") },
  { category: "autoimmune_triggers", key: "p_copri", name: t2("Prevotella copri", "Prevotella copri"), status: "not_detected",
    note: t2("Overgrowth has been associated with new-onset rheumatoid arthritis in several studies.", "El sobrecrecimiento se ha asociado con la aparición de artritis reumatoide de inicio reciente en varios estudios.") },
];
