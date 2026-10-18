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
  // Darkened variants of blue/amber/red/sage, kept to WCAG AA (4.5:1 on
  // white) — the raw brand/status colors above read well as backgrounds,
  // borders and icons, but several of them (brand blue especially) fail
  // contrast when used as small text, which is exactly how ScorePill,
  // score tags and the screening report render them. Use these for text;
  // use the colors above for everything else.
  blueText: "#0275e1", amberText: "#a5691d", redText: "#dc3629", sageText: "#527f4d",
};

export function scoreColor(score) {
  return score >= 8 ? C.blue : score >= 4 ? C.amber : C.red;
}

export function scoreTextColor(score) {
  return score >= 8 ? C.blueText : score >= 4 ? C.amberText : C.redText;
}
