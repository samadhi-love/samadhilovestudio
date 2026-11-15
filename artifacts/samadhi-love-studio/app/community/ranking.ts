import type { DiscoveryCategory, Release } from "./data";

export type RankedRelease = Release & { recentListeners: number };
const dayMs = 86_400_000;

function balanced(releases: RankedRelease[], slots = 8) {
  const counts = new Map<string, number>();
  const selected: string[] = [];
  for (const release of releases) {
    const count = counts.get(release.artist.id) ?? 0;
    if (count >= 2) continue;
    counts.set(release.artist.id, count + 1);
    selected.push(release.id);
    if (selected.length === slots) break;
  }
  return selected;
}

function rotation(id: string, day: number) {
  let hash = day;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export function rankDiscovery(releases: RankedRelease[], now: number): Record<DiscoveryCategory, string[]> {
  const day = Math.floor(now / dayMs);
  const newest = [...releases].sort((a, b) => b.releasedAt - a.releasedAt || a.id.localeCompare(b.id));
  const artistAges = new Map<string, number>();
  for (const release of releases) {
    const first = artistAges.get(release.artist.id) ?? release.releasedAt;
    artistAges.set(release.artist.id, Math.min(first, release.releasedAt));
  }
  const newerArtist = (release: RankedRelease) => now - (artistAges.get(release.artist.id) ?? 0) < 30 * dayMs;
  const gems = [...releases].sort((a, b) =>
    Math.floor(a.stats.listens / 10) - Math.floor(b.stats.listens / 10) ||
    Number(newerArtist(b)) - Number(newerArtist(a)) || rotation(a.id, day) - rotation(b.id, day));
  return {
    "Most Loved": balanced(newest.filter(item => item.stats.reactions.love > 0).sort((a, b) => b.stats.reactions.love - a.stats.reactions.love)),
    "Trending Songs": balanced(newest.filter(item => item.recentListeners > 0).sort((a, b) => b.recentListeners - a.recentListeners)),
    "New Releases": balanced(newest),
    "Hidden Gems": balanced(gems),
    "Inspirational Music": balanced(gems.filter(item => item.inspirational)),
  };
}
