import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

import { readRawDatabaseUrl, resolveDatabaseUrl } from "./src/db/connection-url";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = readRawDatabaseUrl()
  ? resolveDatabaseUrl()
  : "postgresql://postgres:postgres@localhost:5432/cleaning_app";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
});
