/**
 * Global test setup — runs before every test file.
 *
 * Responsibilities:
 *  - Import @testing-library/jest-dom so custom matchers like
 *    `toBeInTheDocument()` are available in all tests.
 *  - Stub browser APIs that are not provided by jsdom.
 */
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ------------------------------------------------------------------
// Clipboard API — jsdom does not implement navigator.clipboard
// ------------------------------------------------------------------
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
  configurable: true,
});

// ------------------------------------------------------------------
// Worker — VoiceRoom spins up a Web Worker for E2EE; stub it so
// tests don't try to load real worker scripts.
// Using a class so `new Worker(...)` works correctly in jsdom.
// ------------------------------------------------------------------
class MockWorker {
  postMessage = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  terminate = vi.fn();
}
// @ts-expect-error — global Worker override for test env
global.Worker = MockWorker;
