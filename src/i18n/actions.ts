"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE, parseLocale } from "@/i18n/locales";

export async function setLocaleCookie(locale: string) {
  const resolved = parseLocale(locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
