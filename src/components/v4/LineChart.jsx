import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Small SVG line chart for How you feel (brief 4.9, mockup
 * lineChart()). Values are 1-5. y-axis labelled 1-5, x-axis shows the
 * plan weeks, every point is labelled with its value, and the whole
 * chart carries one aria-label so a screen reader gets the data
 * without parsing the SVG.
 */
export default function LineChart({ name, values, weekLabels }) {
  const { V } = useV4Theme();
  const W = 280, H = 124, L = 22, R = 18, T = 16, B = 24, P = 18;
  const labels = weekLabels || values.map((_, i) => (i === values.length - 1 ? "Now" : `Wk ${i + 1}`));
  const xs = i => L + P + (i * (W - L - R - P)) / (values.length - 1 || 1);
  const ys = v => T + ((5 - v) * (H - T - B)) / 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-1.5" style={{ overflow: "visible" }}
      role="img" aria-label={`${name}: ${values.map((v, i) => `${labels[i]} ${v}`).join(", ")}`}>
      {[1, 2, 3, 4, 5].map(n => (
        <g key={n}>
          <line x1={L} x2={W - R} y1={ys(n)} y2={ys(n)} stroke={V.line} strokeWidth={1} />
          <text x={L - 8} y={ys(n) + 4} fontSize={10} fill={V.ink3} textAnchor="end">{n}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={xs(i)} y={H - 6} fontSize={10} fill={V.ink3} textAnchor="middle">{l}</text>
      ))}
      <polyline points={values.map((v, i) => `${xs(i)},${ys(v)}`).join(" ")} fill="none" stroke={V.purple} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const isNow = i === values.length - 1;
        return (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(v)} r={isNow ? 5 : 3.5} fill={isNow ? V.purple : V.card} stroke={V.purple} strokeWidth={2} />
            <text x={xs(i)} y={ys(v) - 9} fontSize={11} fontWeight={700} fill={V.ink} textAnchor="middle">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}
