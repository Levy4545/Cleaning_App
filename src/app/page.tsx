import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listActiveServices } from "@/db/queries/services";
import { HomeView, type HomeServiceCard } from "@/components/home/home-view";

const fallbackServices: HomeServiceCard[] = [
  {
    id: "car",
    name: "Car Interior Cleaning",
    description: "Seats, carpets and trim restored.",
    priceMin: "300.00",
    priceMax: "500.00",
    durationMinutes: 90,
  },
  {
    id: "carpet",
    name: "Carpet Cleaning",
    description: "Deep extraction that lifts stains.",
    priceMin: "200.00",
    priceMax: "400.00",
    durationMinutes: 60,
  },
  {
    id: "couch",
    name: "Couch Cleaning",
    description: "Upholstery refreshed and deodorised.",
    priceMin: "250.00",
    priceMax: "450.00",
    durationMinutes: 75,
  },
  {
    id: "chair",
    name: "Chair Cleaning",
    description: "Quick revival for tired seating.",
    priceMin: "80.00",
    priceMax: "150.00",
    durationMinutes: 30,
  },
];

export const revalidate = 3600;

async function loadServices(): Promise<HomeServiceCard[]> {
  try {
    const shopId = await getDefaultShopId();
    const services = await listActiveServices(shopId);
    if (services.length === 0) {
      return fallbackServices;
    }
    return services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      durationMinutes: service.durationMinutes,
      requiresTimeWindow: service.requiresTimeWindow,
    }));
  } catch {
    return fallbackServices;
  }
}

export default async function HomePage() {
  const services = await loadServices();
  return <HomeView services={services} />;
}
