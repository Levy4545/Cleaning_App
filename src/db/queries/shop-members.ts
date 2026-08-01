import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { shopMembers } from "@/db/schema";

type ShopRole = "OWNER" | "ADMIN" | "CLEANER" | "CUSTOMER";

/**
 * Marketplace scaffold: ensure a membership row exists.
 * Single-shop MVP uses this silently for the default shop.
 */
export async function ensureShopMembership(input: {
  shopId: string;
  userId: string;
  role: ShopRole;
}) {
  const [existing] = await db
    .select()
    .from(shopMembers)
    .where(
      and(eq(shopMembers.shopId, input.shopId), eq(shopMembers.userId, input.userId)),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [row] = await db
    .insert(shopMembers)
    .values({
      shopId: input.shopId,
      userId: input.userId,
      role: input.role,
      status: "ACTIVE",
    })
    .returning();

  return row;
}
