// Creates an Agent API key and prints it ONCE. Only its hash is stored.
// Usage: npm run api-key -- "My agent name"

import { createHash, randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

async function main() {
  const name = (process.argv[2] ?? "Demo agent").slice(0, 60);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL in .env.local");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const key = `lumen_sk_${randomBytes(32).toString("base64url")}`;
  await db.apiKey.create({
    data: { name, keyHash: createHash("sha256").update(key).digest("hex"), prefix: key.slice(0, 14) },
  });
  console.log(`\nAPI key for "${name}" (shown once, store it safely):\n\n  ${key}\n`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
