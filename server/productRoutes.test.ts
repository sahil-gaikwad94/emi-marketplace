import express from "express";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getAllProducts: vi.fn(async () => [
    {
      id: 1,
      slug: "iphone-17-pro",
      brand: "Apple",
      name: "iPhone 17 Pro",
      category: "Smartphones",
      tagline: "Pro performance.",
      description: "Test product",
      imageUrl: "https://example.com/phone.jpg",
      accentColor: "#f3a36e",
      rating: "4.8",
      reviewCount: 10,
      featured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProductBySlug: vi.fn(),
  getPlansForVariant: vi.fn(),
  getVariantById: vi.fn(),
}));

import { registerProductRoutes } from "./productRoutes";

describe("product REST API", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = express();
    registerProductRoutes(app);
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  });

  it("reports service health without exposing secrets", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, service: "emi-marketplace-api" });
  });

  it("returns product summaries from the database query layer", async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ meta: { count: 1 }, data: [{ slug: "iphone-17-pro", brand: "Apple" }] });
  });

  it("rejects an invalid variant id before querying the database", async () => {
    const response = await fetch(`${baseUrl}/api/products/iphone-17-pro/emi-plans?variantId=not-a-number`);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "variantId must be a positive integer" });
  });
});
