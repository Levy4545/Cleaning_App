import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  DEFAULT_SHOP_ID,
  DEFAULT_SHOP_SLUG,
  serviceCategories,
  serviceTranslations,
  services,
  shops,
} from "./schema";

const SERVICE_TRANSLATIONS: Record<
  string,
  { ro: { name: string; description: string }; hu: { name: string; description: string } }
> = {
  "Car Interior Cleaning": {
    ro: {
      name: "Curățare interior auto",
      description: "Aspirare și detalii pentru suprafețele interioare",
    },
    hu: {
      name: "Autóbeltér tisztítás",
      description: "Porszívózás és beltéri felületek ápolása",
    },
  },
  "Carpet Cleaning": {
    ro: {
      name: "Curățare covoare",
      description: "Curățare profundă a covoarelor după dimensiune",
    },
    hu: {
      name: "Szőnyegtisztítás",
      description: "Mélytisztítás méret szerint",
    },
  },
  "Couch Cleaning": {
    ro: {
      name: "Curățare canapea",
      description: "Curățare tapițerie pentru canapele",
    },
    hu: {
      name: "Kanapé tisztítás",
      description: "Kárpittisztítás kanapékhoz",
    },
  },
  "Chair Cleaning": {
    ro: {
      name: "Curățare scaun",
      description: "Curățare scaun individual sau de dining",
    },
    hu: {
      name: "Széktisztítás",
      description: "Egyedi vagy étkezőszék tisztítása",
    },
  },
};

type Db = PostgresJsDatabase;

/**
 * Idempotent shop + sample catalog. Safe to run on every production deploy.
 */
export async function bootstrapCatalog(db: Db) {
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
        primaryColor: "#c9a227",
        layout: "classic",
      },
    });
    console.log("Created default shop:", DEFAULT_SHOP_ID);
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
      const inserted = await db
        .insert(services)
        .values([
          {
            shopId: DEFAULT_SHOP_ID,
            categoryId: vehicle.id,
            name: "Car Interior Cleaning",
            description: "Vacuum and detail interior surfaces",
            deliveryModes: ["DROP_OFF", "ON_SITE"],
            itemTypeOptions: ["leather", "fabric"],
            durationMinutes: 90,
            priceMin: "300.00",
            priceMax: "500.00",
            isActive: true,
          },
          {
            shopId: DEFAULT_SHOP_ID,
            categoryId: textile.id,
            name: "Carpet Cleaning",
            description: "Deep clean carpets by size",
            deliveryModes: ["ON_SITE", "DROP_OFF"],
            itemTypeOptions: [],
            durationMinutes: 120,
            priceMin: "200.00",
            priceMax: "400.00",
            isActive: true,
          },
          {
            shopId: DEFAULT_SHOP_ID,
            categoryId: textile.id,
            name: "Couch Cleaning",
            description: "Upholstery cleaning for sofas",
            deliveryModes: ["ON_SITE"],
            itemTypeOptions: ["leather", "fabric"],
            durationMinutes: 90,
            priceMin: "250.00",
            priceMax: "450.00",
            isActive: true,
          },
          {
            shopId: DEFAULT_SHOP_ID,
            categoryId: textile.id,
            name: "Chair Cleaning",
            description: "Single or dining chair cleaning",
            deliveryModes: ["ON_SITE", "DROP_OFF"],
            itemTypeOptions: ["leather", "fabric"],
            durationMinutes: 45,
            priceMin: "80.00",
            priceMax: "150.00",
            isActive: true,
          },
        ])
        .returning();

      for (const service of inserted) {
        await upsertServiceTranslations(db, service.id, service.name);
      }
      console.log("Seeded sample categories and services");
    }
  }

  const existingServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.shopId, DEFAULT_SHOP_ID));

  for (const service of existingServices) {
    await upsertServiceTranslations(db, service.id, service.name);
  }
}

async function upsertServiceTranslations(db: Db, serviceId: string, englishName: string) {
  const copy = SERVICE_TRANSLATIONS[englishName];
  if (!copy) return;

  const existing = await db
    .select({ locale: serviceTranslations.locale })
    .from(serviceTranslations)
    .where(eq(serviceTranslations.serviceId, serviceId));
  const have = new Set(existing.map((row) => row.locale));

  const rows = (["ro", "hu"] as const)
    .filter((locale) => !have.has(locale))
    .map((locale) => ({
      serviceId,
      locale,
      name: copy[locale].name,
      description: copy[locale].description,
    }));

  if (rows.length > 0) {
    await db.insert(serviceTranslations).values(rows);
  }
}
