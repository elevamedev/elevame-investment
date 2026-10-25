import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

/**
 * Offline query/mutation persistence (brief 1.1): paused writes
 * (ticks, check ins made with no signal) must survive a reload, not
 * be lost. TanStack Query's PersistQueryClientProvider + an
 * IndexedDB persister does this; `idb-keyval` is the thin IndexedDB
 * wrapper the TanStack docs point to for a custom persister.
 *
 * The cache key is per user (brief 4.12's offline design: "persisted
 * in IndexedDB under a key with the user id, and wiped on sign out")
 * so one device signed into two accounts never mixes their data, and
 * signing out can drop exactly one user's cache.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

export function persisterKey(userId) { return `elevame-query-cache-${userId}`; }

export function createIndexedDbPersister(userId) {
  const key = persisterKey(userId);
  return createAsyncStoragePersister({
    storage: {
      getItem: () => get(key),
      setItem: (_key, value) => set(key, value),
      removeItem: () => del(key),
    },
    key,
  });
}

/** Wipes this user's persisted cache — call on sign out (brief 4.12). */
export async function clearPersistedCache(userId) {
  await del(persisterKey(userId));
}
