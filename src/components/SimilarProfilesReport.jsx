import { C } from "../theme.js";

function Ring({ pct, color, textColor }) {
  const deg = Math.min(100, Math.max(0, pct)) * 3.6;
  return (
    <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${color} ${deg}deg, ${C.line} ${deg}deg)` }} />
      <div className="absolute rounded-full flex items-center justify-center" style={{ inset: 5, background: C.card }}>
        <span className="text-xs font-bold" style={{ color: textColor }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function SimilarProfilesReport({ t, lang, profiles }) {
  if (!profiles?.length) return null;
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: C.textSoft }}>{t.similarProfiles.intro}</div>
      <div className="text-[11px] mb-3 font-medium" style={{ color: C.purple }}>{t.similarProfiles.disclaimer}</div>
      <div className="grid grid-cols-2 gap-3">
        {profiles.map(p => {
          const elevated = p.client_pct > p.baseline_pct;
          const color = elevated ? C.amber : C.sage;
          const textColor = elevated ? C.amberText : C.sageText;
          return (
            <div key={p.key} className="rounded-xl p-3 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <Ring pct={p.client_pct} color={color} textColor={textColor} />
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight mb-1" style={{ color: C.text }}>{p.label[lang]}</div>
                <div className="text-[10px]" style={{ color: C.textSoft }}>{t.similarProfiles.baseline(p.baseline_pct)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
