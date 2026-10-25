import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Score bar (brief 4.7, mockup .refbar / scoreBar()). A green-to-red
 * gradient oriented for the score's direction, dashed ticks at the
 * reference markers, a line at the average, a ring for the client,
 * "0 50 100" under it, and (unless `big`) "You {v}" / "Average {c}".
 */
function gradient(direction) {
  const g = "#3fb68b", y = "#e3b25e", r = "#e2574c";
  if (direction === "lower_better") return `linear-gradient(90deg, ${g}, ${y}, ${r})`;
  if (direction === "middle_best") return `linear-gradient(90deg, ${r}, ${y}, ${g}, ${y}, ${r})`;
  return `linear-gradient(90deg, ${r}, ${y}, ${g})`; // higher_better
}

export default function ScoreBar({ value, community, markers = [], direction = "higher_better", big = false, youLabel = "You", averageLabel = "Average" }) {
  const { V } = useV4Theme();
  const height = big ? 14 : 10;
  return (
    <div>
      <div style={{ position: "relative", height, borderRadius: height / 2, margin: big ? "22px 0 4px" : "16px 0 6px", background: gradient(direction) }} aria-hidden="true">
        {markers.map((m, i) => (
          <i key={i} style={{ position: "absolute", top: -3, left: `${m.value}%`, width: 2, height: height + 6, background: V.card, borderLeft: `1px dashed ${V.ink2}`, transform: "translateX(-1px)" }} />
        ))}
        <i style={{ position: "absolute", top: -5, left: `${community}%`, width: 2, height: height + 10, background: V.ink, opacity: 0.45 }} />
        <i style={{ position: "absolute", top: big ? -4 : -5, left: `${value}%`, width: big ? 22 : 20, height: big ? 22 : 20, borderRadius: "50%", background: V.card, border: `3px solid ${V.ink}`, transform: "translateX(-50%)" }} />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: V.ink3, marginBottom: 2 }}>
        <span>0</span><span>50</span><span>100</span>
      </div>
      {!big && (
        <div className="flex justify-between text-[11px]" style={{ color: V.ink3 }}>
          <span><b style={{ color: V.ink }}>{youLabel} {value}</b></span>
          <span>{averageLabel} {community}</span>
        </div>
      )}
    </div>
  );
}
