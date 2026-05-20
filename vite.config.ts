import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      includeAssets: ["favicon.ico", "icons/apple-touch-icon-180x180.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/games\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.+\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
