# Fundora — Product EMI Marketplace

A polished, database-backed product detail experience for the 1Fi SDE1 assignment. The app presents smartphones, variants, and mutual-fund-backed EMI plans through a React frontend and an Express/Node REST API.

> **Implementation note:** The session's managed WebDev database is MySQL/TiDB, so the live implementation uses **React + Express + Node.js + Drizzle ORM + MySQL/TiDB**. This is the provisioned, deployable related stack available in this environment. The application is deliberately layered like a MERN application: React owns presentation, Express owns HTTP controllers, and `server/db.ts` owns the persistence adapter. Replacing the Drizzle repository with Mongoose repositories would not change the REST contract or React screens.

## Assignment coverage

| Requirement | Implementation |
|---|---|
| Dynamic product information | `GET /api/products` and `GET /api/products/:slug` read from the database |
| Product-specific URLs | `/products/iphone-17-pro`, `/products/samsung-galaxy-s24-ultra`, and `/products/oneplus-13` |
| Three products | Seeded in `server/seed.ts` |
| At least two variants per product | Seven total variants across the three products |
| EMI plan selection | Product page displays selectable plans and a selected-plan summary |
| Monthly payment, tenure, interest, cashback | Returned by the EMI plan API and rendered in the plan cards |
| API-backed variant switching | `GET /api/products/:slug/emi-plans?variantId=...` |
| Schema and seed data | `drizzle/schema.ts`, generated migration, and `server/seed.ts` |
| Responsive UI | Mobile-first CSS with desktop, tablet, and mobile breakpoints |

## Tech stack

| Layer | Technology | Why it is used |
|---|---|---|
| Presentation | React 19 + TypeScript | Component-based, typed UI and clear state transitions |
| Styling | Tailwind CSS 4 import + custom CSS | Utility foundation with a distinctive editorial storefront system |
| Routing | Wouter | Small client-side route layer for product-specific URLs |
| HTTP server | Node.js + Express | Explicit REST controllers and health endpoint |
| Persistence | MySQL/TiDB + Drizzle ORM | Managed database connection, typed schema, foreign keys, and indexes |
| Icons | Lucide React | Accessible, consistent interface icons |
| Testing | Vitest | Fast API contract and scaffold regression tests |
| Build | Vite + esbuild | Fast client build and production Node bundle |

## Architecture

The code follows a layered **modern MVC-style architecture**. In classic MVC, the model represents data, the controller handles requests, and the view renders the response. In this app, the React client is the View, Express route handlers are Controllers, and the database helpers plus Drizzle schema are the Model layer.

```text
React View
  ├─ Home.tsx                         catalog landing page
  ├─ ProductPage.tsx                  product detail + EMI selection
  └─ lib/api.ts                       typed HTTP client
          │
          ▼
Express Controller Layer
  └─ server/productRoutes.ts          REST routes, validation, serialization
          │
          ▼
Repository / Model Layer
  └─ server/db.ts                     database connection + query helpers
          │
          ▼
Drizzle Schema + MySQL/TiDB
  ├─ products
  ├─ product_variants
  └─ emi_plans
```

### Why this separation matters

The UI does not know table names or SQL details. The route layer does not know how the browser formats a button. The query layer owns relationships, ordering, and database availability. This prevents the common mistake of putting database calls directly inside React components or embedding hardcoded catalog objects in the frontend.

A MongoDB/Mongoose version would preserve the same boundaries:

```text
products collection + variants / plans subdocuments
          │
          ▼
Mongoose repository with getAllProducts(), getProductBySlug(), getPlansForVariant()
          │
          ▼
The same Express routes and React client
```

## Data model

The database uses three catalog tables. Prices are stored as integer paise to avoid floating-point currency errors. Interest rates are stored as basis points, so `1050` means `10.50%`.

| Table | Purpose | Important constraints |
|---|---|---|
| `products` | Product-level identity and marketing data | Unique `slug`, indexed `category` |
| `product_variants` | Color, storage, SKU, price, image, and stock | Unique `sku`, foreign key to `products`, cascade delete |
| `emi_plans` | Monthly amount, tenure, rate, cashback, and fund metadata | Foreign key to `product_variants`, unique variant + tenure + rate |

Relationships:

```text
products 1 ──────── * product_variants 1 ──────── * emi_plans
```

The generated migration is `drizzle/0001_hesitant_magneto.sql`. The schema source of truth is `drizzle/schema.ts`.

## Project structure

```text
client/
  index.html
  src/
    App.tsx
    index.css
    lib/api.ts
    pages/Home.tsx
    pages/ProductPage.tsx
server/
  db.ts
  productRoutes.ts
  productRoutes.test.ts
  seed.ts
  _core/index.ts
drizzle/
  schema.ts
  0001_hesitant_magneto.sql
README.md
SUBMISSION.md
```

## Local setup

### Prerequisites

Install Node.js 22 or newer, pnpm, and a MySQL-compatible database. TiDB works as well. The application expects a normal `DATABASE_URL` connection string.

### Install dependencies

```bash
pnpm install
```

### Configure the database

Set the connection string in your shell or local environment. Do not commit credentials.

```bash
export DATABASE_URL='mysql://user:password@host:3306/emi_marketplace'
export NODE_ENV='development'
export PORT='3000'
```

The managed WebDev preview already provides `DATABASE_URL` and the runtime configuration.

### Apply schema and seed data

```bash
pnpm db:push
pnpm db:seed
```

