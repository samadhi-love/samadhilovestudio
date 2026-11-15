CREATE TABLE `billing_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`customer` text,
	`subscription` text,
	`status` text DEFAULT 'none' NOT NULL,
	`selected_plan` text DEFAULT 'free' NOT NULL,
	`cancel_at_end` integer DEFAULT 0 NOT NULL,
	`period_end` integer DEFAULT 0 NOT NULL,
	`blocked` integer DEFAULT 0 NOT NULL,
	`checkout` text,
	`checkout_lock` text,
	`lock_at` integer DEFAULT 0 NOT NULL,
	`notice_version` text,
	`notice_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_accounts_customer_unique` ON `billing_accounts` (`customer`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_accounts_subscription_unique` ON `billing_accounts` (`subscription`);--> statement-breakpoint
CREATE TABLE `billing_invoices` (
	`invoice` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`plan` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`credits` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `billing_invoice_owner_time` ON `billing_invoices` (`owner`,`created_at`);