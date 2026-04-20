/**
 * Flagships — OPTIONAL, for brands with physical retail / boutique / hospitality presence.
 * Populate for luxury houses, heritage fashion, hospitality-adjacent brands.
 *
 * If used, wire into the MCP endpoint as a `find_flagship(city?, country?)` tool.
 */

export interface Flagship {
  name: string;
  address?: string;
  city: string;
  country: string;
  kind?: "boutique" | "flagship" | "restaurant" | "hotel" | "club";
  hours?: string;
  note?: string;
}

export const flagships: Flagship[] = [];
