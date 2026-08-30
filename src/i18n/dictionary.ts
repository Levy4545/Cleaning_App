import { en, type Messages } from "./en";
import { hu } from "./hu";
import { ro } from "./ro";
import type { Locale } from "./locales";

export type { Messages };
export type MessageKey = DotPaths<Messages>;

type DotPaths<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : {
      [K in keyof T & string]: DotPaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

const dictionaries: Record<Locale, Messages> = { en, ro, hu };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? en;
}

export type TranslateVars = Record<string, string | number>;

export function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

export function lookup(messages: Messages, key: MessageKey): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}

export function createTranslator(locale: Locale) {
  const messages = getDictionary(locale);
  const t = (key: MessageKey, vars?: TranslateVars) => interpolate(lookup(messages, key), vars);
  return { locale, messages, t };
}

export type Translator = ReturnType<typeof createTranslator>;
