import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { I18nProvider } from "@/i18n/provider";
import { getCatalogTranslationMap, getRequestLocale } from "@/i18n/server";

import "./globals.css";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, catalog] = await Promise.all([
    getRequestLocale(),
    getCatalogTranslationMap(),
  ]);

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-bone antialiased">
        <I18nProvider initialLocale={locale} catalog={catalog}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
