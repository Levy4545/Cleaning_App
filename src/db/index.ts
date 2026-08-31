import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "@/env";
import { createSqlClient } from "./sql";

import * as schema from "./schema";

type SqlClient = ReturnType<typeof createSqlClient>;
type AppDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  client: SqlClient | undefined;
  db: AppDb | undefined;
};

function getDb(): AppDb {
  if (!globalForDb.db) {
    const url = env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. On Vercel add the Supabase Connect → Transaction pooler URI (database password, port 6543).",
      );
    }
    globalForDb.client = createSqlClient(url);
    globalForDb.db = drizzle(globalForDb.client, { schema });
  }
  return globalForDb.db;
}

/** Lazy so `next build` can compile when Postgres env is missing or invalid. */
export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb() as object, prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
