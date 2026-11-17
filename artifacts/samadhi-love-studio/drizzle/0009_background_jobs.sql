CREATE TABLE IF NOT EXISTS studio_jobs (
 id TEXT PRIMARY KEY NOT NULL,
 owner TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('music-generation','lyric-sync','video-render')),
 status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','working','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
 error_message TEXT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 started_at INTEGER,
 finished_at INTEGER,
 song_id TEXT NOT NULL,
 FOREIGN KEY(owner,song_id) REFERENCES studio_songs(owner,id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS studio_jobs_owner_status ON studio_jobs(owner,status,created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS studio_jobs_owner_song ON studio_jobs(owner,song_id,created_at);
