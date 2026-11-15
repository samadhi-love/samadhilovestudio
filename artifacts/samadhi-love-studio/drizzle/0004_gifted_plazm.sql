CREATE TABLE `party_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`party` text NOT NULL,
	`viewer` text NOT NULL,
	`body` text NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `party_comment_feed` ON `party_comments` (`party`,`approved`);--> statement-breakpoint
CREATE TABLE `party_library` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `party_likes` (
	`party` text NOT NULL,
	`viewer` text NOT NULL,
	PRIMARY KEY(`party`, `viewer`)
);
--> statement-breakpoint
CREATE TABLE `party_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`content` text NOT NULL,
	`revision` integer NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `party_owner` ON `party_sets` (`owner`);--> statement-breakpoint
CREATE INDEX `party_feed` ON `party_sets` (`published`,`updated`);