`db:seed` is idempotent. It uses product slugs and variant SKUs as stable identity keys, so rerunning it updates the existing catalog instead of duplicating products. It creates three products, seven variants, and 42 EMI plans.

### Run the development server

```bash
pnpm dev
```

Open the printed preview URL. The API and frontend are served by the same Express process.

## REST API

### `GET /api/health`

Confirms the service is alive and whether a database URL is configured.

```json
{
  "ok": true,
  "service": "emi-marketplace-api",
  "database": true
}
```

### `GET /api/products`

Returns product summaries for the catalog landing page.

```json
{
  "data": [
    {
      "id": 1,
      "slug": "iphone-17-pro",
      "brand": "Apple",
      "name": "iPhone 17 Pro",
      "category": "Smartphones",
      "tagline": "Pro performance. Pocket-sized confidence.",
      "imageUrl": "https://images.unsplash.com/...",
      "accentColor": "#f3a36e",
      "rating": 4.8,
      "reviewCount": 284,
      "featured": true
    }
  ],
  "meta": { "count": 3 }
}
```

### `GET /api/products/:slug`

Returns a complete product, all variants, and the initial variant's EMI plans.

Example: `/api/products/iphone-17-pro`

```json
{
  "data": {
    "id": 1,
    "slug": "iphone-17-pro",
    "brand": "Apple",
    "name": "iPhone 17 Pro",
    "description": "A titanium-finish flagship...",
    "variants": [
      {
        "id": 1,
        "sku": "APL-IP17P-SLV-256",
        "label": "Silver / 256 GB",
        "colorName": "Silver",
        "colorHex": "#d7d8d9",
        "storage": "256 GB",
        "mrp": 134000,
        "price": 127400,
        "imageUrl": "https://images.unsplash.com/...",
        "stockLabel": "In stock"
      }
    ],
    "plans": [
      {
        "id": 1,
        "tenureMonths": 3,
        "monthlyPayment": 42467,
        "monthlyPaymentLabel": "₹42,467/mo",
        "interestRate": 0,
        "interestRateLabel": "0% interest",
        "cashback": 750,
        "cashbackLabel": "₹750 cashback",
        "fundPartner": "Northstar Mutual Fund",
        "fundLabel": "Northstar Liquid Advantage Fund",
        "featured": true
      }
    ]
  }
}
```

### `GET /api/products/:slug/emi-plans?variantId=:id`

Returns plans for the selected variant. The server validates that `variantId` is a positive integer and returns a `400` response before querying when it is invalid.

```json
{
  "data": [
    {
      "id": 7,
      "tenureMonths": 6,
      "monthlyPayment": 21233,
      "monthlyPaymentLabel": "₹21,233/mo",
      "interestRate": 0,
      "interestRateLabel": "0% interest",
      "cashback": 500,
      "cashbackLabel": "₹500 cashback",
      "fundPartner": "Northstar Mutual Fund",
      "fundLabel": "Northstar Liquid Advantage Fund",
      "featured": true
    }
  ],
  "meta": { "count": 6, "variantId": 2 }
}
```

### Error behavior

| Status | Meaning |
|---:|---|
| `200` | Request succeeded |
| `400` | Invalid variant query input |
| `404` | Product or variant does not exist |
| `500` | Database or server failure; response omits internal error details |

## Frontend behavior

The landing page makes one request to `GET /api/products`. Each card navigates to a unique product URL. The product page makes one detail request and initializes the first variant and plan. Clicking another variant makes a second request to the variant-specific EMI endpoint. The price and product image update locally from the selected variant while the EMI plan list is replaced with the server response.

The proceed button intentionally stops at a clear selection confirmation because the assignment does not require payment or identity verification. It is the correct place to add a checkout or application flow later. No financial transaction is performed.

## Verification

Run the full automated checks:

```bash
pnpm check
pnpm test
pnpm build
```

The tests cover the existing auth logout regression and the product REST contract. The product API tests use a mocked query layer so they verify HTTP behavior without modifying the live database.

Useful manual smoke checks:

```bash
curl "$APP_URL/api/health"
curl "$APP_URL/api/products"
curl "$APP_URL/api/products/iphone-17-pro"
curl "$APP_URL/api/products/iphone-17-pro/emi-plans?variantId=1"
```

In the browser, verify that `/products/iphone-17-pro` and the other two product URLs load directly, not only after navigating from the home page.

## Deployment

The project is ready for the managed WebDev runtime. Before publishing, save a WebDev checkpoint. The production command is:

```bash
pnpm build
pnpm start
```

For Vercel or Render, configure the build and start commands above and add `DATABASE_URL` as a server-side environment variable. Run the migration and seed once against the production database, then set the frontend and API to the same origin so `/api/*` requests do not need a separate CORS configuration.

If deploying on separate frontend and API hosts, replace the relative API base in `client/src/lib/api.ts` with a public `VITE_API_BASE_URL` and configure CORS on the Express server.

## Submission

Use `SUBMISSION.md` for the assignment checklist, the final Google Form fields, and a two-to-five-minute demo recording script. The form link from the brief is [https://forms.gle/V4vqbcSAhJV7BqoAA](https://forms.gle/V4vqbcSAhJV7BqoAA).

## References

[1]: https://react.dev/ "React documentation"
[2]: https://expressjs.com/ "Express documentation"
[3]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
[4]: https://dev.mysql.com/doc/ "MySQL documentation"
[5]: https://vitest.dev/ "Vitest documentation"
[6]: https://wouter.vercel.app/ "Wouter documentation"
