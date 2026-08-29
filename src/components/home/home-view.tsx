"use client";

import { ArrowRight, CalendarCheck, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/layout/header";
import { LogoMark } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { formatPriceRange } from "@/i18n/format";
import { translateCatalogDescription, translateCatalogName } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { ServiceIcon } from "@/lib/service-icon";

export type HomeServiceCard = {
  id: string;
  name: string;
  description: string | null;
  priceMin: string;
  priceMax: string;
  durationMinutes: number;
};

export function HomeView({ services }: { services: HomeServiceCard[] }) {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();

  const steps = [
    { icon: Sparkles, title: t("home.step1Title"), body: t("home.step1Body") },
    { icon: CalendarCheck, title: t("home.step2Title"), body: t("home.step2Body") },
    { icon: ShieldCheck, title: t("home.step3Title"), body: t("home.step3Body") },
  ];

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
              {t("home.badge")}
            </span>

            <h1 className="mx-auto mt-8 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              <span className="block text-bone">{t("home.heroTitle1")}</span>
              <span className="text-gold-gradient block">{t("home.heroTitle2")}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-ash">{t("home.heroBody")}</p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/register" size="lg">
                {t("home.bookCta")}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#services" size="lg" variant="outline">
                {t("home.seeServices")}
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow={t("home.servicesEyebrow")}
            title={t("home.servicesTitle")}
            body={t("home.servicesBody")}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service) => (
              <article
                key={service.id}
                className="edge-gold group relative overflow-hidden rounded-xl border border-line bg-panel p-6 transition-colors hover:border-gold/35"
              >
                <ServiceIcon
                  serviceName={service.name}
                  className="h-7 w-7 text-gold"
                  strokeWidth={1.25}
                />
                <h3 className="mt-5 font-display text-xl text-bone">
                  {translateCatalogName(t, service.name)}
                </h3>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-ash">
                  {translateCatalogDescription(t, service.description) ??
                    t("home.defaultDescription")}
                </p>
                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                    <Clock className="h-3.5 w-3.5" />
                    {t("common.minutes", { n: service.durationMinutes })}
                  </span>
                  <span className="font-display text-lg text-gold">
                    {formatPriceRange(service.priceMin, service.priceMax, locale)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHeading
              eyebrow={t("home.howEyebrow")}
              title={t("home.howTitle")}
              body={t("home.howBody")}
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
            eyebrow={t("home.pricingEyebrow")}
            title={t("home.pricingTitle")}
            body={t("home.pricingBody")}
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
                  <p className="truncate text-sm font-medium text-bone">
                    {translateCatalogName(t, service.name)}
                  </p>
                  <p className="text-xs text-faint">
                    {t("common.minutesLong", { n: service.durationMinutes })}
                  </p>
                </div>
                <p className="font-display text-lg text-gold">
                  {formatPriceRange(service.priceMin, service.priceMax, locale)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <ButtonLink href="/register" size="lg">
              {t("home.createAccount")}
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
          <p className="text-xs text-faint">{t("home.copyright", { year })}</p>
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
