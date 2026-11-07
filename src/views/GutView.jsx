import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme.js";
import { useV4Theme } from "../context/ThemeContext.jsx";
import { useFoodsData } from "../hooks/useFoodsData.js";
import { useV4Gut } from "../hooks/useV4Gut.js";
import StatusMark from "../components/v4/StatusMark.jsx";
import ScoreBar from "../components/v4/ScoreBar.jsx";
import BacteriumRow from "../components/v4/BacteriumRow.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import ScoreSheetContent from "../components/v4/ScoreSheet.jsx";
import { useSheetParam } from "../hooks/useSheetParam.js";

const GROUP_LABEL = {
  en: { digestion: "Digestion", gut_lining: "Gut lining", weight: "Weight", mind_sleep: "Mind and sleep", other: "Other" },
  es: { digestion: "Digestión", gut_lining: "Barrera intestinal", weight: "Peso", mind_sleep: "Mente y sueño", other: "Otros" },
};
const GROUP_ORDER = ["digestion", "gut_lining", "weight", "mind_sleep", "other"];

const COPY = {
  en: {
    microbiomeAge: "Microbiome age", diversity: "Variety of bacteria", wellness: "Wellness index",
    youAre: age => `You are ${age}`, younger: "Younger", older: "Older", same: "Same",
    diversityBand: v => (v < 3.3 ? "Low" : v < 6.7 ? "Average" : "High"),
    wellnessLabel: { good: "Good", fair: "Fair", poor: "Poor" },
    yourGutScores: "Your 13 gut scores", intro: "A snapshot of what your gut results say about your body systems.",
    habitsTitle: "What your gut says about your habits",
    you: n => `You ${n}`, closerTo: label => `, closer to ${label}`,
    keyBacteria: "Key bacteria", showAll: n => `Show all ${n}`, showLess: "Show less",
    safetyScreen: "Safety screen", checksAllClear: n => `${n} checks · all clear`, checksFound: (n, k) => `${n} checks · ${k} found`,
    safetyBody: k => `Your report found ${k} of the organisms it checks for. Your nutritionist will talk this through with you.`,
    footer: "A snapshot of your gut, not a diagnosis.",
    groupingFooter: "Grouping scores into body systems is Elevame's, the results are from your Enbiosis report.",
    plainSentence: "No invented direction — the portal lists which bacteria count towards this score, not which way each one pushes it.",
    partOf: system => `Part of ${system}`, planWorks: "Your plan works on this",
    bacteriaCounted: n => `Bacteria counted in this score (${n})`,
    loading: "Loading…", noReport: "Your gut results appear here once your nutritionist has reviewed your report.",
    varietySheetTitle: "Variety of bacteria",
  },
  es: {
    microbiomeAge: "Edad del microbioma", diversity: "Variedad de bacterias", wellness: "Índice de bienestar",
    youAre: age => `Tienes ${age}`, younger: "Más joven", older: "Mayor", same: "Igual",
    diversityBand: v => (v < 3.3 ? "Baja" : v < 6.7 ? "Media" : "Alta"),
    wellnessLabel: { good: "Bueno", fair: "Aceptable", poor: "Bajo" },
    yourGutScores: "Tus 13 scores intestinales", intro: "Un resumen de lo que tus resultados dicen sobre tus sistemas corporales.",
    habitsTitle: "Qué dice tu intestino sobre tus hábitos",
    you: n => `Tú ${n}`, closerTo: label => `, más cerca de ${label}`,
    keyBacteria: "Bacterias clave", showAll: n => `Ver las ${n}`, showLess: "Ver menos",
    safetyScreen: "Control de seguridad", checksAllClear: n => `${n} comprobaciones · todo bien`, checksFound: (n, k) => `${n} comprobaciones · ${k} encontrados`,
    safetyBody: k => `Tu informe encontró ${k} de los organismos que comprueba. Tu nutricionista hablará esto contigo.`,
    footer: "Un resumen de tu intestino, no un diagnóstico.",
    groupingFooter: "Agrupar los scores en sistemas corporales es de Elevame; los resultados son de tu informe Enbiosis.",
    plainSentence: "Sin dirección inventada: el informe indica qué bacterias cuentan para este score, no hacia qué lado lo empuja cada una.",
    partOf: system => `Parte de ${system}`, planWorks: "Tu plan trabaja en esto",
    bacteriaCounted: n => `Bacterias contadas en este score (${n})`,
    loading: "Cargando…", noReport: "Tus resultados intestinales aparecerán aquí cuando tu nutricionista haya revisado tu informe.",
    varietySheetTitle: "Variedad de bacterias",
  },
};

