CREATE TABLE `user_limits` (
	`user_id` text NOT NULL,
	`invites` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 1000 NOT NULL,
	`images` integer DEFAULT 1000 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `usedInvite_id` text;