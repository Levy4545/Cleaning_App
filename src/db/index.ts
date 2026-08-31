import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "@/env";
import { createSqlClient } from "./sql";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof createSqlClient> | undefined;
};

const client = globalForDb.client ?? createSqlClient(env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
