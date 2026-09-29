import { scoreColor } from "../theme.js";

export default function ScorePill({ score }) {
  const c = scoreColor(score);
  return (
    <span
      style={{ background: c + "22", color: c, border: `1px solid ${c}55` }}
      className="text-xs font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
    >
      {score}
    </span>
  );
}
