export type ProductSummary = {
  id: number;
  slug: string;
  brand: string;
  name: string;
  category: string;
  tagline: string;
  imageUrl: string;
  accentColor: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
};

export type ProductVariant = {
  id: number;
  sku: string;
  label: string;
  colorName: string;
  colorHex: string;
  storage: string;
  mrp: number;
  price: number;
  imageUrl: string;
  stockLabel: string;
};

export type EmiPlan = {
  id: number;
  tenureMonths: number;
  monthlyPayment: number;
  monthlyPaymentLabel: string;
  interestRate: number;
  interestRateLabel: string;
  cashback: number;
  cashbackLabel: string;
  fundPartner: string;
  fundLabel: string;
  featured: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string;
  variants: ProductVariant[];
  plans: EmiPlan[];
};

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }
  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export function fetchProducts() {
  return request<ProductSummary[]>("/api/products");
}

export function fetchProduct(slug: string) {
  return request<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
}

export function fetchVariantPlans(slug: string, variantId: number) {
  return request<EmiPlan[]>(`/api/products/${encodeURIComponent(slug)}/emi-plans?variantId=${variantId}`);
}

export function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}
