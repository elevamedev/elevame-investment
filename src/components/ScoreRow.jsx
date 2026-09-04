import { C } from "../theme.js";
import { TAGS } from "../data/gutScoresTemplate.js";
import ScoreBar from "./ScoreBar.jsx";

export default function ScoreRow({ t, lang, item }) {
  const tagInfo = TAGS[item.tag];
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-sm font-semibold" style={{ color: C.text }}>{item.label[lang]}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: tagInfo.color }}>{item.value}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tagInfo.color + "1c", color: tagInfo.color }}>
            {t.tags[item.tag]}
          </span>
        </div>
      </div>
      <ScoreBar value={item.value} avg={item.avg} color={tagInfo.color} />
      <div className="text-xs mt-1.5" style={{ color: C.textSoft }}>{item.note[lang]}</div>
    </div>
  );
}
