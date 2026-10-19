import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  server: {
    port: 5173,
  },
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
  build: {
    target: "es2015",
    sourcemap: false,
    minify: "esbuild",
  },
});

