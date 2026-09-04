import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { C } from "../theme.js";
import { MILESTONES } from "../data/planTemplate.js";
import SectionLabel from "../components/SectionLabel.jsx";
import CheckinForm from "../components/CheckinForm.jsx";
import MilestoneRow from "../components/MilestoneRow.jsx";

export default function TrackerView({ t, lang, entries, todayEntry, saveEntry, milestones, saveMilestone, planDay, openMilestone, setOpenMilestone }) {
  const chartData = entries.slice(-14).map(e => ({ date: e.date.slice(5), [t.chart.Energy]: e.energy, [t.chart.Digestion]: e.digestion, [t.chart.Sleep]: e.sleep, [t.chart.Mood]: e.mood }));
  return (
    <div className="px-4 pt-4 pb-24">
      <SectionLabel>{t.planMilestones}</SectionLabel>
      <div className="mb-6">
        {MILESTONES.map(m => (
          <MilestoneRow key={m.id} t={t} lang={lang} milestone={m} entry={milestones[m.id]} planDay={planDay}
            isOpen={openMilestone === m.id} onOpen={setOpenMilestone} onSave={saveMilestone} />
        ))}
      </div>

      <SectionLabel>{t.dailyOptional}</SectionLabel>
      <div className="mb-4"><CheckinForm t={t} initial={todayEntry} saveLabel={t.saveTodaysCheckin} onSave={saveEntry} /></div>

      {entries.length > 1 && (
        <>
          <SectionLabel>{t.lastTwoWeeks}</SectionLabel>
          <div className="rounded-xl p-3 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textSoft }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: C.textSoft }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey={t.chart.Energy} stroke={C.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={t.chart.Digestion} stroke={C.purple} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={t.chart.Sleep} stroke={C.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={t.chart.Mood} stroke={C.sage} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
