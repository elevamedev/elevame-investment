import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const CONSENT_KIND = "health_data_processing";
const CONSENT_VERSION = "1";

const EMPTY = { loading: true, clientId: null, hasConsent: false, givenAt: null };

/**
 * GDPR health-data consent (brief 6.5): gates every client screen
 * until given, and backs Settings' "Privacy and consent" row.
 */
export function useV4Consent(userId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!userId) { setState({ ...EMPTY, loading: false }); return; }
    const { data: clientRow } = await supabase.from("clients").select("id").eq("auth_user_id", userId).maybeSingle();
    if (!clientRow) { setState({ ...EMPTY, loading: false }); return; }
    const { data: consent } = await supabase.from("consents").select("given_at")
      .eq("client_id", clientRow.id).eq("kind", CONSENT_KIND).is("withdrawn_at", null)
      .order("given_at", { ascending: false }).limit(1).maybeSingle();
    setState({ loading: false, clientId: clientRow.id, hasConsent: !!consent, givenAt: consent?.given_at || null });
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function giveConsent() {
    if (!state.clientId) return;
    await supabase.from("consents").insert({ client_id: state.clientId, kind: CONSENT_KIND, version: CONSENT_VERSION });
    await load();
  }

  async function withdrawConsent() {
    if (!state.clientId) return;
    await supabase.from("consents").update({ withdrawn_at: new Date().toISOString() })
      .eq("client_id", state.clientId).eq("kind", CONSENT_KIND).is("withdrawn_at", null);
    await load();
  }

  return { ...state, refetch: load, giveConsent, withdrawConsent };
}
