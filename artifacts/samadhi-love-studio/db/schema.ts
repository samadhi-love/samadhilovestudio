import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const studios = sqliteTable("studios", {
  owner: text("owner").primaryKey(),
  content: text("content").notNull(),
  revision: integer("revision").notNull(),
});

export const listenerStation = sqliteTable("listener_station", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  trackIds: text("track_ids").notNull(),
});

export const creatorAccounts = sqliteTable("creator_accounts", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
  suspended: integer("suspended", { mode: "boolean" }).notNull().default(false),
  limit: integer("daily_limit").notNull().default(3),
  usageDay: text("usage_day").notNull().default(""),
  attempts: integer("attempts").notNull().default(0),
});

export const communityArtists = sqliteTable("community_artists", {
  owner: text("owner").primaryKey(),
  id: text("id").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
});

export const communityReleases = sqliteTable("community_releases", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull().references(() => communityArtists.owner),
  songId: text("song_id").notNull(),
  recording: text("recording").notNull(),
  releasedAt: integer("released_at").notNull(),
  listed: integer("listed", { mode: "boolean" }).notNull().default(true),
  blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
  inspirational: integer("inspirational", { mode: "boolean" }).notNull().default(false),
  comments: integer("comments", { mode: "boolean" }).notNull().default(false),
}, table => [
  uniqueIndex("community_release_owner_song").on(table.owner, table.songId),
  index("community_release_discovery").on(table.listed, table.blocked, table.releasedAt),
]);

export const communityMarks = sqliteTable("community_marks", {
  viewer: text("viewer").notNull(),
  target: text("target").notNull(),
  kind: text("kind", { enum: ["reaction", "save", "follow"] }).notNull(),
  value: text("value").notNull(),
  createdAt: integer("created_at").notNull(),
}, table => [
  primaryKey({ columns: [table.viewer, table.target, table.kind] }),
  index("community_marks_counts").on(table.target, table.kind, table.value),
]);

export const communityPlaylists = sqliteTable("community_playlists", {
  id: text("id").primaryKey(),
  viewer: text("viewer").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
}, table => [index("community_playlist_viewer").on(table.viewer, table.createdAt)]);

export const communityPlaylistSongs = sqliteTable("community_playlist_songs", {
  playlist: text("playlist").notNull().references(() => communityPlaylists.id, { onDelete: "cascade" }),
  release: text("release").notNull().references(() => communityReleases.id),
  addedAt: integer("added_at").notNull(),
}, table => [primaryKey({ columns: [table.playlist, table.release] })]);

export const communityShares = sqliteTable("community_shares", {
  id: text("id").primaryKey(),
  release: text("release").notNull().references(() => communityReleases.id),
  sender: text("sender").notNull(),
}, table => [uniqueIndex("community_share_sender").on(table.release, table.sender)]);

export const communityPlayback = sqliteTable("community_playback", {
  viewer: text("viewer").primaryKey(),
  token: text("token").notNull(),
  release: text("release").notNull().references(() => communityReleases.id),
  recording: text("recording").notNull(),
  startedAt: integer("started_at").notNull(),
  servedAt: integer("served_at"),
  share: text("share"),
});

export const communityListens = sqliteTable("community_listens", {
  release: text("release").notNull().references(() => communityReleases.id),
  viewer: text("viewer").notNull(),
  day: integer("day").notNull(),
  shared: integer("shared", { mode: "boolean" }).notNull().default(false),
}, table => [
  primaryKey({ columns: [table.release, table.viewer, table.day] }),
  index("community_listen_recent").on(table.release, table.day),
]);

export const communityComments = sqliteTable("community_comments", {
  id: text("id").primaryKey(),
  release: text("release").notNull().references(() => communityReleases.id),
  viewer: text("viewer").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["pending", "approved", "hidden"] }).notNull().default("pending"),
  createdAt: integer("created_at").notNull(),
}, table => [
  uniqueIndex("community_comment_listener").on(table.release, table.viewer),
  index("community_comment_review").on(table.status, table.createdAt),
  index("community_comment_viewer").on(table.viewer, table.createdAt),
]);

export const communityReports = sqliteTable("community_reports", {
  id: text("id").primaryKey(),
  release: text("release").notNull().references(() => communityReleases.id),
  viewer: text("viewer").notNull(),
  comment: text("comment").notNull().default(""),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull(),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
}, table => [
  uniqueIndex("community_report_listener").on(table.release, table.viewer, table.comment),
  index("community_report_review").on(table.closed, table.createdAt),
  index("community_report_viewer").on(table.viewer, table.createdAt),
]);

