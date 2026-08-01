import { ArrowRight, CalendarCheck, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/layout/header";
import { LogoMark } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listActiveServices } from "@/db/queries/services";
import { serviceIcon } from "@/lib/service-icon";

type ServiceCard = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  durationMinutes: number;
};

const fallbackServices: ServiceCard[] = [
  {
    id: "car",
    name: "Car Interior Cleaning",
    description: "Seats, carpets and trim restored.",
    basePrice: "80.00",
    durationMinutes: 90,
  },
  {
    id: "carpet",
    name: "Carpet Cleaning",
    description: "Deep extraction that lifts stains.",
    basePrice: "60.00",
    durationMinutes: 60,
  },
  {
    id: "couch",
    name: "Couch Cleaning",
    description: "Upholstery refreshed and deodorised.",
    basePrice: "70.00",
    durationMinutes: 75,
  },
  {
    id: "chair",
    name: "Chair Cleaning",
    description: "Quick revival for tired seating.",
    basePrice: "25.00",
    durationMinutes: 30,
  },
];

/** Marketing content changes rarely; re-fetch the catalog hourly. */
export const revalidate = 3600;

const steps = [
  {
    icon: Sparkles,
    title: "Choose a service",
    body: "Pick what needs attention and tell us the item, size and condition.",
  },
  {
    icon: CalendarCheck,
    title: "Book in minutes",
    body: "Select an open window. We confirm on-site or drop-off when we approve.",
  },
  {
    icon: ShieldCheck,
    title: "We clean, you relax",
    body: "Track the status end to end and pay cash once the job is done.",
  },
];

async function loadServices(): Promise<ServiceCard[]> {
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
      basePrice: service.basePrice,
      durationMinutes: service.durationMinutes,
    }));
  } catch {
    // The marketing page must render even when the database is unreachable.
    return fallbackServices;
  }
}

export default async function HomePage() {
  const services = await loadServices();

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gold/10 blur-[120px]"
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs tracking-wide text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Car · Carpet · Couch · Chair
            </span>

            <h1 className="mx-auto mt-8 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              <span className="block text-bone">Pristine results.</span>
              <span className="text-gold-gradient block">Premium experience.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-ash">
              Professional deep cleaning that restores freshness and extends the life of what you
              love.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/register" size="lg">
                Book a cleaning
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#services" size="lg" variant="outline">
                See services
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Services"
            title="Care for every surface"
            body="Flat pricing per item. Choose on-site or drop-off where the service allows."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service) => {
              const Icon = serviceIcon(null, service.name);

              return (
                <article
                  key={service.id}
                  className="edge-gold group relative overflow-hidden rounded-xl border border-line bg-panel p-6 transition-colors hover:border-gold/35"
                >
                  <Icon className="h-7 w-7 text-gold" strokeWidth={1.25} />
                  <h3 className="mt-5 font-display text-xl text-bone">{service.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-ash">
                    {service.description ?? "Professional deep clean by trained specialists."}
                  </p>
                  <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                      <Clock className="h-3.5 w-3.5" />
                      {service.durationMinutes} min
                    </span>
                    <span className="font-display text-lg text-gold">
                      From ${service.basePrice}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHeading
              eyebrow="How it works"
              title="Three steps, no phone tag"
              body="Request a window online and we confirm it. No deposits, no back and forth."
            />

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="relative">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 font-display text-lg text-gold">
                      {index + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent md:block"
                    />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-bone">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="Transparent, per item"
            body="Cash on completion. The price you see is the price you pay."
          />

          <div className="mt-10 overflow-hidden rounded-xl border border-line bg-panel">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${
                  index > 0 ? "border-t border-line" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-bone">{service.name}</p>
                  <p className="text-xs text-faint">{service.durationMinutes} minutes</p>
                </div>
                <p className="font-display text-lg text-gold">${service.basePrice}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <ButtonLink href="/register" size="lg">
              Create an account
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <span className="inline-flex items-center gap-2.5">
            <LogoMark className="h-5 w-5" />
            <span className="font-display tracking-[0.16em] text-ash">MASTER-GOLD</span>
          </span>
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} Master-Gold Cleaning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-bone sm:text-4xl">{title}</h2>
      <p className="mt-3 text-ash">{body}</p>
    </div>
  );
}