export default function GutView({ lang, user, profile }) {
  const t = COPY[lang] || COPY.en;
  const { V } = useV4Theme();
  const navigate = useNavigate();
  const { isOpen, open, close } = useSheetParam();
  const [showAllBacteria, setShowAllBacteria] = useState(false);

  const foodsData = useFoodsData(user?.id, profile?.id);
  const gut = useV4Gut(profile?.id, foodsData.testId);

  const groupsOrdered = useMemo(() => {
    const byKey = Object.fromEntries(gut.scoreGroups.map(g => [g.key, g]));
    return GROUP_ORDER.map(k => byKey[k]).filter(Boolean);
  }, [gut.scoreGroups]);

  const visibleBacteria = showAllBacteria ? gut.keyBacteria : gut.keyBacteria.slice(0, 6);
  const openScoreItem = groupsOrdered.flatMap(g => g.items).find(it => isOpen(`score:${it.metric.id}`));

  if (foodsData.loading || gut.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;
  if (!gut.hasReport) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.noReport}</div>;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button onClick={() => open("gut:variety")} className="rounded-xl p-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.diversity}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>{gut.diversityValue != null ? `${gut.diversityValue}` : "—"}</div>
          <div className="text-[10px]" style={{ color: C.textSoft }}>{gut.diversityValue != null && t.diversityBand(gut.diversityValue)}</div>
        </button>
        <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.microbiomeAge}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>{gut.microbiomeAge ?? "—"}</div>
          <div className="text-[10px]" style={{ color: C.textSoft }}>{gut.ageAtTest != null && t.youAre(gut.ageAtTest)}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.wellness}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>{gut.wellnessIndex ? t.wellnessLabel[gut.wellnessIndex] : "—"}</div>
        </div>
      </div>

      <div className="text-sm font-semibold mb-1" style={{ color: C.navy }}>{t.yourGutScores}</div>
      <p className="text-xs mb-3" style={{ color: C.textSoft }}>{t.intro}</p>

      <div className="rounded-xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.navy }}>{t.habitsTitle}</div>
        {gut.habitScores.map((h, i) => {
          const nearest = [...h.markers].sort((a, b) => Math.abs(h.result.value - a.value) - Math.abs(h.result.value - b.value))[0];
          return (
            <div key={h.metric.id} className={i > 0 ? "mt-4" : ""}>
              <div className="text-sm font-medium mb-0.5" style={{ color: C.text }}>{lang === "es" ? h.metric.client_name_es || h.metric.name_es : h.metric.client_name_en || h.metric.name_en}</div>
              <ScoreBar value={h.result.value} community={h.result.community_value} markers={h.markers} direction={h.metric.direction} youLabel="" averageLabel="" />
              {nearest && <div className="text-xs" style={{ color: C.textSoft }}>{t.you(h.result.value)}{t.closerTo(lang === "es" ? nearest.label_es || nearest.label_en : nearest.label_en)}</div>}
            </div>
          );
        })}
        {gut.reportTexts.habits_footer && <p className="text-xs mt-3" style={{ color: C.textSoft }}>{lang === "es" ? gut.reportTexts.habits_footer.text_es || gut.reportTexts.habits_footer.text_en : gut.reportTexts.habits_footer.text_en}</p>}
      </div>

      {groupsOrdered.map(group => (
        <div key={group.key} className="mb-4">
          <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{GROUP_LABEL[lang]?.[group.key]}</div>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {group.items.map((it, i) => (
              <button key={it.metric.id} onClick={() => open(`score:${it.metric.id}`)} className="w-full text-left px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: C.text }}>{lang === "es" ? it.metric.client_name_es || it.metric.name_es : it.metric.client_name_en || it.metric.name_en}</span>
                  {it.result.printed_badge && <StatusMark status={it.result.printed_badge} lang={lang} size={9} />}
                </div>
                <ScoreBar value={it.result.value} community={it.result.community_value} markers={it.markers} direction={it.metric.direction} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs mb-5" style={{ color: C.textSoft }}>{t.groupingFooter}</p>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: C.navy }}>{t.keyBacteria}</span>
      </div>
      <div className="rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
        {visibleBacteria.map((b, i) => (
          <div key={b.taxon_id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
            <BacteriumRow name={b.name} role={b.role} level={b.level} levelLabel={b.level} plainText={lang === "es" ? b.plainEs || b.plainEn : b.plainEn}
              important clientScore={b.client_score} communityScore={b.community_score} lang={lang} />
          </div>
        ))}
      </div>
      {gut.keyBacteria.length > 6 && (
        <button onClick={() => setShowAllBacteria(s => !s)} className="text-sm font-semibold mb-5" style={{ color: V.purple }}>
          {showAllBacteria ? t.showLess : t.showAll(gut.keyBacteria.length)}
        </button>
      )}

      <button onClick={() => open("gut:safety")} className="w-full text-left rounded-xl p-4 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: C.text }}>{t.safetyScreen}</span>
          {gut.screenDetected > 0 && <StatusMark status="act" lang={lang} size={9} />}
        </div>
        <div className="text-xs" style={{ color: C.textSoft }}>{gut.screenDetected > 0 ? t.checksFound(gut.screenTotal, gut.screenDetected) : t.checksAllClear(gut.screenTotal)}</div>
      </button>

      <p className="text-xs text-center" style={{ color: C.textSoft }}>{t.footer}</p>

      <Sheet open={isOpen("gut:variety")} onClose={close} title={t.varietySheetTitle}>
        <div className="text-2xl font-bold mb-1" style={{ color: C.navy }}>{gut.diversityValue != null ? `${gut.diversityValue} / 10` : "—"}</div>
        <div className="text-sm mb-3" style={{ color: C.textSoft }}>{gut.diversityValue != null && t.diversityBand(gut.diversityValue)}</div>
        {gut.reportTexts.variety_summary && <p className="text-sm" style={{ color: C.text }}>{lang === "es" ? gut.reportTexts.variety_summary.text_es || gut.reportTexts.variety_summary.text_en : gut.reportTexts.variety_summary.text_en}</p>}
      </Sheet>

      <Sheet open={isOpen("gut:safety")} onClose={close} title={t.safetyScreen}>
        <p className="text-sm" style={{ color: C.text }}>{gut.screenDetected > 0 ? t.safetyBody(gut.screenDetected) : t.checksAllClear(gut.screenTotal)}</p>
      </Sheet>

      {openScoreItem && (
        <Sheet open={!!openScoreItem} onClose={close} title={lang === "es" ? openScoreItem.metric.client_name_es || openScoreItem.metric.name_es : openScoreItem.metric.client_name_en || openScoreItem.metric.name_en}>
          <ScoreSheetContent item={{ ...openScoreItem, reportTexts: gut.reportTexts }} lang={lang} t={t} navigate={navigate} />
        </Sheet>
      )}
    </div>
  );
}
