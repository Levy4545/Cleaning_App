import { eq } from "drizzle-orm";

import { db } from "@/db";
import { DEFAULT_SHOP_ID, DEFAULT_SHOP_SLUG, shops, type Shop } from "@/db/schema";

/**
 * Single-shop MVP: always resolve the default tenant.
 * Marketplace later: replace with host/subdomain resolution (see docs/uml-marketplace).
 */
export async function getDefaultShop(): Promise<Shop> {
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, DEFAULT_SHOP_ID))
    .limit(1);

  if (shop) {
    return shop;
  }

  const [bySlug] = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, DEFAULT_SHOP_SLUG))
    .limit(1);

  if (bySlug) {
    return bySlug;
  }

  throw new Error(
    `Default shop not found. Run migrations/seed so shop ${DEFAULT_SHOP_ID} exists.`,
  );
}

export async function getDefaultShopId(): Promise<string> {
  const shop = await getDefaultShop();
  return shop.id;
}

/**
 * Marketplace scaffold: today ignores host and returns the default shop.
 * Later: parse `{slug}.cleaning.com` and look up shops.subdomain.
 */
export async function resolveShopFromHost(_host: string | null): Promise<Shop> {
  void _host;
  return getDefaultShop();
}
