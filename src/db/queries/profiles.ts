import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";

/**
 * Finds a profile associated with a user.
 *
 * @param userId - The identifier of the user whose profile to find
 * @returns The matching profile, or `null` if no profile exists
 */
export async function findProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

/**
 * Creates a profile for a user.
 *
 * @param userId - The ID of the user associated with the profile
 * @returns The created profile, or `null` if no profile is returned
 */
export async function createProfile(userId: string) {
  const [row] = await db
    .insert(profiles)
    .values({
      userId,
    })
    .returning();
  return row ?? null;
}

/**
 * Retrieves the user's profile, creating one when it does not already exist.
 *
 * @param userId - The ID of the user whose profile should be ensured
 * @returns The existing, newly created, or concurrently inserted profile, or `null` if no profile is found
 */
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
