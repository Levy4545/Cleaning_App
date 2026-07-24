import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function findUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  role?: "USER" | "ADMIN";
}) {
  await db.insert(users).values({
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role ?? "USER",
  });
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    name?: string;
  },
) {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

export async function updateUserRole(
  id: string,
  role: "USER" | "ADMIN",
) {
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
  },
) {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));
}