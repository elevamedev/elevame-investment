import { useState } from "react";
import { ThemeProvider, useV4Theme } from "../context/ThemeContext.jsx";
import StatusMark from "../components/v4/StatusMark.jsx";
import ScoreBar from "../components/v4/ScoreBar.jsx";
import BacteriumRow from "../components/v4/BacteriumRow.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import LineChart from "../components/v4/LineChart.jsx";

/**
 * Visual reference for the v4 design system (brief Phase I done
 * criteria: "Test page matches v4shell.html at 390 px in both
 * themes; contrast audit passes"). Not wired into app routing yet —
 * there's no router until Phase B. Mount this directly (temporarily
 * swap src/main.jsx, as the project's existing headless-smoke-test
 * convention does) to check it against the mockup.
 */
function PreviewBody() {
  const { V, theme, setTheme } = useV4Theme();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div style={{ background: V.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: V.ink, position: "relative" }}>
      <div className="max-w-[390px] mx-auto p-5" style={{ paddingBottom: 120 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 22 }}>v4 components</h1>
          <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: V.card, color: V.ink, border: `1px solid ${V.line}` }}>
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>

        <h2 className="text-sm font-bold mb-2">StatusMark</h2>
        <div className="flex items-center gap-4 mb-6" style={{ background: V.card, borderRadius: 20, padding: 16 }}>
          <div className="flex items-center gap-1.5"><StatusMark status="act" /> <span className="text-xs">act (needs support)</span></div>
          <div className="flex items-center gap-1.5"><StatusMark status="watch" /> <span className="text-xs">watch (ring)</span></div>
          <div className="flex items-center gap-1.5"><StatusMark status="good" /> <span className="text-xs">good</span></div>
        </div>

        <h2 className="text-sm font-bold mb-2">ScoreBar</h2>
        <div className="mb-6" style={{ background: V.card, borderRadius: 20, padding: 16 }}>
          <ScoreBar value={69} community={35} markers={[{ value: 27 }, { value: 58 }]} direction="middle_best" />
        </div>

        <h2 className="text-sm font-bold mb-2">BacteriumRow</h2>
        <div className="mb-6" style={{ background: V.card, borderRadius: 20, overflow: "hidden" }}>
          <BacteriumRow name="Dorea" role="watch" level="high" levelLabel="Watch · High"
            line="More of it goes with more gas. Yours is high, which works against you."
            plainText="One of the bacteria that produce gas using carbohydrates."
            important communityScore={35} clientScore={69}
            facts={[{ label: "does", text: "Breaks down carbohydrates and produces gas." }, { label: "raises", text: "A diet rich in fermentable fibre." }]} />
          <div style={{ borderTop: `1px solid ${V.line}` }}>
            <BacteriumRow name="Akkermansia" role="helper" level="low" levelLabel="Helper · Low"
              line="More of it goes with less gut inflammation. Yours is low, which works against you."
              plainText="Protective in your gut inflammation, weight gain and blood sugar patterns." />
          </div>
        </div>

        <h2 className="text-sm font-bold mb-2">LineChart</h2>
        <div className="mb-6" style={{ background: V.card, borderRadius: 20, padding: 16 }}>
          <LineChart name="Digestion" values={[2.4, 2.8, 3.1, 3.5]} />
        </div>

        <h2 className="text-sm font-bold mb-2">Sheet</h2>
        <button onClick={() => setSheetOpen(true)}
          style={{ background: V.purple, color: "#fff", borderRadius: 14, padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>
          Open sheet
        </button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Example sheet">
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 20 }}>Example sheet</h2>
        <p style={{ color: V.ink2, fontSize: 14, lineHeight: 1.5 }}>Sheet content goes here. Escape or tapping outside closes it.</p>
      </Sheet>
    </div>
  );
}

export default function V4Preview() {
  return (
    <ThemeProvider>
      <PreviewBody />
    </ThemeProvider>
  );
}
