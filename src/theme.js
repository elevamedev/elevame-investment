import { useV4Theme } from "./context/ThemeContext.jsx";

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
  // `purple` doubles as a solid button background (white text on it) and
  // as plain link/accent text on a card — the same two roles blue/amber/
  // red/sage split into a raw color and a *Text variant for. In light
  // mode the one brand purple happens to pass AA in both roles, so this
  // was never split out; dark mode is why it is now.
  purpleText: "#5131da",
};

// Dark-mode equivalents of C, same keys, so every existing `C.foo` call
// site works unchanged (brief 7.3 / decision 11.5: light and dark,
// starting on light). Values reuse theme4.js's already contrast-audited
// dark tokens where the two palettes overlap conceptually. `purple` stays
// the light-mode brand hex — it's a solid button background with white
// text, which doesn't need to lighten for a dark page; `purpleText` is
// the one that needs to read as text on a dark card, so it lightens.
const C_DARK = {
  navy: "#eceaf6", purple: "#5131da", purpleSoft: "#2a2550", purpleText: "#b3a0fa",
  blue: "#6ab6ff", amber: "#e9c08a", red: "#f19a92", sage: "#6fd6d3",
  bg: "#111321", card: "#1b1e30", line: "#2a2d43", text: "#eceaf6", textSoft: "#9a9cb0",
  blueText: "#7cc4ff", amberText: "#e9c08a", redText: "#f19a92", sageText: "#6fd6d3",
};

/**
 * A theme-aware `C`: call this instead of importing the static export
 * in any component that renders under the client tab shell (it needs
 * ThemeProvider as an ancestor, same requirement as useV4Theme itself).
 * `C.foo` property names are unchanged, so converting a file is just
 * swapping the import and adding `const C = useC();`.
 */
export function useC() {
  const { theme } = useV4Theme();
  return theme === "dark" ? C_DARK : C;
}

export function scoreColor(score) {
  return score >= 8 ? C.blue : score >= 4 ? C.amber : C.red;
}

export function scoreTextColor(score) {
  return score >= 8 ? C.blueText : score >= 4 ? C.amberText : C.redText;
}
