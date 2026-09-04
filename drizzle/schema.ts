import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing the scaffold's optional auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    brand: varchar("brand", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    tagline: varchar("tagline", { length: 255 }).notNull(),
    description: text("description").notNull(),
    imageUrl: text("imageUrl").notNull(),
    accentColor: varchar("accentColor", { length: 20 }).notNull(),
    rating: varchar("rating", { length: 10 }).notNull(),
    reviewCount: int("reviewCount").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("products_category_idx").on(table.category)],
);

export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 80 }).notNull().unique(),
    label: varchar("label", { length: 100 }).notNull(),
    colorName: varchar("colorName", { length: 80 }).notNull(),
    colorHex: varchar("colorHex", { length: 20 }).notNull(),
    storage: varchar("storage", { length: 40 }).notNull(),
    mrpInPaise: int("mrpInPaise").notNull(),
    priceInPaise: int("priceInPaise").notNull(),
    imageUrl: text("imageUrl").notNull(),
    stockLabel: varchar("stockLabel", { length: 80 }).notNull().default("In stock"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("variants_product_idx").on(table.productId)],
);

export const emiPlans = mysqlTable(
  "emi_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    productVariantId: int("productVariantId")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    tenureMonths: int("tenureMonths").notNull(),
    monthlyPaymentInPaise: int("monthlyPaymentInPaise").notNull(),
    interestRateBps: int("interestRateBps").notNull().default(0),
    cashbackInPaise: int("cashbackInPaise").notNull().default(0),
    fundPartner: varchar("fundPartner", { length: 120 }).notNull(),
    fundLabel: varchar("fundLabel", { length: 120 }).notNull(),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("emi_variant_idx").on(table.productVariantId),
    unique("emi_variant_term_rate_unique").on(
      table.productVariantId,
      table.tenureMonths,
      table.interestRateBps,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type EmiPlan = typeof emiPlans.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type InsertEmiPlan = typeof emiPlans.$inferInsert;
