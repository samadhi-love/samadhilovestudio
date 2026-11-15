CREATE TABLE `song_deletion_jobs` (
 `owner` text NOT NULL,
 `song_id` text NOT NULL,
 `audio_ids` text NOT NULL,
 `state` text NOT NULL DEFAULT 'queued',
 `created_at` integer NOT NULL,
 `updated_at` integer NOT NULL,
 PRIMARY KEY (`owner`, `song_id`)
);
--> statement-breakpoint
CREATE INDEX `song_deletion_pending` ON `song_deletion_jobs` (`state`,`updated_at`);
