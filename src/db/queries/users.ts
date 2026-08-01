import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { users, type UserRole } from "@/db/schema";

/**
 * Normalizes an email address for consistent storage and comparison.
 *
 * @param email - The email address to normalize
 * @returns The trimmed, lowercase email address
 */
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Finds a user by ID.
 *
 * @param id - The user's unique identifier
 * @returns The matching user, or `null` if no user is found
 */
export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/**
 * Finds a user by email address using a case-insensitive comparison.
 *
 * @param email - The email address to search for.
 * @returns The matching user, or `null` if no user is found.
 */
export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);
  return user ?? null;
}

export async function listUsersByRole(role: UserRole) {
  return db.select().from(users).where(eq(users.role, role));
}

/**
 * Creates a user with a normalized email address and a default `"USER"` role when none is provided.
 *
 * @param data - The user's identifying, contact, and optional role information
 */
export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: UserRole;
}) {
  await db.insert(users).values({
    id: data.id,
    email: normalizeEmail(data.email),
    name: data.name,
    phone: data.phone,
    role: data.role ?? "USER",
  });
}

/**
 * Updates the editable fields of a user and records the modification time.
 *
 * @param id - The user's unique identifier
 * @param data - The fields to update; supplied email addresses are trimmed and lowercased
 */
export async function updateUser(
  id: string,
  data: {
    email?: string;
    name?: string;
    phone?: string;
  },
) {
  await db
    .update(users)
    .set({
      ...data,
      email: data.email !== undefined ? normalizeEmail(data.email) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function updateUserRole(id: string, role: UserRole) {
  await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

/**
 * Updates selected user fields for users matching an email address.
 *
 * @param email - The email address used to identify the users to update
 * @param data - The user fields to update
 */
export async function updateUserByEmail(
  email: string,
  data: {
    id?: string;
    name?: string;
    phone?: string;
  },
) {
  const normalized = normalizeEmail(email);
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(sql`lower(${users.email}) = ${normalized}`);
}
