import { supabase } from "./supabaseClient.js";

const KEY = "elevame_offline_writes";

function readQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeQueue(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable, nothing to queue into */ }
}

async function runWrite(item) {
  const q = supabase.from(item.table);
  const { error } = item.op === "upsert" ? await q.upsert(item.payload) : await q.insert(item.payload);
  if (error) throw error;
}

/**
 * Daily and phase check ins must save offline (brief 4.10). Tries the
 * write now; if the browser is offline or the request fails, queues
 * it in localStorage for flushOfflineQueue to retry later.
 */
export async function writeOrQueue(table, op, payload) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    writeQueue([...readQueue(), { table, op, payload, queuedAt: Date.now() }]);
    return { queued: true };
  }
  try {
    await runWrite({ table, op, payload });
    return { queued: false };
  } catch {
    writeQueue([...readQueue(), { table, op, payload, queuedAt: Date.now() }]);
    return { queued: true };
  }
}

export async function flushOfflineQueue() {
  const queue = readQueue();
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try { await runWrite(item); } catch { remaining.push(item); }
  }
  writeQueue(remaining);
}

export function installOfflineFlush() {
  window.addEventListener("online", flushOfflineQueue);
  flushOfflineQueue();
}
