/** Reserved subdomains for future marketplace routing. */
export const RESERVED_SHOP_SLUGS = [
  "www",
  "app",
  "admin",
  "api",
  "mail",
  "status",
  "default",
] as const;

export function isReservedShopSlug(slug: string): boolean {
  return (RESERVED_SHOP_SLUGS as readonly string[]).includes(slug.toLowerCase());
}
