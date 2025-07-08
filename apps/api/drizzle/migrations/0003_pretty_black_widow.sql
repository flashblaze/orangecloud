ALTER TABLE `config` ADD `encryptedCredentials` text NOT NULL;--> statement-breakpoint
ALTER TABLE `config` ADD `wrappedDek` text NOT NULL;--> statement-breakpoint
ALTER TABLE `config` ADD `salt` text NOT NULL;--> statement-breakpoint
ALTER TABLE `config` ADD `iv` text NOT NULL;--> statement-breakpoint
ALTER TABLE `config` DROP COLUMN `cloudflareAccountId`;--> statement-breakpoint
ALTER TABLE `config` DROP COLUMN `cloudflareApiToken`;--> statement-breakpoint
ALTER TABLE `config` DROP COLUMN `cloudflareR2AccessKey`;--> statement-breakpoint
ALTER TABLE `config` DROP COLUMN `cloudflareR2SecretKey`;