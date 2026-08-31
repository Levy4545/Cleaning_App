/**
 * Apply Drizzle migrations and ensure the default shop exists.
 *
 * Runs automatically on Vercel (`VERCEL=1`) during `npm run build`.
 * Locally: `npm run db:prepare` or `PREPARE_DB=true npm run build`.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import dotenv from "dotenv";
import path from "node:path";

import { bootstrapCatalog } from "../src/db/bootstrap";
import {
  explainDatabaseError,
  isTransactionPoolerUrl,
  resolveDatabaseUrl,
} from "../src/db/connection-url";
import { createSqlClient } from "../src/db/sql";

dotenv.config({ path: ".env.local" });
dotenv.config();

function shouldPrepare() {
  if (process.env.SKIP_DB_PREPARE === "true") return false;
  if (process.env.PREPARE_DB === "true") return true;
  return process.env.VERCEL === "1";
}

async function main() {
  if (!shouldPrepare()) {
    console.log("Skipping database prepare (set PREPARE_DB=true to run migrations during build).");
    return;
  }

  let url: string;
  try {
    url =     resolveDatabaseUrl();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    if (process.env.VERCEL === "1" && process.env.REQUIRE_DB_PREPARE !== "true") {
      console.error("Continuing Vercel build without migrations.");
      return;
    }
    process.exit(1);
  }

  if (url.includes("db.") && url.includes("supabase.co") && !isTransactionPoolerUrl(url)) {
    console.warn(
      "DATABASE_URL looks like a direct Supabase host (db.<ref>.supabase.co). " +
        "On Vercel, Connect → Transaction pooler (port 6543) is more reliable.",
    );
  }

  const client = createSqlClient(url, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
    });
    console.log("Migrations applied.");
    await bootstrapCatalog(db);
    console.log("Catalog bootstrap complete.");
  } catch (error) {
    console.error(explainDatabaseError(error));
    console.error(error);
    // Vercel build machines must still compile Next.js even if Postgres is
    // unreachable (wrong password, IPv6-only host, pooler timeout).
    if (process.env.VERCEL === "1" && process.env.REQUIRE_DB_PREPARE !== "true") {
      console.error(
        "Continuing Vercel build without migrations. Fix DATABASE_URL (Connect → Transaction pooler, database password) and redeploy.",
      );
      return;
    }
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
