-- Owner Status history (30 days). Created by the owner's "Set up history" button
-- (app/server/event-store.ts); startup never creates it. Additive and safe to re-run.
CREATE TABLE IF NOT EXISTS studio_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 at INTEGER NOT NULL,
 event TEXT NOT NULL,
 level TEXT NOT NULL,
 ok INTEGER,
 status INTEGER,
 ms INTEGER,
 request_id TEXT,
 job_id TEXT,
 route TEXT,
 actor TEXT,
 detail TEXT NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS studio_events_event_at ON studio_events(event,at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS studio_events_at ON studio_events(at);
