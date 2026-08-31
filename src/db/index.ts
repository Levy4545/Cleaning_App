import { drizzle } from "drizzle-orm/postgres-js";

import { resolveDatabaseUrl } from "./connection-url";
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
    globalForDb.client = createSqlClient(resolveDatabaseUrl());
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
