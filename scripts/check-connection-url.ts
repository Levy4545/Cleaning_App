import {
  isLocalDatabaseHost,
  isTransactionPoolerUrl,
  normalizeDatabaseUrl,
  postgresClientOptions,
  readRawDatabaseUrl,
  resolveDatabaseUrl,
} from "../src/db/connection-url";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  normalizeDatabaseUrl("postgresql://postgres:p@ss@db.example.com:5432/postgres").includes("p%40ss"),
  "encodes @ in password",
);

assert(
  !normalizeDatabaseUrl("postgresql://u:secret@localhost:5432/cleaning_app").includes("sslmode"),
  "leaves local URL without sslmode",
);

assert(
  new URL(normalizeDatabaseUrl("postgresql://u:secret@db.example.com:5432/app")).searchParams.get(
    "sslmode",
  ) === "require",
  "adds sslmode=require for remote hosts",
);

assert(postgresClientOptions("postgresql://u:p@localhost:5432/db").ssl === undefined, "no ssl locally");
assert(
  postgresClientOptions("postgresql://u:p@db.example.com:5432/db").ssl === "require",
  "ssl require remotely",
);
assert(postgresClientOptions("postgresql://u:p@localhost:5432/db").prepare === false, "prepare off");
assert(isLocalDatabaseHost("localhost"), "localhost");
assert(
  isTransactionPoolerUrl("postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres"),
  "pooler",
);

const prev = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
process.env.POSTGRES_URL = "postgresql://alias:x@localhost:5432/db";
assert(readRawDatabaseUrl()?.startsWith("postgresql://alias"), "POSTGRES_URL alias");
assert(resolveDatabaseUrl().includes("alias"), "resolve alias");
if (prev) process.env.DATABASE_URL = prev;
else delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

console.log("connection-url checks passed");
