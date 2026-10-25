import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
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
});
