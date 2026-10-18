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
      "Reflects the amount and activity of bacteria involved in digesting dietary protein. A high score indicates a large variety of these bacteria, which generally aids the body's ability to digest and utilise protein.",
      "Refleja la cantidad y actividad de las bacterias implicadas en la digestión de la proteína de la dieta. Un score alto indica una gran variedad de estas bacterias, lo que generalmente favorece la capacidad del cuerpo para digerir y utilizar la proteína."
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
  alistipes: {
    about: t2(
      "A common gut genus involved in breaking down dietary fibre and bile acids. It's generally abundant in fibre-rich diets — levels well below the community average can be a sign of a lower-fibre diet or recent gut disruption.",
      "Un género intestinal común implicado en la descomposición de la fibra dietética y los ácidos biliares. Suele ser abundante en dietas ricas en fibra: niveles muy por debajo de la media de la comunidad pueden indicar una dieta baja en fibra o una alteración intestinal reciente."
    ),
    bacteria: [],
  },
  eubacterium: {
    about: t2(
      "A genus that produces butyrate, a short-chain fatty acid that is the primary fuel source for the cells lining your colon and supports gut barrier integrity.",
      "Un género que produce butirato, un ácido graso de cadena corta que es la principal fuente de energía para las células que recubren el colon y favorece la integridad de la barrera intestinal."
    ),
    bacteria: [],
  },
  collinsella: {
    about: t2(
      "A genus involved in carbohydrate fermentation and bile acid metabolism. It's usually present in small amounts — a level well above the community average is sometimes seen alongside higher-fat diets.",
      "Un género implicado en la fermentación de carbohidratos y el metabolismo de los ácidos biliares. Suele estar presente en pequeñas cantidades: un nivel muy por encima de la media de la comunidad a veces se observa junto con dietas más altas en grasa."
    ),
    bacteria: [],
  },
  haemophilus: {
    about: t2(
      "A genus present in small amounts in most healthy gut communities. On its own, presence at typical levels isn't a cause for concern.",
      "Un género presente en pequeñas cantidades en la mayoría de las comunidades intestinales sanas. Por sí sola, su presencia en niveles típicos no es motivo de preocupación."
    ),
    bacteria: [],
  },
  roseburia: {
    about: t2(
      "Another butyrate-producing genus linked to gut barrier health and anti-inflammatory activity. It tends to thrive on fibre from whole grains, legumes and vegetables.",
      "Otro género productor de butirato relacionado con la salud de la barrera intestinal y la actividad antiinflamatoria. Tiende a prosperar con la fibra de cereales integrales, legumbres y verduras."
    ),
    bacteria: [],
  },
  phascolarctobacterium: {
    about: t2(
      "A genus that uses succinate (a by-product of other gut bacteria) to produce propionate, another beneficial short-chain fatty acid involved in metabolic regulation.",
      "Un género que utiliza succinato (un subproducto de otras bacterias intestinales) para producir propionato, otro ácido graso de cadena corta beneficioso implicado en la regulación metabólica."
    ),
    bacteria: [],
  },
};
