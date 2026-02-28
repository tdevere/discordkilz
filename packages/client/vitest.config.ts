/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    /** jsdom gives us a realistic browser-like DOM without a real browser. */
    environment: "jsdom",
    /** Load global mocks / matchers before every test file. */
    setupFiles: ["./src/__tests__/setup.ts"],
    /** Expose `describe`, `it`, `expect`, `vi` etc. globally (no imports needed). */
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
    },
  },
});
