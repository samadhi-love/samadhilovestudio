CREATE TABLE `community_artists` (
	`owner` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_artists_id_unique` ON `community_artists` (`id`);--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`release` text NOT NULL,
	`viewer` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_comment_listener` ON `community_comments` (`release`,`viewer`);--> statement-breakpoint
CREATE INDEX `community_comment_review` ON `community_comments` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_comment_viewer` ON `community_comments` (`viewer`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_listens` (
	`release` text NOT NULL,
	`viewer` text NOT NULL,
	`day` integer NOT NULL,
	`shared` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`release`, `viewer`, `day`),
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `community_listen_recent` ON `community_listens` (`release`,`day`);--> statement-breakpoint
CREATE TABLE `community_marks` (
	`viewer` text NOT NULL,
	`target` text NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`viewer`, `target`, `kind`)
);
--> statement-breakpoint
CREATE INDEX `community_marks_counts` ON `community_marks` (`target`,`kind`,`value`);--> statement-breakpoint
CREATE TABLE `community_playback` (
	`viewer` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`release` text NOT NULL,
	`recording` text NOT NULL,
	`started_at` integer NOT NULL,
	`served_at` integer,
	`share` text,
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_playlist_songs` (
	`playlist` text NOT NULL,
	`release` text NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`playlist`, `release`),
	FOREIGN KEY (`playlist`) REFERENCES `community_playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`viewer` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `community_playlist_viewer` ON `community_playlists` (`viewer`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`song_id` text NOT NULL,
	`recording` text NOT NULL,
	`released_at` integer NOT NULL,
	`listed` integer DEFAULT true NOT NULL,
	`blocked` integer DEFAULT false NOT NULL,
	`inspirational` integer DEFAULT false NOT NULL,
	`comments` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `community_artists`(`owner`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_release_owner_song` ON `community_releases` (`owner`,`song_id`);--> statement-breakpoint
CREATE INDEX `community_release_discovery` ON `community_releases` (`listed`,`blocked`,`released_at`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`release` text NOT NULL,
	`viewer` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_report_listener` ON `community_reports` (`release`,`viewer`,`comment`);--> statement-breakpoint
CREATE INDEX `community_report_review` ON `community_reports` (`closed`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_report_viewer` ON `community_reports` (`viewer`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`release` text NOT NULL,
	`sender` text NOT NULL,
	FOREIGN KEY (`release`) REFERENCES `community_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_share_sender` ON `community_shares` (`release`,`sender`);