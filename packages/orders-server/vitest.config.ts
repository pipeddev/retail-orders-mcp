import { defineConfig } from "vitest/config";

// Carga DATABASE_URL antes de que arranquen los workers (requiere Node 20.12+)
process.loadEnvFile("../../.env");

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false, // todos los tests comparten la misma base
  },
});
