import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

// Prisma 7 doesn't read .env files itself; reuse Next's loader so the CLI
// sees exactly the same .env.local as the app.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations run over the direct (non-pooled) connection.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
