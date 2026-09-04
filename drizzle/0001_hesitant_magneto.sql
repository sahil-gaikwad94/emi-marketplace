CREATE TABLE `emi_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productVariantId` int NOT NULL,
	`tenureMonths` int NOT NULL,
	`monthlyPaymentInPaise` int NOT NULL,
	`interestRateBps` int NOT NULL DEFAULT 0,
	`cashbackInPaise` int NOT NULL DEFAULT 0,
	`fundPartner` varchar(120) NOT NULL,
	`fundLabel` varchar(120) NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emi_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `emi_variant_term_rate_unique` UNIQUE(`productVariantId`,`tenureMonths`,`interestRateBps`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(80) NOT NULL,
	`label` varchar(100) NOT NULL,
	`colorName` varchar(80) NOT NULL,
	`colorHex` varchar(20) NOT NULL,
	`storage` varchar(40) NOT NULL,
	`mrpInPaise` int NOT NULL,
	`priceInPaise` int NOT NULL,
	`imageUrl` text NOT NULL,
	`stockLabel` varchar(80) NOT NULL DEFAULT 'In stock',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`brand` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(80) NOT NULL,
	`tagline` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text NOT NULL,
	`accentColor` varchar(20) NOT NULL,
	`rating` varchar(10) NOT NULL,
	`reviewCount` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `emi_plans` ADD CONSTRAINT `emi_plans_productVariantId_product_variants_id_fk` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `emi_variant_idx` ON `emi_plans` (`productVariantId`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`productId`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);