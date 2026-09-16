import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.js"],

    // Every test file runs against the same database as the same seeded user.
    // `nextExpenseDate()` spaces files out by date, but user-global figures
    // like `totalExtraSave` are not separable that way, so files running
    // concurrently read each other's writes and fail intermittently. Slower
    // (~22s against ~4s) and deterministic beats fast and flaky.
    fileParallelism: false,
  },
});