/**
 * Seeds the default shop (marketplace scaffold) and sample catalog data.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  DEFAULT_SHOP_ID,
  DEFAULT_SHOP_SLUG,
  serviceCategories,
  services,
  shops,
} from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  const [existing] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, DEFAULT_SHOP_ID))
    .limit(1);

  if (!existing) {
    await db.insert(shops).values({
      id: DEFAULT_SHOP_ID,
      name: "Cleaning App",
      slug: DEFAULT_SHOP_SLUG,
      subdomain: DEFAULT_SHOP_SLUG,
      status: "ACTIVE",
      themeConfig: {
        primaryColor: "#2563eb",
        layout: "classic",
      },
    });
    console.log("Created default shop:", DEFAULT_SHOP_ID);
  } else {
    console.log("Default shop already exists");
  }

  const categories = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.shopId, DEFAULT_SHOP_ID));

  if (categories.length === 0) {
    const [vehicle] = await db
      .insert(serviceCategories)
      .values({
        shopId: DEFAULT_SHOP_ID,
        name: "Vehicle",
        slug: "vehicle",
      })
      .returning();

    const [textile] = await db
      .insert(serviceCategories)
      .values({
        shopId: DEFAULT_SHOP_ID,
        name: "Textile & Furniture",
        slug: "textile-furniture",
      })
      .returning();

    if (vehicle && textile) {
      await db.insert(services).values([
        {
          shopId: DEFAULT_SHOP_ID,
          categoryId: vehicle.id,
          name: "Car Interior Cleaning",
          description: "Vacuum and detail interior surfaces",
          deliveryModes: ["DROP_OFF", "ON_SITE"],
          durationMinutes: 90,
          basePrice: "80.00",
          isActive: true,
        },
        {
          shopId: DEFAULT_SHOP_ID,
          categoryId: textile.id,
          name: "Carpet Cleaning",
          description: "Deep clean carpets by size",
          deliveryModes: ["ON_SITE", "DROP_OFF"],
          durationMinutes: 120,
          basePrice: "60.00",
          isActive: true,
        },
        {
          shopId: DEFAULT_SHOP_ID,
          categoryId: textile.id,
          name: "Couch Cleaning",
          description: "Upholstery cleaning for sofas",
          deliveryModes: ["ON_SITE"],
          durationMinutes: 90,
          basePrice: "70.00",
          isActive: true,
        },
        {
          shopId: DEFAULT_SHOP_ID,
          categoryId: textile.id,
          name: "Chair Cleaning",
          description: "Single or dining chair cleaning",
          deliveryModes: ["ON_SITE", "DROP_OFF"],
          durationMinutes: 45,
          basePrice: "25.00",
          isActive: true,
        },
      ]);
    }

    console.log("Seeded sample categories and services");
  } else {
    console.log("Catalog already seeded");
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
