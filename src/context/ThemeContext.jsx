import { createContext, useContext, useMemo, useState } from "react";
import { V4_LIGHT, V4_DARK, V4_SHADOW, V4_SHADOW_DARK } from "../theme4.js";

const ThemeContext = createContext(null);

/**
 * v4 light/dark theme state for the new design system (src/theme4.js,
 * src/components/v4/). The app launches light only (brief 1.1); the
 * toggle this provides is read by Settings (Phase P) once it exists —
 * nothing switches it yet.
 */
export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setTheme] = useState(initialTheme);
  const value = useMemo(() => ({
    theme,
    setTheme,
    V: theme === "dark" ? V4_DARK : V4_LIGHT,
    shadow: theme === "dark" ? V4_SHADOW_DARK : V4_SHADOW,
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useV4Theme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useV4Theme must be used within a ThemeProvider");
  return ctx;
}
