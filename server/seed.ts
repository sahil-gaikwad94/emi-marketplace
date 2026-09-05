import "dotenv/config";
import { seedPlan, seedProduct, seedVariant } from "./db";

const products = [
  {
    slug: "iphone-17-pro",
    brand: "Apple",
    name: "iPhone 17 Pro",
    category: "Smartphones",
    tagline: "Pro performance. Pocket-sized confidence.",
    description: "A titanium-finish flagship with a pro camera system, all-day battery, and the latest Apple silicon.",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=88",
    accentColor: "#f3a36e",
    rating: "4.8",
    reviewCount: 284,
    featured: true,
  },
  {
    slug: "samsung-galaxy-s24-ultra",
    brand: "Samsung",
    name: "Galaxy S24 Ultra",
    category: "Smartphones",
    tagline: "Galaxy AI meets an uncompromising camera.",
    description: "A precision-built Android flagship with S Pen, a bright display, and a camera made for zooming in.",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=88",
    accentColor: "#b6c9e8",
    rating: "4.7",
    reviewCount: 197,
    featured: false,
  },
  {
    slug: "oneplus-13",
    brand: "OnePlus",
    name: "OnePlus 13",
    category: "Smartphones",
    tagline: "Fast, fluid, and ready for more.",
    description: "A high-refresh-rate display and flagship-grade Snapdragon performance wrapped in a confident design.",
    imageUrl: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1000&q=88",
    accentColor: "#c7b7ff",
    rating: "4.6",
    reviewCount: 126,
    featured: false,
  },
] as const;

const variantSeed = [
  {
    productSlug: "iphone-17-pro",
    variants: [
      { sku: "APL-IP17P-SLV-256", label: "Silver / 256 GB", colorName: "Silver", colorHex: "#d7d8d9", storage: "256 GB", mrpInPaise: 13400000, priceInPaise: 12740000, imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=88" },
      { sku: "APL-IP17P-ORG-512", label: "Desert Orange / 512 GB", colorName: "Desert Orange", colorHex: "#d87845", storage: "512 GB", mrpInPaise: 15400000, priceInPaise: 14650000, imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=88" },
      { sku: "APL-IP17P-NVY-1TB", label: "Deep Navy / 1 TB", colorName: "Deep Navy", colorHex: "#1e2f45", storage: "1 TB", mrpInPaise: 17400000, priceInPaise: 16580000, imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=88" },
    ],
  },
  {
    productSlug: "samsung-galaxy-s24-ultra",
    variants: [
      { sku: "SAM-S24U-BLK-256", label: "Titanium Black / 256 GB", colorName: "Titanium Black", colorHex: "#252525", storage: "256 GB", mrpInPaise: 13499900, priceInPaise: 9999000, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=88" },
      { sku: "SAM-S24U-VLT-512", label: "Titanium Violet / 512 GB", colorName: "Titanium Violet", colorHex: "#827391", storage: "512 GB", mrpInPaise: 14499900, priceInPaise: 11299000, imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=88" },
    ],
  },
  {
    productSlug: "oneplus-13",
    variants: [
      { sku: "OP13-BLK-256", label: "Midnight Black / 256 GB", colorName: "Midnight Black", colorHex: "#212124", storage: "256 GB", mrpInPaise: 6999000, priceInPaise: 5999000, imageUrl: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1000&q=88" },
      { sku: "OP13-GRN-512", label: "Emerald Green / 512 GB", colorName: "Emerald Green", colorHex: "#365746", storage: "512 GB", mrpInPaise: 7999000, priceInPaise: 6999000, imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=88" },
    ],
  },
] as const;

const planTerms = [
  { tenureMonths: 3, interestRateBps: 0, factor: 3, cashbackInPaise: 75000, featured: true },
  { tenureMonths: 6, interestRateBps: 0, factor: 6, cashbackInPaise: 50000, featured: true },
  { tenureMonths: 12, interestRateBps: 0, factor: 12, cashbackInPaise: 25000, featured: false },
  { tenureMonths: 24, interestRateBps: 0, factor: 24, cashbackInPaise: 0, featured: false },
  { tenureMonths: 36, interestRateBps: 1050, factor: 36 * 1.044, cashbackInPaise: 0, featured: false },
  { tenureMonths: 48, interestRateBps: 1050, factor: 48 * 1.065, cashbackInPaise: 0, featured: false },
];

async function main() {
  const productIds = new Map<string, number>();
  for (const product of products) {
    const saved = await seedProduct(product);
    if (!saved) throw new Error(`Could not seed ${product.slug}`);
    productIds.set(product.slug, saved.id);
  }

  for (const group of variantSeed) {
    const productId = productIds.get(group.productSlug);
    if (!productId) throw new Error(`Missing parent product ${group.productSlug}`);
    for (const variant of group.variants) {
      const savedVariant = await seedVariant({ ...variant, productId, stockLabel: "In stock" });
      if (!savedVariant) throw new Error(`Could not seed ${variant.sku}`);
      for (const plan of planTerms) {
        await seedPlan({
          ...plan,
          productVariantId: savedVariant.id,
          monthlyPaymentInPaise: Math.round(variant.priceInPaise / plan.factor),
          fundPartner: "Northstar Mutual Fund",
          fundLabel: plan.interestRateBps === 0 ? "Northstar Liquid Advantage Fund" : "Northstar Balanced Advantage Fund",
        });
      }
    }
  }
  console.log("Seed completed: 3 products, 7 variants, and 42 EMI plans.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

