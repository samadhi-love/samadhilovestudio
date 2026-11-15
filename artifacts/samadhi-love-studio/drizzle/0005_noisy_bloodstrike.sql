CREATE TABLE `credit_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`funding` text DEFAULT 'own' NOT NULL,
	`status` text DEFAULT 'free' NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`period_start` integer DEFAULT 0 NOT NULL,
	`period_end` integer DEFAULT 0 NOT NULL,
	`last_change` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`amount` integer NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `credit_ledger_owner_time` ON `credit_ledger` (`owner`,`created_at`);--> statement-breakpoint
CREATE TABLE `production_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`operation` text NOT NULL,
	`funding` text NOT NULL,
	`credits` integer NOT NULL,
	`seconds` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`period_end` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `production_owner_status` ON `production_jobs` (`owner`,`status`);--> statement-breakpoint
CREATE INDEX `production_owner_time` ON `production_jobs` (`owner`,`created_at`);