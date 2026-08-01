import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function findProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function createProfile(userId: string) {
  const [row] = await db
    .insert(profiles)
    .values({
      userId,
    })
    .returning();
  return row ?? null;
}

export async function ensureProfile(userId: string) {
  const existing = await findProfileByUserId(userId);
  if (existing) {
    return existing;
  }

  const created = await createProfile(userId);
  if (created) {
    return created;
  }

  // Race: another request may have inserted concurrently.
  return findProfileByUserId(userId);
}
