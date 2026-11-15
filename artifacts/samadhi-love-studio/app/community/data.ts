export const reactions = { like: "👍 Like", love: "❤️ Love", inspired: "✨ Inspired" } as const;
export type Reaction = keyof typeof reactions;
export type ReactionCounts = Record<Reaction, number>;
export const discoveryCategories = ["Most Loved", "Trending Songs", "New Releases", "Hidden Gems", "Inspirational Music"] as const;
export type DiscoveryCategory = typeof discoveryCategories[number];
export const minListenMs = 10_000;
export const reportReasons = ["Explicit or inappropriate content", "Hateful or harassing content", "Spam or misleading content", "Other community concern"] as const;

export type ReleaseStats = { listens: number; reactions: ReactionCounts; shares: number };
export type Release = {
  id: string; title: string; artist: { id: string; name: string }; releasedAt: number;
  inspirational: boolean; comments: boolean; tags: string[]; art: number; instruments?:string; cover?:string; stats: ReleaseStats;
};
export type Artist = { id: string; name: string; bio: string; listens: number; followers: number; releases: Release[] };
export type PublicComment = { id: string; body: string; createdAt: number };
export type CommunityData = {
  releases: Release[];
  catalog?: { releases: Release[]; total: number; page: number; pages: number; search: string };
  artists?: { id: string; name: string; songs: number; listens: number; likes: number; art: number;followers?:number;coverRelease?:string|null }[];
  sections: Record<DiscoveryCategory, string[]>;
  featured: Release | null;
  artist: Artist | null;
  comments: PublicComment[];
  myComment: { body: string; status: "pending" | "approved" | "hidden" } | null;
  canEngage: boolean;
  reactionBySong: Record<string, Reaction>;
  saved: string[];
  following: string[];
  playlists: { id: string; name: string; songs: string[] }[];
  own: string[];
};
export type ArtistDashboard = {
  profile: { id: string; name: string; bio: string } | null;
  followers: number;
  songs: { songId: string; title: string; available: boolean; releaseId?: string;
    status: "Private" | "Published" | "Unlisted" | "Review required" | "Hidden by moderator";
    inspirational?: boolean; comments?: boolean; stats?: ReleaseStats }[];
};
export type ModerationData = {
  hidden: { id: string; title: string }[];
  comments: { id: string; release: string; title: string; body: string; status: "pending" | "approved" | "hidden" }[];
  reports: { id: string; release: string; title: string; reason: string; comment: string; commentBody: string | null; blocked: boolean }[];
};
export const communityApi = "/api/community";
export const songHref = (id: string) => "/community?song=" + encodeURIComponent(id);
export const artistHref = (id: string) => "/community?artist=" + encodeURIComponent(id);

export const artistDashboardHref = (songId: string) => "/community/artist-dashboard?recording=" + encodeURIComponent(songId);
