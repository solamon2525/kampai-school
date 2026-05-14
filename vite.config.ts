import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react-router-dom/") ||
            id.includes("/react-router/") ||
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui/")) return "radix-vendor";
          if (id.includes("/recharts/") || id.includes("/d3-")) return "charts-vendor";
          if (
            id.includes("react-quill") ||
            id.includes("/quill") ||
            id.includes("dompurify")
          ) {
            return "editor-vendor";
          }
          if (id.includes("@dnd-kit/")) return "dnd-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (id.includes("@uppy/")) return "uppy-vendor";
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/") ||
            id.includes("/zod/")
          ) {
            return "form-vendor";
          }
          if (id.includes("@tanstack/")) return "query-vendor";
          if (
            id.includes("react-photo-album") ||
            id.includes("yet-another-react-lightbox") ||
            id.includes("embla-carousel")
          ) {
            return "media-vendor";
          }
          if (
            id.includes("html5-qrcode") ||
            id.includes("react-webcam") ||
            id.includes("react-qr-code")
          ) {
            return "scanner-vendor";
          }
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@supabase/")) return "supabase-vendor";
          if (id.includes("date-fns")) return "utils-vendor";
        },
      },
    },
  },
}));
