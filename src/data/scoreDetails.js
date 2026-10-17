import { t2 } from "./foods.js";

/* ============================================================
   SCORE DETAILS — static educational copy shown when a client
   taps into a gut score or key bacteria row ("click in for more
   information"). Keyed by the same `key` used in
   gutScoresTemplate.js / the `gut_scores` table.

   This is reference content (same explanation for every client,
   same as a report's printed glossary) so it lives in code rather
   than per-client rows — only the value/avg/tag/note differ per
   client, and those already come from the database.
============================================================ */
export const SCORE_DETAILS = {
  metabolic: {
    about: t2(
      "A composite of how efficiently your gut bacteria extract and store energy from food. It's built from the carbohydrate, protein and fat metabolism scores below.",
      "Un indicador compuesto de la eficiencia con la que tus bacterias intestinales extraen y almacenan energía de los alimentos. Se construye a partir de los scores de metabolismo de carbohidratos, proteínas y grasas."
    ),
    bacteria: ["Firmicutes", "Bacteroidetes"],
  },
  carb: {
    about: t2(
      "Reflects how well your gut bacteria break down dietary carbohydrates and fibre into usable energy and short-chain fatty acids.",
      "Refleja la eficacia con la que tus bacterias intestinales descomponen los carbohidratos y la fibra en energía utilizable y ácidos grasos de cadena corta."
    ),
    bacteria: ["Prevotella", "Ruminococcus"],
  },
  protein: {
    about: t2(
      "Measures bacterial capacity to ferment dietary protein. Very high protein fermentation can produce by-products (like ammonia and certain amines) linked to gut irritation, so this score favours a middle range rather than 'more is better'.",
      "Mide la capacidad bacteriana para fermentar la proteína de la dieta. Una fermentación de proteína muy alta puede producir subproductos (como amoníaco y ciertas aminas) asociados con irritación intestinal, por lo que este score favorece un rango medio en lugar de 'más es mejor'."
    ),
    bacteria: ["Bacteroides", "Clostridium"],
  },
  fat: {
    about: t2(
      "Reflects bacterial involvement in fat and bile acid metabolism — these bacteria help regulate how dietary fat is processed and absorbed.",
      "Refleja la participación bacteriana en el metabolismo de las grasas y los ácidos biliares: estas bacterias ayudan a regular cómo se procesa y absorbe la grasa de la dieta."
    ),
    bacteria: ["Alistipes", "Bilophila"],
  },
  vitamin: {
    about: t2(
      "Many gut bacteria synthesise B-vitamins and vitamin K as a by-product of fermentation. This score estimates how much of that synthesis capacity your profile has.",
      "Muchas bacterias intestinales sintetizan vitaminas del grupo B y vitamina K como subproducto de la fermentación. Este score estima cuánta capacidad de síntesis tiene tu perfil."
    ),
    bacteria: ["Bifidobacterium", "Bacteroides fragilis"],
  },
  lactose: {
    about: t2(
      "Estimates how well your gut community digests lactose, based on the relative abundance of bacteria known to produce lactase-like enzymes.",
      "Estima la eficacia con la que tu comunidad intestinal digiere la lactosa, en función de la abundancia relativa de bacterias que producen enzimas similares a la lactasa."
    ),
    bacteria: ["Lactobacillus", "Bifidobacterium"],
  },
  gluten: {
    about: t2(
      "A profile-based estimate of gluten-related sensitivity signals in the gut community — not a substitute for a coeliac or allergy test.",
      "Una estimación basada en el perfil de señales de sensibilidad relacionadas con el gluten en la comunidad intestinal: no sustituye una prueba de celiaquía o alergia."
    ),
    bacteria: [],
  },
  sugar: {
    about: t2(
      "Reflects how your gut community responds to simple sugars — a higher index is associated with bacterial profiles that struggle to regulate blood-sugar swings.",
      "Refleja cómo responde tu comunidad intestinal a los azúcares simples: un índice más alto se asocia con perfiles bacterianos que tienen dificultades para regular las variaciones de glucosa."
    ),
    bacteria: [],
  },
  processed: {
    about: t2(
      "Estimates how exposure to processed/ultra-processed food has shaped your gut community — a lower index generally means a community closer to a whole-food baseline.",
      "Estima cómo la exposición a alimentos procesados/ultraprocesados ha moldeado tu comunidad intestinal: un índice más bajo generalmente indica una comunidad más cercana a una base de alimentos integrales."
    ),
    bacteria: [],
  },
  bowel: {
    about: t2(
      "Bowel (gut) motility reflects how quickly food moves through your digestive tract, estimated from bacteria associated with transit speed. Too slow is linked to constipation-type symptoms; too fast to looser stools — the healthy range sits in the middle.",
      "La motilidad intestinal refleja la velocidad con la que los alimentos se desplazan por tu tracto digestivo, estimada a partir de bacterias asociadas con la velocidad de tránsito. Demasiado lenta se asocia con síntomas de tipo estreñimiento; demasiado rápida, con heces más blandas — el rango saludable está en el medio."
    ),
    bacteria: ["Akkermansia muciniphila", "Methanobrevibacter smithii"],
  },
  antibiotic: {
    about: t2(
      "Estimates residual disruption from past antibiotic use, based on how far your community's diversity and key beneficial bacteria are from a typical unaffected profile.",
      "Estima la alteración residual por el uso pasado de antibióticos, en función de cuánto se aleja la diversidad de tu comunidad y las bacterias beneficiosas clave de un perfil típico no afectado."
    ),
    bacteria: ["Bifidobacterium", "Faecalibacterium prausnitzii"],
  },
  autoimmune: {
    about: t2(
      "Flags bacterial patterns that research has associated with autoimmune activity. A result here is a profile signal, not a diagnosis — always interpret alongside your medical history.",
      "Señala patrones bacterianos que la investigación ha asociado con actividad autoinmune. Un resultado aquí es una señal de perfil, no un diagnóstico: interprétalo siempre junto con tu historial médico."
    ),
    bacteria: ["Prevotella copri"],
  },
  sleep: {
    about: t2(
      "The gut-brain axis means certain bacteria influence neurotransmitter and circadian signalling linked to sleep quality. This score summarises that signal from your profile.",
      "El eje intestino-cerebro implica que ciertas bacterias influyen en la señalización de neurotransmisores y del ritmo circadiano relacionada con la calidad del sueño. Este score resume esa señal en tu perfil."
    ),
    bacteria: [],
  },
  akkermansia: {
    about: t2(
      "A keystone bacterium that maintains the gut's mucus lining and is strongly linked to metabolic health and gut barrier integrity. It responds well to polyphenol-rich foods (berries, pomegranate, green tea).",
      "Una bacteria clave que mantiene el revestimiento de mucosa del intestino y está fuertemente relacionada con la salud metabólica y la integridad de la barrera intestinal. Responde bien a alimentos ricos en polifenoles (bayas, granada, té verde)."
    ),
    bacteria: [],
  },
  prevotella: {
    about: t2(
      "Thrives on plant fibre and is typically abundant in fibre-rich, plant-forward diets. High levels are common and generally favourable in that context.",
      "Prospera con la fibra vegetal y suele ser abundante en dietas ricas en fibra y basadas en plantas. Los niveles altos son comunes y generalmente favorables en ese contexto."
    ),
    bacteria: [],
  },
  bifido: {
    about: t2(
      "A well-studied beneficial genus that supports gut barrier function, immune regulation and vitamin synthesis. Higher levels are generally a favourable sign.",
      "Un género beneficioso muy estudiado que favorece la función de barrera intestinal, la regulación inmunitaria y la síntesis de vitaminas. Niveles más altos son, en general, una señal favorable."
    ),
    bacteria: [],
  },
};
