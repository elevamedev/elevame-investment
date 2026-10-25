import { useRef } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, createIndexedDbPersister } from "./queryClient.js";

/**
 * Wraps the app in offline-persisted TanStack Query, keyed to the
 * signed-in user. Resumes paused mutations once the persisted cache
 * is restored, as the TanStack offline guide requires — otherwise a
 * tick or check-in made offline and queued as a paused mutation never
 * actually replays after reload.
 *
 * With no user (signed out / auth not resolved yet), queries still
 * run but nothing is persisted — there's no user id to key the cache
 * on, and nothing should survive into the next signed-in session.
 */
export default function OfflineQueryProvider({ userId, children }) {
  const persisterRef = useRef(null);
  if (userId && persisterRef.current?.userId !== userId) {
    persisterRef.current = { userId, persister: createIndexedDbPersister(userId) };
  }
  if (!userId) persisterRef.current = null;

  if (!persisterRef.current) {
    return <QueryClientProviderOnly>{children}</QueryClientProviderOnly>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: persisterRef.current.persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

function QueryClientProviderOnly({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Call from sign out: stop the persisted-cache write loop and clear this session's in-memory cache. */
export function resetQueryClientOnSignOut() {
  queryClient.clear();
}

