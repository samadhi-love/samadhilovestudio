-- Additive only: never modifies studios or existing R2 checkpoints.
CREATE TABLE IF NOT EXISTS studio_accounts (
 owner TEXT PRIMARY KEY NOT NULL,
 revision INTEGER NOT NULL,
 settings_revision INTEGER NOT NULL DEFAULT 1,
 settings TEXT NOT NULL,
 verified INTEGER NOT NULL DEFAULT 0,
 source_hash TEXT NOT NULL,
 comparison TEXT NOT NULL DEFAULT '{}',
 verified_at TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS studio_songs (
 owner TEXT NOT NULL,
 id TEXT NOT NULL,
 revision INTEGER NOT NULL,
 content TEXT NOT NULL,
 position INTEGER NOT NULL,
 removed INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (owner,id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS studio_song_lyrics (
 owner TEXT NOT NULL, song_id TEXT NOT NULL, lyrics TEXT NOT NULL, versions TEXT NOT NULL,
 PRIMARY KEY (owner,song_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS studio_song_notes (
 owner TEXT NOT NULL, song_id TEXT NOT NULL, content TEXT NOT NULL, prompt_versions TEXT NOT NULL,
 PRIMARY KEY (owner,song_id)
);
--> statement-breakpoint
-- Existing project workflow is attached to a song and may reference a parent
-- project. Store each workflow separately without changing its public format.
CREATE TABLE IF NOT EXISTS studio_projects (
 owner TEXT NOT NULL, id TEXT NOT NULL, parent_id TEXT, content TEXT NOT NULL,
 PRIMARY KEY (owner,id)
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS studio_backup_update_guard
BEFORE UPDATE ON studios
WHEN EXISTS(SELECT 1 FROM studio_accounts WHERE owner=OLD.owner AND verified=1)
BEGIN SELECT RAISE(ABORT,'Legacy studios backup is read-only after verified copy'); END;
--> statement-breakpoint
-- Public catalog/moderation must read current songs, not the frozen backup.
-- Uncopied owners retain their original catalog until their comparison passes.
CREATE VIEW IF NOT EXISTS studio_catalog_songs AS
 SELECT s.owner,s.id,json_set(s.content,'$.notes',json_set(json(n.content),'$.lyrics',l.lyrics)) AS value
 FROM studio_songs s
 JOIN studio_accounts a ON a.owner=s.owner AND a.verified=1
 JOIN studio_song_notes n ON n.owner=s.owner AND n.song_id=s.id
 JOIN studio_song_lyrics l ON l.owner=s.owner AND l.song_id=s.id
 WHERE s.removed=0
 UNION ALL
 SELECT s.owner,json_extract(song.value,'$.id'),song.value FROM studios s,json_each(s.content,'$.songs') song
 WHERE NOT EXISTS(SELECT 1 FROM studio_accounts a WHERE a.owner=s.owner AND a.verified=1);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS studio_backup_delete_guard
BEFORE DELETE ON studios
WHEN EXISTS(SELECT 1 FROM studio_accounts WHERE owner=OLD.owner AND verified=1)
BEGIN SELECT RAISE(ABORT,'Legacy studios backup is read-only after verified copy'); END;
