/**
 * Converts a display name into a URL-safe slug.
 *
 * @param value - The human-readable name to slugify
 * @returns A lowercase hyphenated slug, or `"item"` when the input has no usable characters
 */
export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}
