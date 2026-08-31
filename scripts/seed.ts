/**
 * Seeds the default shop and sample catalog.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import dotenv from "dotenv";

import { bootstrapCatalog } from "../src/db/bootstrap";
import { resolveDatabaseUrl } from "../src/db/connection-url";
import { createSqlClient } from "../src/db/sql";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const url = resolveDatabaseUrl();
  const client = createSqlClient(url, { max: 1 });
  const db = drizzle(client);

  await bootstrapCatalog(db);

  await client.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
