import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useV4Theme } from "../context/ThemeContext.jsx";

/**
 * Applies the client's saved theme and text size (client_settings,
 * brief 4.11) as soon as they're known, so every screen reflects
 * them — not just once the Settings tab itself has loaded them.
 * Settings writes the same two values back through useV4Settings.
 */
export function useV4ThemeSync(userId) {
  const { setTheme } = useV4Theme();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data: clientRow } = await supabase.from("clients").select("id").eq("auth_user_id", userId).maybeSingle();
      if (!clientRow || cancelled) return;
      const { data: settings } = await supabase.from("client_settings").select("theme,text_size").eq("client_id", clientRow.id).maybeSingle();
      if (!settings || cancelled) return;
      if (settings.theme === "light" || settings.theme === "dark") setTheme(settings.theme);
      document.documentElement.dataset.textSize = settings.text_size === "large" ? "large" : "standard";
    })();
    return () => { cancelled = true; };
  }, [userId, setTheme]);
}
