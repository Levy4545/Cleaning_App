/**
 * Promote a user to ADMIN by email.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/promote-admin.ts you@example.com
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import dotenv from "dotenv";

import { users } from "../src/db/schema";
import { resolveDatabaseUrl } from "../src/db/connection-url";
import { createSqlClient } from "../src/db/sql";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: tsx scripts/promote-admin.ts <email>");
  }

  const url = resolveDatabaseUrl();
  const client = createSqlClient(url, { max: 1 });
  const db = drizzle(client);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    await client.end();
    throw new Error(`No user with email ${email}. Register/login first, then re-run.`);
  }

  await db
    .update(users)
    .set({ role: "ADMIN", updatedAt: new Date() })
    .where(eq(users.id, user.id));

  console.log(`Promoted ${email} to ADMIN`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
