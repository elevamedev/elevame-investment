import { C } from "../theme.js";

const COPY = {
  en: {
    genusTitle: "Your top gut bacteria families",
    keyBacteriaTitle: "Key bacteria",
    you: "You",
    communityAvg: "Community average",
    noData: "No taxonomy data for this report yet.",
  },
  es: {
    genusTitle: "Tus principales familias de bacterias intestinales",
    keyBacteriaTitle: "Bacterias clave",
    you: "Tú",
    communityAvg: "Media de la comunidad",
    noData: "Todavía no hay datos de taxonomía para este informe.",
  },
};

// Aggregate "remainder" rows from the extraction ("Others"/"Otros")
// aren't a real genus to compare against — exclude them from the
// top-6 client view.
function isAggregateRow(name) {
  return /^others?$/i.test((name || "").trim()) || /^otros?$/i.test((name || "").trim());
}

function Legend({ c }) {
  return (
    <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: C.textSoft }}>
      <span className="flex items-center gap-1.5">
        <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: C.purple }} />
        {c.you}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: C.textSoft }} />
        {c.communityAvg}
      </span>
    </div>
  );
}

function CompareBar({ pct, color }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 6, background: C.line, width: "100%" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, pct))}%`, background: color }} />
    </div>
  );
}

function CompareRow({ name, clientValue, communityValue, max, unit }) {
  const clientPct = max > 0 ? (clientValue / max) * 100 : 0;
  const communityPct = max > 0 ? (communityValue / max) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: C.text }}>{name}</span>
        <span className="text-xs" style={{ color: C.text }}>
          {Number(clientValue).toFixed(1)}{unit} <span style={{ color: C.textSoft }}>vs {Number(communityValue).toFixed(1)}{unit}</span>
        </span>
      </div>
      <CompareBar pct={clientPct} color={C.purple} />
      <div className="mt-1">
        <CompareBar pct={communityPct} color={C.textSoft} />
      </div>
    </div>
  );
}

export default function GenusChart({ lang, genusAbundance, keyBacteria, taxaById }) {
  const c = COPY[lang] || COPY.en;

  const genusRows = (genusAbundance || [])
    .map(g => ({ name: taxaById?.[g.taxon_id]?.name || g.taxon_id, client: g.client_pct, community: g.world_pct }))
    .filter(r => !isAggregateRow(r.name))
    .sort((a, b) => b.client - a.client)
    .slice(0, 6);

  const keyBacteriaRows = (keyBacteria || [])
    .map(k => ({ name: taxaById?.[k.taxon_id]?.name || k.taxon_id, client: k.client_score, community: k.community_score }))
    .sort((a, b) => b.client - a.client);

  const genusMax = Math.max(1, ...genusRows.flatMap(r => [r.client, r.community]));

  if (!genusRows.length && !keyBacteriaRows.length) {
    return <div className="text-sm text-center py-6" style={{ color: C.textSoft }}>{c.noData}</div>;
  }

  return (
    <div>
      {genusRows.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>{c.genusTitle}</div>
          <Legend c={c} />
          {genusRows.map(r => (
            <CompareRow key={r.name} name={r.name} clientValue={r.client} communityValue={r.community} max={genusMax} unit="%" />
          ))}
        </div>
      )}
      {keyBacteriaRows.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>{c.keyBacteriaTitle}</div>
          <Legend c={c} />
          {keyBacteriaRows.map(r => (
            <CompareRow key={r.name} name={r.name} clientValue={r.client} communityValue={r.community} max={100} unit="" />
          ))}
        </div>
      )}
    </div>
  );
}
