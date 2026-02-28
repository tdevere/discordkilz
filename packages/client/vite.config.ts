import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Prevent Vite from clearing the terminal
  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    // Bind only to localhost for the dev server.
    // To test the join link from another device on the same LAN, change
    // this to '0.0.0.0' temporarily and ensure your firewall allows it.
    host: "localhost",
    watch: {
      // Tell Vite to ignore changes inside the Rust/Tauri tree so it
      // doesn't trigger unnecessary reloads while cargo is rebuilding.
      ignored: ["**/src-tauri/**"],
    },
  },

  // Pass through variables that Tauri injects at build time.
  envPrefix: ["VITE_", "TAURI_ENV_*"],

  build: {
    // Tauri expects a fixed output path; Vite defaults to "dist".
    outDir: "dist",
    // Tauri CLI sets TAURI_ENV_PLATFORM; use sensible browser targets.
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome110" : "safari16",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },

  // livekit-client ships a pre-built E2EE web-worker bundle; tell Vite not
  // to re-bundle it so the worker URL stays intact.
  optimizeDeps: {
    exclude: ["livekit-client"],
  },
});
