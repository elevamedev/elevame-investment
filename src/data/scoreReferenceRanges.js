import { t2 } from "./foods.js";

/* ============================================================
   SCORE REFERENCE RANGES — the real low/high archetype labels
   from Elevame's own microbiome report (e.g. "Lean" / "Overweight"
   for the Metabolic Score), replacing the generic "Low/Typical/High"
   labels Cycle 1 shipped with. Sourced from a real client report
   (pp.9-14) rather than invented thresholds.

   goodSide: which end of the 0-100 scale is the favourable one —
   'low', 'high', or 'mid' (Bowel Mobility: either extreme is
   unfavourable, the healthy range sits in the middle, per the
   report's own wording).

   carb/protein/fat only ever show a single "Community" marker in
   the source report (no named archetype at either extreme) — their
   low/high labels here paraphrase the report's own descriptive text
   ("high scores indicate a large variety of bacteria that can aid
   digestion") rather than quoting a printed label.
============================================================ */
export const SCORE_REFERENCE_RANGES = {
  metabolic: { goodSide: "low", low: t2("Lean", "Delgado"), high: t2("Overweight", "Sobrepeso") },
  carb: { goodSide: "high", low: t2("Fewer digesting bacteria", "Menos bacterias digestivas"), high: t2("Wide bacterial variety", "Amplia variedad bacteriana") },
  protein: { goodSide: "high", low: t2("Fewer digesting bacteria", "Menos bacterias digestivas"), high: t2("Wide bacterial variety", "Amplia variedad bacteriana") },
  fat: { goodSide: "high", low: t2("Fewer digesting bacteria", "Menos bacterias digestivas"), high: t2("Wide bacterial variety", "Amplia variedad bacteriana") },
  vitamin: { goodSide: "high", low: t2("Vitamin deficiency", "Deficiencia de vitaminas"), high: t2("No vitamin deficiency", "Sin deficiencia de vitaminas") },
  lactose: { goodSide: "low", low: t2("No sensitivity", "Sin sensibilidad"), high: t2("Lactose sensitivity", "Sensibilidad a la lactosa") },
  gluten: { goodSide: "low", low: t2("No sensitivity", "Sin sensibilidad"), high: t2("Gluten sensitivity", "Sensibilidad al gluten") },
  sugar: { goodSide: "low", low: t2("Avoiding sugar", "Evitando el azúcar"), high: t2("Consuming sugar", "Consumiendo azúcar") },
  processed: { goodSide: "low", low: t2("Avoiding processed foods", "Evitando alimentos procesados"), high: t2("Consuming processed foods", "Consumiendo alimentos procesados") },
  bowel: { goodSide: "mid", low: t2("Decreased intestinal motility", "Motilidad intestinal disminuida"), high: t2("Increased intestinal motility", "Motilidad intestinal aumentada") },
  antibiotic: { goodSide: "low", low: t2("Avoiding antibiotics", "Evitando antibióticos"), high: t2("Using antibiotics", "Usando antibióticos") },
  autoimmune: { goodSide: "low", low: t2("Healthy individuals", "Personas sanas"), high: t2("Has autoimmune diseases", "Tiene enfermedades autoinmunes") },
  sleep: { goodSide: "high", low: t2("Low sleep quality", "Baja calidad de sueño"), high: t2("High sleep quality", "Alta calidad de sueño") },
};