export const partyLibrary = sqliteTable("party_library", {
  id: text("id").primaryKey(), content: text("content").notNull(), active: integer("active").notNull().default(1),
});
export const partySets = sqliteTable("party_sets", {
  id: text("id").primaryKey(), owner: text("owner").notNull(), content: text("content").notNull(),
  revision: integer("revision").notNull(), published: integer("published").notNull().default(0),
  featured: integer("featured").notNull().default(0), updated: integer("updated").notNull(),
}, table => [index("party_owner").on(table.owner), index("party_feed").on(table.published, table.updated)]);
export const partyLikes = sqliteTable("party_likes", {
  party: text("party").notNull(), viewer: text("viewer").notNull(),
}, table => [primaryKey({ columns: [table.party, table.viewer] })]);
export const partyComments = sqliteTable("party_comments", {
  id: text("id").primaryKey(), party: text("party").notNull(), viewer: text("viewer").notNull(),
  body: text("body").notNull(), approved: integer("approved").notNull().default(0), created: integer("created").notNull(),
}, table => [index("party_comment_feed").on(table.party, table.approved)]);

// Separate from Studio content: clients cannot edit balances through project saves.
export const creditAccounts = sqliteTable("credit_accounts", {
  owner: text("owner").primaryKey(),
  plan: text("plan").notNull().default("free"),
  funding: text("funding").notNull().default("own"),
  status: text("status").notNull().default("free"),
  balance: integer("balance").notNull().default(0),
  periodStart: integer("period_start").notNull().default(0),
  periodEnd: integer("period_end").notNull().default(0),
  lastChange: text("last_change").notNull().default(""),
});
export const productionJobs = sqliteTable("production_jobs", {
  id: text("id").primaryKey(), owner: text("owner").notNull(), operation: text("operation").notNull(),
  funding: text("funding").notNull(), credits: integer("credits").notNull(), seconds: integer("seconds").notNull(),
  status: text("status").notNull(), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
  periodEnd: integer("period_end").notNull(),
}, table => [index("production_owner_status").on(table.owner, table.status), index("production_owner_time").on(table.owner, table.createdAt)]);
export const creditLedger = sqliteTable("credit_ledger", {
  id: text("id").primaryKey(), owner: text("owner").notNull(), amount: integer("amount").notNull(),
  kind: text("kind").notNull(), note: text("note").notNull(), createdAt: integer("created_at").notNull(),
}, table => [index("credit_ledger_owner_time").on(table.owner, table.createdAt)]);

export const billingAccounts = sqliteTable("billing_accounts", {
  owner: text("owner").primaryKey(), customer: text("customer").unique(), subscription: text("subscription").unique(),
  status: text("status").notNull().default("none"), selectedPlan: text("selected_plan").notNull().default("free"),
  cancelAtEnd: integer("cancel_at_end").notNull().default(0), periodEnd: integer("period_end").notNull().default(0),
  blocked: integer("blocked").notNull().default(0), checkout: text("checkout"),
  checkoutLock: text("checkout_lock"), lockAt: integer("lock_at").notNull().default(0),
  noticeVersion: text("notice_version"), noticeAt: integer("notice_at").notNull().default(0),
});
export const billingInvoices = sqliteTable("billing_invoices", {
  invoice: text("invoice").primaryKey(), owner: text("owner").notNull(), plan: text("plan").notNull(),
  periodStart: integer("period_start").notNull(), periodEnd: integer("period_end").notNull(),
  amount: integer("amount").notNull(), currency: text("currency").notNull(), credits: integer("credits").notNull(),
  createdAt: integer("created_at").notNull(),
}, table => [index("billing_invoice_owner_time").on(table.owner, table.createdAt)]);

// Small durable cleanup jobs become tombstones after media removal; no lyrics/audio retained here.
export const songDeletionJobs = sqliteTable("song_deletion_jobs",{
 owner:text("owner").notNull(),songId:text("song_id").notNull(),audioIds:text("audio_ids").notNull(),state:text("state").notNull().default("queued"),createdAt:integer("created_at").notNull(),updatedAt:integer("updated_at").notNull(),
},table=>[primaryKey({columns:[table.owner,table.songId]}),index("song_deletion_pending").on(table.state,table.updatedAt)]);
