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
  await db.insert(profiles).values({
    userId,
  });
}

export async function ensureProfile(userId: string) {
  const profile = await findProfileByUserId(userId);

  if (!profile) {
    await createProfile(userId);
  }

  return profile;
}