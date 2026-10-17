// Brand palette: purple #5131da and blue #42a2fd are the brand identity
// colors (primary actions, accents, active states). `navy` and `text`
// are near-black rather than pure #000 — easier on the eyes than flat
// black on a light background, while still reading as "black". Amber,
// red and sage are kept as semantic status colors (warning/error/good)
// rather than folded into the brand palette — losing them would make
// gut scores and save/error states much harder to scan at a glance.
export const C = {
  navy: "#121018", purple: "#5131da", purpleSoft: "#efe9fb",
  blue: "#42a2fd", amber: "#e3a95e", red: "#e2574c", sage: "#7fae7a",
  bg: "#f7f6fb", card: "#ffffff", line: "#e9e7f2", text: "#15131c", textSoft: "#6b6f7d",
};

export function scoreColor(score) {
  return score >= 8 ? C.blue : score >= 4 ? C.amber : C.red;
}
