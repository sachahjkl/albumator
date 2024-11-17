PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_share_to_images` (
	`share_id` text NOT NULL,
	`image_id` text NOT NULL,
	PRIMARY KEY(`share_id`, `image_id`),
	FOREIGN KEY (`share_id`) REFERENCES `share`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `image`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_share_to_images`("share_id", "image_id") SELECT "share_id", "image_id" FROM `share_to_images`;--> statement-breakpoint
DROP TABLE `share_to_images`;--> statement-breakpoint
ALTER TABLE `__new_share_to_images` RENAME TO `share_to_images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`)
);
--> statement-breakpoint
INSERT INTO `__new_user_roles`("user_id", "role_id") SELECT "user_id", "role_id" FROM `user_roles`;--> statement-breakpoint
DROP TABLE `user_roles`;--> statement-breakpoint
ALTER TABLE `__new_user_roles` RENAME TO `user_roles`;