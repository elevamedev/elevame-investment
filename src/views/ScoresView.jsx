import { useState } from "react";
import { C } from "../theme.js";
import SectionLabel from "../components/SectionLabel.jsx";
import ScoreRow from "../components/ScoreRow.jsx";
import ScoreDetailSheet from "../components/ScoreDetailSheet.jsx";
import ScreeningReport from "../components/ScreeningReport.jsx";
import SimilarProfilesReport from "../components/SimilarProfilesReport.jsx";

function diversityBand(value, max) {
  const pct = (value / max) * 10;
  if (pct < 2.94) return { key: "poor", color: C.red };
  if (pct < 6.17) return { key: "fair", color: C.amber };
  return { key: "good", color: C.blue };
}

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ScoresView({ t, lang, gutScores, keyBacteria, microbiomeAge, diversity, wellnessIndex, fbRatio, similarProfiles, screeningFindings }) {
  const [openScore, setOpenScore] = useState(null);
  const band = diversityBand(diversity.value, diversity.max);
  const wellnessColor = wellnessIndex === "good" ? C.blue : wellnessIndex === "poor" ? C.red : C.amber;

  const sections = [
    { id: "section-gut-scores", label: t.yourGutScores },
    { id: "section-key-bacteria", label: t.keyBacteria },
    ...(similarProfiles?.length > 0 ? [{ id: "section-similar-profiles", label: t.similarProfiles.title }] : []),
    ...(screeningFindings?.length > 0 ? [{ id: "section-screening", label: t.screening.title }] : []),
  ];

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{t.scoresIntro}</div>

      <div className="flex gap-3 mb-3">
        <div className="flex-1 rounded-2xl p-4" style={{ background: C.navy }}>
          <div className="text-white/60 text-xs font-medium mb-1">{t.microbiomeAge}</div>
          <div className="text-white text-3xl font-extrabold">{microbiomeAge}</div>
        </div>
        <div className="flex-1 rounded-2xl p-4" style={{ background: C.purple }}>
          <div className="text-white/70 text-xs font-medium mb-1">{t.diversityLabel}</div>
          <div className="text-white text-3xl font-extrabold">{diversity.value}</div>
          <div className="text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
            {t.diversityBand[band.key]}
          </div>
        </div>
      </div>

      {(wellnessIndex || fbRatio != null) && (
        <div className="flex gap-3 mb-6">
          {wellnessIndex && (
            <div className="flex-1 rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: C.textSoft }}>{t.wellnessIndex}</div>
              <div className="text-lg font-extrabold mb-1" style={{ color: wellnessColor }}>{t.wellnessLabel[wellnessIndex] || wellnessIndex}</div>
              <div className="text-[11px]" style={{ color: C.textSoft }}>{t.wellnessIndexNote[wellnessIndex]}</div>
            </div>
          )}
          {fbRatio != null && (
            <div className="flex-1 rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: C.textSoft }}>{t.fbRatioLabel}</div>
              <div className="text-lg font-extrabold mb-1" style={{ color: C.navy }}>{fbRatio}</div>
              <div className="text-[11px]" style={{ color: C.textSoft }}>{t.fbRatioNote}</div>
            </div>
          )}
        </div>
      )}

      {sections.length > 1 && (
        <nav aria-label={t.jumpToSection} className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => jumpTo(s.id)} className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ background: C.card, color: C.purple, border: `1px solid ${C.purple}44` }}>
              {s.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: C.textSoft }}>
        <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: C.purple }} />{t.legendYou}</div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-0.5 h-3" style={{ background: C.textSoft }} />{t.legendAvg}</div>
      </div>

      <SectionLabel id="section-gut-scores">{t.yourGutScores}</SectionLabel>
      <div className="mb-6">{gutScores.map(item => <ScoreRow key={item.key} t={t} lang={lang} item={item} onOpen={setOpenScore} />)}</div>

      <SectionLabel id="section-key-bacteria">{t.keyBacteria}</SectionLabel>
      <div className="mb-6">{keyBacteria.map(item => <ScoreRow key={item.key} t={t} lang={lang} item={item} onOpen={setOpenScore} />)}</div>

      {similarProfiles?.length > 0 && (
        <>
          <SectionLabel id="section-similar-profiles">{t.similarProfiles.title}</SectionLabel>
          <div className="mb-6"><SimilarProfilesReport t={t} lang={lang} profiles={similarProfiles} /></div>
        </>
      )}

      {screeningFindings?.length > 0 && (
        <>
          <SectionLabel id="section-screening">{t.screening.title}</SectionLabel>
          <ScreeningReport t={t} lang={lang} findings={screeningFindings} />
        </>
      )}

      <ScoreDetailSheet t={t} lang={lang} item={openScore} onClose={() => setOpenScore(null)} />
    </div>
  );
}
