import { createElement } from "react";
import { Armchair, Car, Layers, type LucideProps, Sofa, Sparkles } from "lucide-react";

type ServiceIconProps = LucideProps & {
  itemType?: string | null;
  serviceName?: string | null;
};

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

/** Stable service icon element (avoids dynamic component types in render). */
export function ServiceIcon({ itemType, serviceName, ...props }: ServiceIconProps) {
  return createElement(resolveIcon(itemType, serviceName), props);
}

/** @deprecated Prefer `<ServiceIcon />`. */
export function serviceIcon(itemType?: string | null, serviceName?: string | null) {
  return resolveIcon(itemType, serviceName);
}
