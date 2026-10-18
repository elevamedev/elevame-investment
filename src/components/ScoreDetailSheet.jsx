import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { C } from "../theme.js";
import { TAGS } from "../data/gutScoresTemplate.js";
import { SCORE_DETAILS } from "../data/scoreDetails.js";
import { SCORE_REFERENCE_RANGES } from "../data/scoreReferenceRanges.js";

export default function ScoreDetailSheet({ t, lang, item, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    function onKeyDown(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const tagInfo = TAGS[item.tag];
  const detail = SCORE_DETAILS[item.key];
  const range = SCORE_REFERENCE_RANGES[item.key];
  const pct = Math.min(100, Math.max(0, item.value));
  const avgPct = item.avg != null ? Math.min(100, Math.max(0, item.avg)) : null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={item.label[lang]}>
      <button aria-label={t.scoreDetail.close} onClick={onClose} className="absolute inset-0" style={{ background: "rgba(26,29,46,0.45)" }} />
      <div className="relative w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.card }}>
        <div className="flex items-start justify-between mb-1">
          <div className="font-semibold text-base pr-4" style={{ color: C.text }}>{item.label[lang]}</div>
          <button ref={closeRef} onClick={onClose} aria-label={t.scoreDetail.close} className="p-1.5 rounded-full flex-shrink-0" style={{ border: `1px solid ${C.line}` }}>
            <X size={14} color={C.textSoft} />
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-extrabold" style={{ color: tagInfo.textColor }}>{item.value}</span>
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tagInfo.color + "1c", color: tagInfo.textColor }}>
            {t.tags[item.tag]}
          </span>
        </div>

        {range ? (
          <>
            <div className="mb-1 flex justify-between text-[10px] font-medium" style={{ color: C.textSoft }}>
              <span>{range.low[lang]}</span>
              <span>{range.high[lang]}</span>
            </div>
            <div className="relative rounded-full mb-1" style={{
              height: 10,
              background: range.goodSide === "mid"
                ? `linear-gradient(90deg, ${C.red}, ${C.sage}, ${C.red})`
                : range.goodSide === "low"
                  ? `linear-gradient(90deg, ${C.sage}, ${C.red})`
                  : `linear-gradient(90deg, ${C.red}, ${C.sage})`,
            }}>
              {avgPct != null && (
                <div className="absolute rounded-full" style={{ left: `calc(${avgPct}% - 1px)`, top: -4, width: 2, height: 18, background: "#fff" }} />
              )}
              <div className="absolute rounded-full" style={{
                left: `calc(${pct}% - 7px)`, top: -3, width: 14, height: 14, background: tagInfo.color, border: "2px solid #fff", boxShadow: "0 0 0 1px " + tagInfo.color,
              }} />
            </div>
            <div className="flex items-center gap-4 mb-5 text-[11px]" style={{ color: C.textSoft }}>
              <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: tagInfo.color }} />{t.legendYou}</div>
              {avgPct != null && <div className="flex items-center gap-1.5"><span className="inline-block w-0.5 h-3" style={{ background: "#fff", border: `1px solid ${C.line}` }} />{t.legendAvg}</div>}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-6 mb-5">
            <div>
              <div className="text-[10px] font-medium mb-0.5" style={{ color: C.textSoft }}>{t.legendYou}</div>
              <div className="text-xl font-extrabold" style={{ color: tagInfo.textColor }}>{item.value}</div>
            </div>
            {item.avg != null && (
              <div>
                <div className="text-[10px] font-medium mb-0.5" style={{ color: C.textSoft }}>{t.legendAvg}</div>
                <div className="text-xl font-extrabold" style={{ color: C.textSoft }}>{item.avg}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm mb-4" style={{ color: C.text }}>{item.note[lang]}</div>

        {detail?.about && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.textSoft }}>{t.scoreDetail.about}</div>
            <div className="text-sm" style={{ color: C.text }}>{detail.about[lang]}</div>
          </div>
        )}

        {detail?.bacteria?.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.textSoft }}>{t.scoreDetail.relatedBacteria}</div>
            <div className="flex flex-wrap gap-1.5">
              {detail.bacteria.map(name => (
                <span key={name} className="text-xs px-2.5 py-1 rounded-full" style={{ background: C.purpleSoft, color: C.navy }}>{name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
