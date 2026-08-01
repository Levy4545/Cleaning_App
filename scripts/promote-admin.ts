/**
 * Promote a user to ADMIN by email.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/promote-admin.ts you@example.com
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { users } from "../src/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: tsx scripts/promote-admin.ts <email>");
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(url, { max: 1 });
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
