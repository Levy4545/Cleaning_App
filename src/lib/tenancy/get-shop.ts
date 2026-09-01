import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { db } from "@/db";
import { DEFAULT_SHOP_ID, DEFAULT_SHOP_SLUG, shops, type Shop } from "@/db/schema";

/**
 * Single-shop MVP: always resolve the default tenant.
 * Marketplace later: replace with host/subdomain resolution (see docs/uml-marketplace).
 */
async function loadDefaultShop(): Promise<Shop> {
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

  try {
    const [created] = await db
      .insert(shops)
      .values({
        id: DEFAULT_SHOP_ID,
        name: "Cleaning App",
        slug: DEFAULT_SHOP_SLUG,
        subdomain: DEFAULT_SHOP_SLUG,
        status: "ACTIVE",
        themeConfig: { primaryColor: "#c9a227", layout: "classic" },
      })
      .returning();
    if (created) return created;
  } catch {
    const [retry] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, DEFAULT_SHOP_ID))
      .limit(1);
    if (retry) return retry;
  }

  throw new Error(
    `Default shop not found. Run migrations/seed so shop ${DEFAULT_SHOP_ID} exists.`,
  );
}

export async function getDefaultShop(): Promise<Shop> {
  return loadDefaultShop();
}

const loadDefaultShopId = unstable_cache(
  async () => {
    const shop = await loadDefaultShop();
    return shop.id;
  },
  ["default-shop-id"],
  { revalidate: 3600, tags: ["shop"] },
);

export const getDefaultShopId = cache(async (): Promise<string> => loadDefaultShopId());

/**
 * Resolves a host to the default shop.
 *
 * @param _host - The host used for shop resolution.
 * @returns The default shop.
 */
export async function resolveShopFromHost(_host: string | null): Promise<Shop> {
  void _host;
  return getDefaultShop();
}
