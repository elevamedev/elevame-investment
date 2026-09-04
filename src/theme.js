export const C = {
  navy: "#1a1d2e", purple: "#6b4ff0", purpleSoft: "#efe9ff",
  teal: "#1fb6b6", amber: "#e3a95e", red: "#e2574c", sage: "#7fae7a",
  bg: "#faf9fc", card: "#ffffff", line: "#e8e6f0", text: "#232538", textSoft: "#6b6f7d",
};

export function scoreColor(score) {
  return score >= 8 ? C.teal : score >= 4 ? C.amber : C.red;
}
