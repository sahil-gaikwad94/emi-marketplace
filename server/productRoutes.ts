import type { Express, Request, Response } from "express";
import {
  getAllProducts,
  getPlansForVariant,
  getProductBySlug,
  getVariantById,
} from "./db";

const money = (paise: number) => Math.round(paise / 100);
const percent = (bps: number) => Number((bps / 100).toFixed(2));

function serializePlan(plan: Awaited<ReturnType<typeof getPlansForVariant>>[number]) {
  return {
    id: plan.id,
    tenureMonths: plan.tenureMonths,
    monthlyPayment: money(plan.monthlyPaymentInPaise),
    monthlyPaymentLabel: `₹${money(plan.monthlyPaymentInPaise).toLocaleString("en-IN")}/mo`,
    interestRate: percent(plan.interestRateBps),
    interestRateLabel: `${percent(plan.interestRateBps)}% interest`,
    cashback: money(plan.cashbackInPaise),
    cashbackLabel: plan.cashbackInPaise ? `₹${money(plan.cashbackInPaise).toLocaleString("en-IN")} cashback` : "No cashback",
    fundPartner: plan.fundPartner,
    fundLabel: plan.fundLabel,
    featured: plan.featured,
  };
}

function serializeVariant(variant: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>["variants"][number]) {
  return {
    id: variant.id,
    sku: variant.sku,
    label: variant.label,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    storage: variant.storage,
    mrp: money(variant.mrpInPaise),
    price: money(variant.priceInPaise),
    imageUrl: variant.imageUrl,
    stockLabel: variant.stockLabel,
  };
}

function serializeProduct(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  return {
    id: product.product.id,
    slug: product.product.slug,
    brand: product.product.brand,
    name: product.product.name,
    category: product.product.category,
    tagline: product.product.tagline,
    description: product.product.description,
    imageUrl: product.product.imageUrl,
    accentColor: product.product.accentColor,
    rating: Number(product.product.rating),
    reviewCount: product.product.reviewCount,
    variants: product.variants.map(serializeVariant),
    plans: product.plans.map(serializePlan),
  };
}

function sendError(res: Response, error: unknown) {
  console.error("[Products API]", error);
  return res.status(500).json({ error: "Unable to load catalog data" });
}

export function registerProductRoutes(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "emi-marketplace-api", database: Boolean(process.env.DATABASE_URL) });
  });

  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const rows = await getAllProducts();
      res.json({
        data: rows.map(product => ({
          id: product.id,
          slug: product.slug,
          brand: product.brand,
          name: product.name,
          category: product.category,
          tagline: product.tagline,
          imageUrl: product.imageUrl,
          accentColor: product.accentColor,
          rating: Number(product.rating),
          reviewCount: product.reviewCount,
          featured: product.featured,
        })),
        meta: { count: rows.length },
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/products/:slug", async (req: Request, res: Response) => {
    try {
      const product = await getProductBySlug(req.params.slug);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json({ data: serializeProduct(product) });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/products/:slug/emi-plans", async (req: Request, res: Response) => {
    try {
      const variantId = Number(req.query.variantId);
      if (!Number.isInteger(variantId) || variantId <= 0) {
        return res.status(400).json({ error: "variantId must be a positive integer" });
      }
      const variant = await getVariantById(variantId);
      if (!variant) return res.status(404).json({ error: "Variant not found" });
      const plans = await getPlansForVariant(variantId);
      res.json({ data: plans.map(serializePlan), meta: { count: plans.length, variantId } });
    } catch (error) {
      sendError(res, error);
    }
  });
}
