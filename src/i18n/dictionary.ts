import { en } from "./en";
import { hu } from "./hu";
import { ro } from "./ro";
import type { Locale } from "./locales";
import { makeTranslator, type Messages } from "./translator";

export type { Messages, MessageKey, TranslateVars, Translator } from "./translator";
export { interpolate, lookup, makeTranslator } from "./translator";

const dictionaries: Record<Locale, Messages> = { en, ro, hu };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? en;
}

/** Server-side convenience: resolves the dictionary for a locale and builds a translator. */
export function createTranslator(locale: Locale) {
  return makeTranslator(locale, getDictionary(locale));
}
