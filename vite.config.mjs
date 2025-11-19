import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import eslint from "vite-plugin-eslint";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    eslint({
      cache: false,          // ensures fresh results every run
      include: ["src/**/*.{ts,tsx,jsx}"], // adjust path as needed
      failOnWarning: false,
      failOnError: false,     // set true if you want HMR to stop on errors
      emitError: true,
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:9001',
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.mjs",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../"),
      },
    },
  },
});
