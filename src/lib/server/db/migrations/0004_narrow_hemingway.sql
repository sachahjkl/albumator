ALTER TABLE `image` ADD `width` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `image` ADD `height` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `image` ADD `thumb_hash` text DEFAULT '' NOT NULL;
