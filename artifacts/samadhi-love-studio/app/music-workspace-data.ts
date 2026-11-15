import type { Instrumental } from "./creation-guide";
import type { SectionDirection } from "./song-section-directions";

export type Discovery = {
  favorites: string[];
  collections: { id: string; name: string; entries: string[] }[];
  prompts: { id: string; title: string; text: string; favorite: boolean }[];
};
export const emptyDiscovery: Discovery = { favorites: [], collections: [], prompts: [] };
export type CreateSeed = { projectId?: string; title?: string; genres?: string[]; idea: string; vocal?: string; bpm?: string; lyrics?: string; seconds?: number; instrumental?: boolean; sectionDirections?: SectionDirection[]; instrumentSettings?: Instrumental };

export function isDiscovery(value: unknown): value is Discovery {
  if (!value || typeof value !== "object") return false;
  const data = value as Discovery;
  const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
  const ids = (value: unknown) => Array.isArray(value) && value.length <= 300 && value.every(item => text(item, 80));
  return ids(data.favorites) &&
    Array.isArray(data.collections) && data.collections.length <= 30 &&
    data.collections.every(item => item && text(item.id, 80) && text(item.name, 60) && ids(item.entries)) &&
    Array.isArray(data.prompts) && data.prompts.length <= 60 &&
    data.prompts.every(item => item && text(item.id, 80) && text(item.title, 100) && text(item.text, 1000) && typeof item.favorite === "boolean");
}
