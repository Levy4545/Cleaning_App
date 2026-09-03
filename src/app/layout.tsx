import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { I18nProvider } from "@/i18n/provider";
import { getRequestLocale } from "@/i18n/server";
import { readPublicSupabaseConfig } from "@/lib/supabase/env-keys";
import { SupabaseBrowserConfig } from "@/lib/supabase/supabase-browser-config";

import "./globals.css";

/** Run serverless functions next to the EU Supabase project, not iad1. */
export const preferredRegion = "fra1";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Master-Gold Cleaning",
  description: "Book premium car, carpet, couch, and chair cleaning in minutes.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const supabase = readPublicSupabaseConfig();

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-bone antialiased">
        {supabase ? <SupabaseBrowserConfig url={supabase.url} anonKey={supabase.anonKey} /> : null}
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
        {process.env.NODE_ENV === "production" ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
