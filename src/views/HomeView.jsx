import { Settings, Activity, ShoppingCart } from "lucide-react";
import { C } from "../theme.js";
import SectionLabel from "../components/SectionLabel.jsx";
import GrowthTrack from "../components/GrowthTrack.jsx";
import FoodChip from "../components/FoodChip.jsx";

export default function HomeView({ lang, t, startDate, setStartDate, planDay, phaseIdx, dayIdx, phases, goToPlan, goToScores, banners, goToMilestone, goToShopping }) {
  const phase = phases[phaseIdx];
  const day = phase.days[dayIdx];
  const progress = Math.min(Math.max(planDay / 42, 0), 1);

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="rounded-2xl p-5 mb-5" style={{ background: C.navy }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-xs font-medium">{t.dayOf(planDay)}</div>
            <div className="text-white text-lg font-semibold">{lang === "en" ? `Phase ${phaseIdx + 1}` : `Fase ${phaseIdx + 1}`} · {phase.subtitle[lang]}</div>
          </div>
          <GrowthTrack progress={progress} />
        </div>
        <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: C.purple }} />
        </div>
      </div>

      {banners.map((b, i) => b.type === "milestone" ? (
        <button key={i} onClick={() => goToMilestone(b.milestone.id)} className="w-full text-left rounded-xl p-4 mb-3 flex items-center gap-3"
          style={{ background: C.teal + "17", border: `1px solid ${C.teal}55` }}>
          <Activity size={18} color={C.teal} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.navy }}>{t.milestoneReady(b.milestone.label[lang])}</div>
            <div className="text-xs" style={{ color: C.textSoft }}>{t.milestoneSub}</div>
          </div>
        </button>
      ) : (
        <button key={i} onClick={() => goToShopping(b.phaseId)} className="w-full text-left rounded-xl p-4 mb-3 flex items-center gap-3"
          style={{ background: C.amber + "1c", border: `1px solid ${C.amber}66` }}>
          <ShoppingCart size={18} color={C.amber} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.navy }}>{t.newPhaseBanner}</div>
            <div className="text-xs" style={{ color: C.textSoft }}>{t.newPhaseSub}</div>
          </div>
        </button>
      ))}

      <SectionLabel>{t.todaysMeals}</SectionLabel>
      <div className="space-y-3 mb-6">
        {day.meals.map((m, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: C.purple }}>{t.meal[m.labelKey]}</span>
            <div className="font-semibold mt-1 mb-1.5" style={{ color: C.text }}>{m.dish[lang]}</div>
            <div className="flex flex-wrap">{m.foods.map(id => <FoodChip key={id} id={id} lang={lang} />)}</div>
          </div>
        ))}
      </div>

      {day.tip && (
        <div className="rounded-xl p-4 mb-6" style={{ background: C.purpleSoft }}>
          <div className="text-sm" style={{ color: C.navy }}><span className="font-semibold">{t.antiInflamNote}</span>{day.tip[lang]}</div>
        </div>
      )}

      <button onClick={goToPlan} className="w-full py-3 rounded-xl font-semibold text-white text-sm" style={{ background: C.purple }}>{t.seeFullPlan}</button>
      <button onClick={goToScores} className="w-full py-3 rounded-xl font-semibold text-sm mt-2.5" style={{ background: C.card, color: C.navy, border: `1px solid ${C.line}` }}>
        {t.scoresTitle}
      </button>

      <div className="mt-6 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Settings size={14} color={C.textSoft} />
          <span className="text-xs font-medium" style={{ color: C.textSoft }}>{t.planStartDate}</span>
        </div>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2" style={{ border: `1px solid ${C.line}`, color: C.text }} />
      </div>
    </div>
  );
}
