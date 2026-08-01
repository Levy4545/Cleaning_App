import { Armchair, Car, Layers, type LucideIcon, Sofa, Sparkles } from "lucide-react";

const byItemType: Record<string, LucideIcon> = {
  CAR: Car,
  CARPET: Layers,
  CHAIR: Armchair,
  COUCH: Sofa,
  OTHER: Sparkles,
};

/** Picks an icon from the item type, falling back to keywords in the service name. */
export function serviceIcon(itemType?: string | null, serviceName?: string | null): LucideIcon {
  if (itemType && byItemType[itemType]) {
    return byItemType[itemType];
  }

  const name = serviceName?.toLowerCase() ?? "";
  if (name.includes("car") || name.includes("vehicle")) return Car;
  if (name.includes("carpet") || name.includes("rug")) return Layers;
  if (name.includes("couch") || name.includes("sofa")) return Sofa;
  if (name.includes("chair")) return Armchair;

  return Sparkles;
}
