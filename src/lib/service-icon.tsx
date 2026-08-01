import { createElement } from "react";
import { Armchair, Car, Layers, type LucideProps, Sofa, Sparkles } from "lucide-react";

type ServiceIconProps = LucideProps & {
  itemType?: string | null;
  serviceName?: string | null;
};

/**
 * Resolves the icon for a service based on its item type or name.
 *
 * @param itemType - The service item type used for exact icon selection
 * @param serviceName - The service name used for keyword-based icon selection
 * @returns The icon component matching the service, or `Sparkles` when no match is found
 */
function resolveIcon(itemType?: string | null, serviceName?: string | null) {
  if (itemType === "CAR") return Car;
  if (itemType === "CARPET") return Layers;
  if (itemType === "CHAIR") return Armchair;
  if (itemType === "COUCH") return Sofa;
  if (itemType === "OTHER") return Sparkles;

  const name = serviceName?.toLowerCase() ?? "";
  if (name.includes("car") || name.includes("vehicle")) return Car;
  if (name.includes("carpet") || name.includes("rug")) return Layers;
  if (name.includes("couch") || name.includes("sofa")) return Sofa;
  if (name.includes("chair")) return Armchair;

  return Sparkles;
}

/**
 * Renders an icon for the specified service.
 *
 * @returns The resolved service icon element.
 */
export function ServiceIcon({ itemType, serviceName, ...props }: ServiceIconProps) {
  return createElement(resolveIcon(itemType, serviceName), props);
}

/** @deprecated Prefer `<ServiceIcon />`. Resolves the icon component for the specified item type or service name. */
export function serviceIcon(itemType?: string | null, serviceName?: string | null) {
  return resolveIcon(itemType, serviceName);
}
