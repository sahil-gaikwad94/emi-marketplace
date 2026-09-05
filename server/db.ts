import { createPool, type Pool } from "mysql2/promise";
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  EmiPlan,
  InsertEmiPlan,
  InsertProduct,
  InsertProductVariant,
  Product,
  ProductVariant,
  emiPlans,
  productVariants,
  products,
  users,
  InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // TiDB Cloud Serverless REQUIRES SSL
      _pool = createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true, // verify server certificate
        },
        connectionLimit: 10,
        queueLimit: 0,
        waitForConnections: true,
        enableKeepAlive: true,
      });
      // mysql2 can be resolved through more than one package path in deployment
      // builds; the runtime object is compatible, but TypeScript sees the Pool
      // declarations as distinct types.
      _db = drizzle(_pool as any) as ReturnType<typeof drizzle>;
      console.log("[Database] Pool created with SSL enabled");
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      _db = null;
    }
  }
  return _db;
}

// Graceful shutdown helper
export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[Database] Pool closed");
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.select().from(products).orderBy(desc(products.featured), asc(products.name));
}

export async function getProductBySlug(slug: string): Promise<{
  product: Product;
  variants: ProductVariant[];
  plans: EmiPlan[];
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const productRows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  const product = productRows[0];
  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(asc(productVariants.id));
  const variantIds = variants.map(variant => variant.id);
  const plans = variantIds.length
    ? await db
        .select()
        .from(emiPlans)
        .where(eq(emiPlans.productVariantId, variantIds[0]))
        .orderBy(asc(emiPlans.tenureMonths), asc(emiPlans.interestRateBps))
    : [];

  return { product, variants, plans };
}

export async function getPlansForVariant(variantId: number): Promise<EmiPlan[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db
    .select()
    .from(emiPlans)
    .where(eq(emiPlans.productVariantId, variantId))
    .orderBy(asc(emiPlans.tenureMonths), asc(emiPlans.interestRateBps));
}

export async function getVariantById(variantId: number): Promise<ProductVariant | null> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
  return rows[0] ?? null;
}

export async function seedProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(products).values(product).onDuplicateKeyUpdate({
    set: {
      brand: product.brand,
      name: product.name,
      category: product.category,
      tagline: product.tagline,
      description: product.description,
      imageUrl: product.imageUrl,
      accentColor: product.accentColor,
      rating: product.rating,
      reviewCount: product.reviewCount,
      featured: product.featured,
    },
  });
  const row = await db.select().from(products).where(eq(products.slug, product.slug)).limit(1);
  return row[0];
}

export async function seedVariant(variant: InsertProductVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(productVariants).values(variant).onDuplicateKeyUpdate({
    set: {
      productId: variant.productId,
      label: variant.label,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      storage: variant.storage,
      mrpInPaise: variant.mrpInPaise,
      priceInPaise: variant.priceInPaise,
      imageUrl: variant.imageUrl,
      stockLabel: variant.stockLabel,
    },
  });
  const row = await db.select().from(productVariants).where(eq(productVariants.sku, variant.sku)).limit(1);
  return row[0];
}

export async function seedPlan(plan: InsertEmiPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(emiPlans).values(plan).onDuplicateKeyUpdate({
    set: {
      monthlyPaymentInPaise: plan.monthlyPaymentInPaise,
      cashbackInPaise: plan.cashbackInPaise,
      fundPartner: plan.fundPartner,
      fundLabel: plan.fundLabel,
      featured: plan.featured,
    },
  });
}

export { and, eq };

