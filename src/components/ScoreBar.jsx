import { C } from "../theme.js";

export default function ScoreBar({ value, avg, max = 100, color }) {
  const pct = Math.min(100, (value / max) * 100);
  const avgPct = avg != null ? Math.min(100, (avg / max) * 100) : null;
  return (
    <div className="relative rounded-full mt-2 mb-1" style={{ height: 6, background: C.line }}>
      {avgPct != null && (
        <div className="absolute rounded-full" style={{ left: `calc(${avgPct}% - 1px)`, top: -4, width: 2, height: 14, background: C.textSoft }} />
      )}
      <div className="absolute rounded-full" style={{
        left: `calc(${pct}% - 6px)`, top: -3, width: 12, height: 12, background: color, border: "2px solid #fff", boxShadow: "0 0 0 1px " + color,
      }} />
    </div>
  );
}
