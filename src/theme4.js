/**
 * v4 redesign design tokens — ported from the mockup's reference
 * implementation (elevame-redesign: outputs/cycle-12/mockups/src/
 * v4shell.html, lines 8-15 light / 186-188+195+209+249-250+262 dark),
 * already contrast-audited there (review round 1, issue 29: ink3
 * raised to 4.6:1, status marks fixed to 6.1:1). Keep values in sync
 * with that file if the mockup republishes.
 *
 * Deliberately separate from theme.js (the current app's palette):
 * every existing screen still reads theme.js, and swapping it now
 * would break the live v1/v2 UI before each screen is actually
 * rebuilt against this system (phases B through Q). New v4
 * components (src/components/v4/) use this instead; screens adopt it
 * as they're rebuilt.
 */
export const V4_LIGHT = {
  page: "#ecebf3", bg: "#f6f6fa", card: "#ffffff", ink: "#15172a", ink2: "#5b5e74", ink3: "#6b6e87", line: "#e8e8f0",
  navy: "#1a1d2e", navy2: "#262a40", purple: "#5131da", purpleL: "#8b78f5", purpleS: "#efedfc", blue: "#42a2fd",
  en: "#1fb6b6", enS: "#e4f6f6", enText: "#11807f", in: "#e3a95e", inS: "#fbf2e6", inText: "#9a6a26",
  re: "#e2574c", reS: "#fce9e7", reText: "#b23b31", good: "#1f9e8a",
  swGoodText: "#0d6e6d", swWatchText: "#85571a", swActText: "#b23b31",
};

export const V4_DARK = {
  ...V4_LIGHT,
  bg: "#111321", card: "#1b1e30", ink: "#eceaf6", ink2: "#a9abc2", ink3: "#9a9cb0", line: "#2a2d43",
  purpleS: "#2a2550", enS: "#173a3d", inS: "#3b3123", reS: "#40221f",
  en: "#6fd6d3", enText: "#6fd6d3", in: "#e9c08a", inText: "#e9c08a", re: "#f19a92", reText: "#f19a92",
  swGoodText: "#6fd6d3", swWatchText: "#e9c08a", swActText: "#f19a92",
};

export const V4_TYPE = {
  display: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  body: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
};

export const V4_RADIUS = { xl: 28, lg: 20, md: 14 };
export const V4_SHADOW = "0 1px 2px rgba(21,23,42,.04), 0 6px 20px rgba(21,23,42,.05)";
export const V4_SHADOW_DARK = "none";
