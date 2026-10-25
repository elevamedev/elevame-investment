import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Sheets live in the `sheet` search param (brief 1.1): `?sheet=score:sugar_index`.
 * Each open is a history entry, so the hardware/browser back button
 * closes the sheet instead of leaving the screen — and Sheet.jsx's
 * own Escape handling calls the same `close`.
 *
 * A sheet opened from a sheet replaces it (one level only, per the
 * brief) rather than stacking history entries.
 */
export function useSheetParam() {
  const [params, setParams] = useSearchParams();
  const sheet = params.get("sheet");

  const open = useCallback((value) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("sheet", value);
      return next;
    }, { replace: !!sheet }); // replace, not push, when a sheet is already open — one level deep
  }, [setParams, sheet]);

  const close = useCallback(() => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete("sheet");
      return next;
    });
  }, [setParams]);

  return { sheet, open, close, isOpen: value => sheet === value };
}
