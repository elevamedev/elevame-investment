import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useC } from "../theme.js";
import { useV4Theme } from "../context/ThemeContext.jsx";
import { useFoodsData } from "../hooks/useFoodsData.js";
import { useV4BodySystem } from "../hooks/useV4BodySystem.js";
import StatusMark from "../components/v4/StatusMark.jsx";
import ScoreBar from "../components/v4/ScoreBar.jsx";
import BacteriumRow from "../components/v4/BacteriumRow.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import ScoreSheetContent from "../components/v4/ScoreSheet.jsx";
import { useSheetParam } from "../hooks/useSheetParam.js";

const COPY = {
  en: {
    back: "‹ Home", whatTestShows: "What your test shows", bacteriaBehind: "Bacteria behind it",
    moreCounted: n => `${n} bacteria counted in this score ›`, otherScores: "Your other scores",
    whatHelps: "What helps", fromPlan: "From your plan", fromReport: "From your gut report",
    elevameChoice: "Food examples chosen by Elevame from your list",
    howGoing: "How it's going", whenStarted: "Digestion when you started", now: "Digestion now",
    lastCheckin: label => `At your last check in: ${label} processed snacks a week`, firstCheckin: "Your first check in fills this in.",
    whyMatters: "Why it matters", readMore: "Read more and sources",
    suggestedGoal: "Suggested goal", yourGoal: "Your goal", add: "Add", following: "Following",
    you: n => `You ${n}`, bacteriaCounted: n => `Bacteria counted in this score (${n})`,
    plainSentence: "No invented direction — the portal lists which bacteria count towards this score, not which way each one pushes it.",
    partOf: system => `Part of ${system}`, planWorks: "Your plan works on this",
    groupingFooter: "Grouping scores into body systems is Elevame's, the results are from your Enbiosis report.",
    footer: "A snapshot of your gut, not a diagnosis.", loading: "Loading…",
    noReport: "This page appears here once your nutritionist has reviewed your report.",
  },
  es: {
    back: "‹ Inicio", whatTestShows: "Lo que muestra tu test", bacteriaBehind: "Bacterias detrás de esto",
    moreCounted: n => `${n} bacterias contadas en este score ›`, otherScores: "Tus otros scores",
    whatHelps: "Qué ayuda", fromPlan: "De tu plan", fromReport: "De tu informe intestinal",
    elevameChoice: "Ejemplos de alimentos elegidos por Elevame de tu lista",
    howGoing: "Cómo va", whenStarted: "Digestión al empezar", now: "Digestión ahora",
    lastCheckin: label => `En tu último seguimiento: ${label} snacks procesados a la semana`, firstCheckin: "Tu primer seguimiento completará esto.",
    whyMatters: "Por qué importa", readMore: "Leer más y fuentes",
    suggestedGoal: "Objetivo sugerido", yourGoal: "Tu objetivo", add: "Añadir", following: "Siguiendo",
    you: n => `Tú ${n}`, bacteriaCounted: n => `Bacterias contadas en este score (${n})`,
    plainSentence: "Sin dirección inventada: el informe indica qué bacterias cuentan para este score, no hacia qué lado lo empuja cada una.",
    partOf: system => `Parte de ${system}`, planWorks: "Tu plan trabaja en esto",
    groupingFooter: "Agrupar los scores en sistemas corporales es de Elevame; los resultados son de tu informe Enbiosis.",
    footer: "Un resumen de tu intestino, no un diagnóstico.", loading: "Cargando…",
    noReport: "Esta página aparecerá cuando tu nutricionista haya revisado tu informe.",
  },
};

