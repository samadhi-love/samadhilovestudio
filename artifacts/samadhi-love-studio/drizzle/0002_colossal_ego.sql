CREATE TABLE `creator_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`suspended` integer DEFAULT false NOT NULL,
	`daily_limit` integer DEFAULT 3 NOT NULL,
	`usage_day` text DEFAULT '' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
