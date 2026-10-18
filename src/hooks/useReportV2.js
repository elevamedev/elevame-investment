import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Client-facing read hook for the v2 data model (DATA_MODEL_SPEC.md).
 * Separate from useClientData.js (which still drives the v1-backed
 * screens — plan/shopping/tracker/milestones/old gut_scores) because
 * the two models are deliberately dual-written for now; see
 * MIGRATION_LOG.md. Only queries tables RLS actually grants the
 * `client` role — clinician/admin-only tables (condition_results,
 * compound_scores, krona_abundance, taxon_readings,
 * data_quality_issues, ...) aren't fetched here at all, since a
 * client would get nothing back for them anyway.
 *
 * Resolves the signed-in client via `clients.auth_user_id`. That
 * column is kept in sync by the `claim_kit()` function (see
 * supabase/schema_v2_admin.sql) — if a kit was claimed before that
 * migration ran, `auth_user_id` may still be null for them, in which
 * case this hook resolves nothing and the v2-powered screens render
 * their "nothing here yet" empty state rather than erroring.
 */
const EMPTY = {
  client: null,
  tests: [],
  selectedTest: null,
  themes: [],
  metrics: [],
  metricResults: [],
  genusAbundance: [],
  keyBacteria: [],
  taxonStatus: [],
  screenResults: [],
  foodScores: [],
  foodHighlights: [],
  supplementScores: [],
  reportComments: [],
  insights: [],
};

export function useReportV2(userId) {
  const [catalog, setCatalog] = useState({ themes: [], metrics: [], taxa: [], foods: [], foodCategories: [], screenPanels: [], supplements: [] });
  const [client, setClient] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [testData, setTestData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catalogue — same for every client, loaded once.
  useEffect(() => {
    (async () => {
      const [{ data: themes }, { data: metrics }, { data: taxa }, { data: foods }, { data: foodCategories }, { data: screenPanels }, { data: supplements }] = await Promise.all([
        supabase.from("themes").select("*").order("sort_order"),
        supabase.from("metrics").select("*").order("sort_order"),
        supabase.from("taxa").select("*"),
        supabase.from("foods").select("id,name_en,name_es,category_id,image_url,family"),
        supabase.from("food_categories").select("*").order("sort_order"),
        supabase.from("screen_panels").select("*"),
        supabase.from("supplements").select("*"),
      ]);
      setCatalog({ themes: themes || [], metrics: metrics || [], taxa: taxa || [], foods: foods || [], foodCategories: foodCategories || [], screenPanels: screenPanels || [], supplements: supplements || [] });
    })();
  }, []);

  const loadClientAndTests = useCallback(async () => {
    if (!userId) { setClient(null); setTests([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: clientRow, error: clientErr } = await supabase.from("clients").select("*").eq("auth_user_id", userId).maybeSingle();
      if (clientErr) throw clientErr;
      setClient(clientRow);
      if (!clientRow) { setTests([]); setLoading(false); return; }

      const { data: testRows, error: testsErr } = await supabase
        .from("tests").select("*").eq("client_id", clientRow.id).order("test_number", { ascending: false });
      if (testsErr) throw testsErr;
      setTests(testRows || []);
      setSelectedTestId(prev => prev && testRows?.some(t => t.id === prev) ? prev : testRows?.[0]?.id ?? null);
      if (!testRows?.length) setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadClientAndTests(); }, [loadClientAndTests]);

  useEffect(() => {
    if (!selectedTestId) { setTestData(EMPTY); if (client !== undefined) setLoading(false); return; }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: metricResults, error: e1 },
          { data: genusAbundance, error: e2 },
          { data: keyBacteria, error: e3 },
          { data: taxonStatus, error: e4 },
          { data: screenResults, error: e5 },
          { data: foodScores, error: e6 },
          { data: foodHighlights, error: e7 },
          { data: supplementScores, error: e8 },
          { data: reportComments, error: e9 },
          { data: insights, error: e10 },
        ] = await Promise.all([
          supabase.from("metric_results").select("*").eq("test_id", selectedTestId),
          supabase.from("genus_abundance").select("*").eq("test_id", selectedTestId),
          supabase.from("key_bacteria").select("*").eq("test_id", selectedTestId),
          supabase.from("taxon_status").select("*").eq("test_id", selectedTestId),
          supabase.from("screen_results").select("*").eq("test_id", selectedTestId),
          supabase.from("food_scores").select("*").eq("test_id", selectedTestId),
          supabase.from("food_highlights").select("*").eq("test_id", selectedTestId),
          supabase.from("supplement_scores").select("*").eq("test_id", selectedTestId),
          supabase.from("report_comments").select("*").eq("test_id", selectedTestId),
          supabase.from("insights").select("*").eq("test_id", selectedTestId),
        ]);
        const err = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9 || e10;
        if (err) throw err;
        setTestData({
          client, tests, selectedTest: tests.find(t => t.id === selectedTestId) || null,
          ...catalog,
          metricResults: metricResults || [], genusAbundance: genusAbundance || [], keyBacteria: keyBacteria || [],
          taxonStatus: taxonStatus || [], screenResults: screenResults || [], foodScores: foodScores || [],
          foodHighlights: foodHighlights || [], supplementScores: supplementScores || [], reportComments: reportComments || [],
          insights: insights || [],
        });
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestId]);

  const taxaById = useMemo(() => Object.fromEntries(catalog.taxa.map(t => [t.id, t])), [catalog.taxa]);
  const metricsById = useMemo(() => Object.fromEntries(catalog.metrics.map(m => [m.id, m])), [catalog.metrics]);
  const foodsById = useMemo(() => Object.fromEntries(catalog.foods.map(f => [f.id, f])), [catalog.foods]);
  const previousTest = useMemo(() => {
    const idx = tests.findIndex(t => t.id === selectedTestId);
    return idx >= 0 ? tests[idx + 1] : null; // tests is sorted newest-first
  }, [tests, selectedTestId]);

  return {
    loading, error, client, tests, selectedTestId, setSelectedTestId, previousTest,
    ...catalog, ...testData, taxaById, metricsById, foodsById,
    refetch: loadClientAndTests,
  };
}
