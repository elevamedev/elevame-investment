import { C } from "../theme.js";
import SectionLabel from "../components/SectionLabel.jsx";
import ScoreRow from "../components/ScoreRow.jsx";

export default function ScoresView({ t, lang, gutScores, keyBacteria, microbiomeAge, diversity }) {
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{t.scoresIntro}</div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 rounded-2xl p-4" style={{ background: C.navy }}>
          <div className="text-white/60 text-xs font-medium mb-1">{t.microbiomeAge}</div>
          <div className="text-white text-3xl font-extrabold">{microbiomeAge}</div>
        </div>
        <div className="flex-1 rounded-2xl p-4" style={{ background: C.purple }}>
          <div className="text-white/70 text-xs font-medium mb-1">{t.diversityLabel}</div>
          <div className="text-white text-3xl font-extrabold">{diversity.value}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: C.textSoft }}>
        <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: C.purple }} />{t.legendYou}</div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-0.5 h-3" style={{ background: C.textSoft }} />{t.legendAvg}</div>
      </div>

      <SectionLabel>{t.yourGutScores}</SectionLabel>
      <div className="mb-6">{gutScores.map(item => <ScoreRow key={item.key} t={t} lang={lang} item={item} />)}</div>

      <SectionLabel>{t.keyBacteria}</SectionLabel>
      <div>{keyBacteria.map(item => <ScoreRow key={item.key} t={t} lang={lang} item={item} />)}</div>
    </div>
  );
}
