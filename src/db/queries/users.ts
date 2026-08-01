import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { users, type UserRole } from "@/db/schema";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

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
