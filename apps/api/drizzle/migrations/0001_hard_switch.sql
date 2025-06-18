CREATE TABLE `config` (
	`id` text PRIMARY KEY NOT NULL,
	`cloudflareAccountId` text NOT NULL,
	`cloudflareApiToken` text NOT NULL,
	`cloudflareR2AccessKey` text NOT NULL,
	`cloudflareR2SecretKey` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
