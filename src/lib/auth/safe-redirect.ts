/**
 * Validates a redirect target and returns a safe same-origin relative path.
 *
 * @param value - The redirect target to validate
 * @param fallback - The path to return when `value` is missing or unsafe
 * @returns The trimmed relative path if valid; otherwise, `fallback`
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (trimmed.includes("://")) return fallback;

  return trimmed;
}
