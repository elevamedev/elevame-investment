import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Current/next Authenticator Assurance Level for the signed-in
 * session. aal1 = password only, aal2 = password + a verified second
 * factor. Staff must reach aal2 before /admin routes render (brief
 * 4.0: "turn on multi factor sign in (Supabase TOTP) and require it
 * for /admin routes, by checking the aal2 level in the session").
 */
export function useAAL() {
  const [state, setState] = useState({ loading: true, currentLevel: null, nextLevel: null });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { setState({ loading: false, currentLevel: null, nextLevel: null }); return; }
    setState({ loading: false, currentLevel: data.currentLevel, nextLevel: data.nextLevel });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}
