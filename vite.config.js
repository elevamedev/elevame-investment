import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// brief section 9: the e2e suite runs the real app against a mock
// Supabase client, never the production one — `npm run test:e2e`
// serves this mode so every import of src/lib/supabaseClient.js
// resolves to the mock instead, with no change to the real file.
// A resolveId hook (rather than resolve.alias) so only a real JS
// import of that exact module is redirected — nothing else Vite
// resolves along the way (CSS, source maps, …) is ever touched.
function mockSupabaseClient(enabled) {
  const target = path.resolve(__dirname, "tests/e2e/mockSupabaseClient.js");
  return {
    name: "mock-supabase-client",
    enforce: "pre",
    resolveId(source, importer) {
      // "/supabaseClient.js" (leading slash), not "/lib/supabaseClient.js":
      // the file's own directory imports it as "./supabaseClient.js" (no
      // "lib" in that specifier) — e.g. src/lib/offlineQueue.js. The
      // leading slash still excludes this mock's own filename.
      if (!enabled || !importer) return null;
      return source.endsWith("/supabaseClient.js") ? target : null;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    mockSupabaseClient(mode === "e2e"),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Elevame",
        short_name: "Elevame",
        description: "Your gut report, plan and food scores.",
        start_url: "/",
        display: "standalone",
        background_color: "#f6f6fa",
        theme_color: "#5131da",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        // App shell precached; API calls go network-first so a signed-in
        // client always sees fresh data when online and the last good
        // response when they aren't (brief 1.1 / 4.12's offline design —
        // the IndexedDB query cache is the source of truth for writes
        // made offline, this is just the network layer underneath it).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith(".supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "elevame-api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
}));
