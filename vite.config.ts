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
      // InjectManifest strategy — uses our custom src/sw.ts so we can handle
      // push events (GenerateSW can't). Runtime caching is implemented inside sw.ts.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: "auto",
      manifest: false,
      includeAssets: ["favicon.ico", "icons/apple-touch-icon-180x180.png"],
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        globIgnores: ["games/**"],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Vendor split. CRITICAL: recharts ต้องแยกออกจาก d3 (TDZ pitfall, v1.9.3 hotfix).
        // Default Vite chunking already keeps them separate — เราแค่ตัง explicit vendor chunks
        // ที่ shared กับหลายหน้า ออกจาก main bundle เพื่อให้ cache แยกและ parallel download.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "motion-vendor": ["framer-motion"],
          "supabase-vendor": ["@supabase/supabase-js"],
          // CCTV: leaflet + hls แยก vendor chunk ของตัวเอง (self-contained, ไม่ co-bundle กับ d3/recharts)
          "leaflet-vendor": ["leaflet", "react-leaflet"],
        },
      },
    },
  },
}));