const CONDITION_RELATION_TEXT = {
  en: {
    more_low: (c) => `More of it goes with more ${c}. Yours is low, which works for you.`,
    more_high: (c) => `More of it goes with more ${c}. Yours is high, which works against you.`,
    less_high: (c) => `More of it goes with less ${c}. Yours is high, which works for you.`,
    less_low: (c) => `More of it goes with less ${c}. Yours is low, which works against you.`,
    normal: (c, rel) => `More of it goes with ${rel === "less_with" ? "less" : "more"} ${c}. Yours is in the normal range.`,
    makes: (product, level) => `Makes ${product}. Yours is ${level}.`,
  },
  es: {
    more_low: (c) => `Más cantidad va con más ${c}. La tuya es baja, lo que juega a tu favor.`,
    more_high: (c) => `Más cantidad va con más ${c}. La tuya es alta, lo que juega en tu contra.`,
    less_high: (c) => `Más cantidad va con menos ${c}. La tuya es alta, lo que juega a tu favor.`,
    less_low: (c) => `Más cantidad va con menos ${c}. La tuya es baja, lo que juega en tu contra.`,
    normal: (c, rel) => `Más cantidad va con ${rel === "less_with" ? "menos" : "más"} ${c}. La tuya está en el rango normal.`,
    makes: (product, level) => `Produce ${product}. La tuya es ${level}.`,
  },
};

/** Brief 4.6's association-line decision table. */
function associationLine(bact, lang) {
  const t = CONDITION_RELATION_TEXT[lang] || CONDITION_RELATION_TEXT.en;
  const condition = lang === "es" ? bact.conditionName?.name_es || bact.conditionName?.name_en : bact.conditionName?.name_en;
  if (bact.relation === "makes") return t.makes(lang === "es" ? bact.product_es || bact.product_en : bact.product_en, bact.level);
  if (bact.relation === "context" || !condition) return null; // shows plain text instead
  if (bact.level === "normal") return t.normal(condition, bact.relation);
  if (bact.relation === "more_with") return bact.level === "low" ? t.more_low(condition) : t.more_high(condition);
  return bact.level === "high" ? t.less_high(condition) : t.less_low(condition);
}

