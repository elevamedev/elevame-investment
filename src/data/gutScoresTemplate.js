import { t2 } from "./foods.js";
import { C } from "../theme.js";

/* ============================================================
   DEFAULT GUT SCORES — used as seed data for a new client via
   scripts/seed.mjs. In production each client's real values come
   from their Elevame microbiome report and live in the
   `gut_scores` table, not here.
   tag: 'focus' | 'strength' | 'onTrack' — drives the pill colour.
============================================================ */
export const TAGS = {
  focus: { color: C.purple },
  strength: { color: C.sage },
  onTrack: { color: C.textSoft },
};

export const MICROBIOME_AGE_DEFAULT = 64;
export const DIVERSITY_DEFAULT = { value: 1.1, max: 10 };

export const GUT_SCORES_DEFAULT = [
  { key: "metabolic", label: t2("Metabolic Score","Score Metabólico"), value: 29, avg: 35, tag: "strength",
    note: t2("Lower than the community average — a profile that tends to stay lean.","Más bajo que la media de la comunidad: un perfil que tiende a mantenerse delgado.") },
  { key: "carb", label: t2("Carbohydrate Metabolism","Metabolismo de Carbohidratos"), value: 48, avg: 48, tag: "onTrack",
    note: t2("Right at the community average for carb-digesting bacteria.","Justo en la media de la comunidad para las bacterias que digieren carbohidratos.") },
  { key: "protein", label: t2("Protein Metabolism","Metabolismo de Proteínas"), value: 16, avg: 29, tag: "focus",
    note: t2("Below average — one reason this plan leans on well-cooked, easy-to-digest plant proteins.","Por debajo de la media: una de las razones por las que este plan se apoya en proteínas vegetales bien cocinadas y fáciles de digerir.") },
  { key: "fat", label: t2("Fat Metabolism","Metabolismo de Grasas"), value: 26, avg: 29, tag: "onTrack",
    note: t2("Close to the community average.","Cerca de la media de la comunidad.") },
  { key: "vitamin", label: t2("Vitamin Synthesis","Síntesis de Vitaminas"), value: 84, avg: 65, tag: "strength",
    note: t2("High — a profile similar to people with no vitamin deficiency.","Alto: un perfil similar al de personas sin deficiencia de vitaminas.") },
  { key: "lactose", label: t2("Lactose Sensitivity","Sensibilidad a la Lactosa"), value: 19, avg: 21, tag: "strength",
    note: t2("Low — your gut generally processes lactose without difficulty.","Bajo: tu intestino generalmente procesa la lactosa sin dificultad.") },
  { key: "gluten", label: t2("Gluten Sensitivity","Sensibilidad al Gluten"), value: 24, avg: 24, tag: "onTrack",
    note: t2("Right at the boundary of the ‘no sensitivity’ range — no strong signal either way.","Justo en el límite del rango de «sin sensibilidad»: no hay una señal fuerte en ningún sentido.") },
  { key: "sugar", label: t2("Sugar Index","Índice de Azúcar"), value: 36, avg: 59, tag: "strength",
    note: t2("Well below the community average — your gut isn't struggling with sugar.","Muy por debajo de la media de la comunidad: tu intestino no tiene dificultades con el azúcar.") },
  { key: "processed", label: t2("Processed Food Index","Índice de Alimentos Procesados"), value: 42, avg: 45, tag: "onTrack",
    note: t2("Close to the community average.","Cerca de la media de la comunidad.") },
  { key: "bowel", label: t2("Bowel Mobility","Motilidad Intestinal"), value: 46, avg: 52, tag: "strength",
    note: t2("Right in the healthy middle range — neither sluggish nor overactive.","Justo en el rango saludable medio: ni lento ni demasiado activo.") },
  { key: "antibiotic", label: t2("Antibiotic Damage","Daño por Antibióticos"), value: 18, avg: 27, tag: "strength",
    note: t2("Low — consistent with minimal recent antibiotic impact.","Bajo: coherente con un impacto mínimo reciente de antibióticos.") },
  { key: "autoimmune", label: t2("Autoimmune Index","Índice Autoinmune"), value: 48, avg: 48, tag: "onTrack",
    note: t2("In line with the community average. Noted here because of your existing Hashimoto's diagnosis, not as a new finding.","En línea con la media de la comunidad. Se indica aquí por tu diagnóstico existente de Hashimoto, no como un hallazgo nuevo.") },
  { key: "sleep", label: t2("Sleep Quality","Calidad del Sueño"), value: 88, avg: 79, tag: "strength",
    note: t2("Very high — one of the strongest assets in your whole profile.","Muy alto: uno de los puntos más fuertes de todo tu perfil.") },
];

export const KEY_BACTERIA_DEFAULT = [
  { key: "akkermansia", label: t2("Akkermansia","Akkermansia"), value: 24, avg: 78, tag: "focus",
    note: t2("Well below average — this plan's pomegranate, berries and other polyphenol-rich foods are chosen partly to support it.","Muy por debajo de la media: las granadas, bayas y otros alimentos ricos en polifenoles de este plan se eligen en parte para apoyarla.") },
  { key: "prevotella", label: t2("Prevotella","Prevotella"), value: 83, avg: 19, tag: "onTrack",
    note: t2("Much higher than average — typical for a plant-forward diet like yours.","Mucho más alta que la media: típico de una dieta tan basada en plantas como la tuya.") },
  { key: "bifido", label: t2("Bifidobacterium","Bifidobacterium"), value: 12, avg: 1, tag: "strength",
    note: t2("Well above average — a beneficial bacteria already thriving in your gut.","Muy por encima de la media: una bacteria beneficiosa que ya prospera en tu intestino.") },
];
