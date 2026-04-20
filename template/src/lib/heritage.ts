/**
 * Heritage — OPTIONAL, for brands with significant archive/timeline content.
 * Populate for Ralph Lauren, Hermès, Rolex, Patek Philippe, Levi's, etc.
 *
 * If used, wire into the MCP endpoint as a `get_heritage(yearFrom?, yearTo?)` tool
 * and optionally into a /heritage inner page.
 */

export interface Milestone {
  year: number;
  title: string;
  detail: string;
  image?: string;
}

export const heritage: Milestone[] = [];