export default function BodySystemView({ lang, user, profile, themeId }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const { V } = useV4Theme();
  const navigate = useNavigate();
  const { isOpen, open, close } = useSheetParam();
  const [showExtra, setShowExtra] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [showGap, setShowGap] = useState(false);

  const foodsData = useFoodsData(user?.id, profile?.id);
  const body = useV4BodySystem(foodsData.client?.id, foodsData.testId, themeId);

  const openSignal = body.signals.find(s => s.metric_id && isOpen(`score:${s.metric_id}`));
  const openOtherScore = body.otherScores.find(o => isOpen(`score:${o.metric.id}`));
  const openScoreItem = openSignal
    ? {
        metric: { id: openSignal.metric_id, name_en: openSignal.title_en, name_es: openSignal.title_es, plain_en: openSignal.verdict_en, plain_es: openSignal.verdict_es, direction: openSignal.direction || "higher_better", theme_id: themeId },
        result: openSignal.result, markers: openSignal.markers,
      }
    : openOtherScore
      ? { metric: openOtherScore.metric, result: openOtherScore.result, markers: openOtherScore.markers }
      : null;

  if (foodsData.loading || body.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;
  if (!body.hasReport || !body.theme) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.noReport}</div>;

  const themeName = lang === "es" ? body.theme.name_es : body.theme.name_en;

  return (
    <div className="px-4 pt-4 pb-24">
      <button onClick={() => navigate("/")} className="text-sm font-medium mb-3" style={{ color: C.textSoft }}>{t.back}</button>

      <div className="rounded-xl overflow-hidden mb-3" style={{ height: 160, background: C.bg }}>
        {body.education?.image_url && <img src={body.education.image_url} alt={lang === "es" ? body.education.image_alt_es : body.education.image_alt_en} className="w-full h-full object-cover" />}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: C.navy }}>{themeName}</h1>
        {body.status && <StatusMark status={body.status.status} lang={lang} size={10} />}
      </div>
      {body.education?.hook_en && <p className="text-sm mb-4" style={{ color: C.textSoft }}>{lang === "es" ? body.education.hook_es || body.education.hook_en : body.education.hook_en}</p>}

      {body.goalInsight && (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background: C.purpleSoft }}>
          <span className="text-sm font-semibold" style={{ color: C.navy }}>{body.goalFollowed ? t.yourGoal : t.suggestedGoal}</span>
          {body.goalFollowed ? (
            <span className="text-sm font-semibold" style={{ color: V.purpleText }}>{t.following}</span>
          ) : (
            <button onClick={body.followGoal} className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: C.purple, color: "#fff" }}>{t.add}</button>
          )}
        </div>
      )}

      {body.signals.length > 0 && (
        <>
          <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.whatTestShows}</div>
          {body.signals.map(s => (
            <div key={s.id} className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{lang === "es" ? s.title_es || s.title_en : s.title_en}</span>
                <StatusMark status={s.status} lang={lang} size={9} />
              </div>
              <p className="text-sm mb-2" style={{ color: C.textSoft }}>{lang === "es" ? s.verdict_es || s.verdict_en : s.verdict_en}</p>
              {s.metric_id && s.result ? (
                <button onClick={() => open(`score:${s.metric_id}`)} className="w-full text-left">
                  <ScoreBar value={s.result.value} community={s.result.community_value} markers={s.markers} direction={s.direction || "higher_better"} />
                </button>
              ) : s.detail_en ? (
                <p className="text-xs" style={{ color: C.textSoft }}>{lang === "es" ? s.detail_es || s.detail_en : s.detail_en}</p>
              ) : null}

              {s.bacteria.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold mb-1" style={{ color: C.navy }}>{t.bacteriaBehind}</div>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                    {s.bacteria.map((b, i) => (
                      <div key={b.taxon_id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                        <BacteriumRow name={b.name} role={b.role} level={b.level} levelLabel={b.level}
                          line={b.relation === "context" ? null : associationLine(b, lang)}
                          plainText={lang === "es" ? b.plainEs || b.plainEn : b.plainEn}
                          facts={b.facts.map(f => ({ label: f.label, text: lang === "es" ? f.textEs || f.text : f.text }))} lang={lang} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {s.extraCount > 0 && (
                <div className="mt-2">
                  <button onClick={() => setShowExtra(e => ({ ...e, [s.id]: !e[s.id] }))} className="text-xs font-semibold" style={{ color: V.purpleText }}>
                    {t.moreCounted(s.extraCount)}
                  </button>
                  {showExtra[s.id] && (
                    <div className="rounded-xl overflow-hidden mt-1.5" style={{ border: `1px solid ${C.line}` }}>
                      {s.extraTaxa.map((row, i) => (
                        <div key={row.taxon_id} className="flex items-center justify-between px-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                          <span className="text-xs" style={{ color: C.text }}>{row.name}</span>
                          <span className="text-[11px]" style={{ color: C.textSoft }}>{row.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {body.otherScores.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.otherScores}</div>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {body.otherScores.map((o, i) => (
              <button key={o.metric.id} onClick={() => open(`score:${o.metric.id}`)} className="w-full text-left px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: C.text }}>{lang === "es" ? o.metric.client_name_es || o.metric.name_es : o.metric.client_name_en || o.metric.name_en}</span>
                  {o.result.printed_badge && <StatusMark status={o.result.printed_badge} lang={lang} size={9} />}
                </div>
                <ScoreBar value={o.result.value} community={o.result.community_value} markers={o.markers} direction={o.metric.direction} />
              </button>
            ))}
          </div>
        </div>
      )}

      {(body.goalInsight || body.levers.length > 0) && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.whatHelps}</div>
          {body.goalInsight && (
            <div className="rounded-xl p-4 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: C.textSoft }}>{t.fromPlan}</div>
              <p className="text-sm mb-2" style={{ color: C.text }}>{lang === "es" ? body.goalInsight.client_text_es || body.goalInsight.client_text_en : body.goalInsight.client_text_en}</p>
              {body.goalInsight.foods.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {body.goalInsight.foods.map(f => (
                    <span key={f.food_id} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>{lang === "es" ? f.food?.name_es || f.food?.name_en : f.food?.name_en}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {body.levers.map(l => (
            <div key={l.id} className="rounded-xl p-4 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: C.textSoft }}>{t.fromReport}</div>
              <p className="text-sm mb-2" style={{ color: C.text }}>{lang === "es" ? l.text_es || l.text_en : l.text_en}</p>
              {l.foods.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {l.foods.map(f => (
                      <span key={f.food_id} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>{lang === "es" ? f.food?.name_es || f.food?.name_en : f.food?.name_en}</span>
                    ))}
                  </div>
                  <div className="text-[11px]" style={{ color: C.textSoft }}>{t.elevameChoice}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {body.goalInsight && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.howGoing}</div>
          <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {body.howItsGoing?.tracking === "feel" ? (
              body.howItsGoing.baseline != null || body.howItsGoing.now != null ? (
                <div className="flex justify-between text-sm">
                  <div><div className="text-xs mb-1" style={{ color: C.textSoft }}>{t.whenStarted}</div><b>{body.howItsGoing.baseline ?? "—"}</b></div>
                  <div><div className="text-xs mb-1" style={{ color: C.textSoft }}>{t.now}</div><b>{body.howItsGoing.now ?? "—"}</b></div>
                </div>
              ) : <p className="text-sm" style={{ color: C.textSoft }}>{t.firstCheckin}</p>
            ) : body.howItsGoing?.tracking === "behaviour" && body.howItsGoing.processedSnacks ? (
              <p className="text-sm" style={{ color: C.text }}>{t.lastCheckin(body.howItsGoing.processedSnacks)}</p>
            ) : (
              <p className="text-sm" style={{ color: C.textSoft }}>{t.firstCheckin}</p>
            )}
          </div>
        </div>
      )}

      {body.education && (
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.whyMatters}</div>
          <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <p className="text-sm mb-2" style={{ color: C.text }}>{lang === "es" ? body.education.why_short_es || body.education.why_short_en : body.education.why_short_en}</p>
            {!showMore ? (
              <button onClick={() => setShowMore(true)} className="text-xs font-semibold" style={{ color: V.purpleText }}>{t.readMore}</button>
            ) : (
              <>
                <p className="text-sm mb-2" style={{ color: C.textSoft }}>{lang === "es" ? body.education.why_more_es || body.education.why_more_en : body.education.why_more_en}</p>
                {body.facts.map((f, i) => (
                  <div key={f.id} className="text-xs mb-1" style={{ color: C.textSoft, borderTop: i === 0 ? "none" : `1px solid ${C.line}`, paddingTop: i === 0 ? 0 : 6 }}>
                    {lang === "es" ? f.text_es || f.text_en : f.text_en}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {body.goalInsight?.gap_en && (
        <div className="mb-4">
          {!showGap ? (
            <button onClick={() => setShowGap(true)} className="text-xs font-semibold" style={{ color: V.purpleText }}>What your report can't tell us ›</button>
          ) : (
            <p className="text-xs" style={{ color: C.textSoft }}>{lang === "es" ? body.goalInsight.gap_es || body.goalInsight.gap_en : body.goalInsight.gap_en}</p>
          )}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: C.textSoft }}>{t.footer}</p>

      {openScoreItem && (
        <Sheet open={!!openScoreItem} onClose={close} title={lang === "es" ? openScoreItem.metric.name_es : openScoreItem.metric.name_en}>
          <ScoreSheetContent item={openScoreItem} lang={lang} t={t} navigate={navigate} />
        </Sheet>
      )}
    </div>
  );
}
