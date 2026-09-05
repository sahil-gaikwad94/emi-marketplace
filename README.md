# Fundora — Smartphone EMI Marketplace

Fundora is a responsive, database-backed smartphone marketplace built for the 1Fi SDE1 assignment. Users can browse a live catalog, open product-specific pages, switch between device variants, and compare EMI plans with monthly payment, tenure, interest, cashback, and fund-partner information.

## Links

| Resource | Link |
| --- | --- |
| Source repository | [github.com/sahil-gaikwad94/emi-marketplace](https://github.com/sahil-gaikwad94/emi-marketplace) |
| Live application | [(https://emi-marketplace7l.onrender.com)](https://emi-marketplace-1m7l.onrender.com)]|



## Assignment coverage

| Assignment requirement | Implementation |
| --- | --- |
| Dynamic product information | Product summaries and product details are read through the REST API from the database. |
| Product-specific URLs | `/products/iphone-17-pro`, `/products/samsung-galaxy-s24-ultra`, and `/products/oneplus-13`. |
| At least three products | Three seeded smartphones: iPhone 17 Pro, Samsung Galaxy S24 Ultra, and OnePlus 13. |
| At least two variants per product | Seven variants across the three products, including storage and color selections. |
| EMI plan selection | Product pages display selectable EMI plans for the selected variant. |
| Required EMI data | Monthly payment, tenure, interest rate, cashback, and fund-partner details are displayed. |
| Database integration | MySQL-compatible TiDB Cloud database accessed through Drizzle ORM. |
| Responsive interface | Custom responsive CSS supports desktop, tablet, and mobile layouts. |
| Deployment | Production React frontend and Express API run together on Render. |

## Main user flow

The home page requests the catalog from `GET /api/products`. Selecting a product opens its unique product URL. The product page loads the product, variants, and initial EMI plans. Selecting another color or storage option updates the product image and requests plans for the selected variant. The user can compare monthly payments, tenures, interest rates, cashback, and the fund partner for each plan.

The final proceed action is intentionally a selection confirmation. The assignment does not require payments, identity verification, or a financial transaction.

## Features

The application includes a curated catalog landing page, product cards, product-specific routes, responsive navigation, product image fallbacks, device variant switching, EMI plan cards, cashback labels, interest-rate labels, stock labels, and a selected-plan summary.

The catalog is database-backed rather than hardcoded into the React components. Product and variant images are stored with the catalog records. The frontend also contains generated SVG fallback images so a product card remains visually usable if an external image host is temporarily unavailable.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Wouter |
| Styling | Tailwind CSS 4 and custom responsive CSS |
| Backend | Node.js and Express |
| API | REST endpoints under `/api` |
| Database | TiDB Cloud, MySQL-compatible |
| ORM | Drizzle ORM and Drizzle Kit |
| Images | Unsplash catalog URLs with local SVG fallbacks |
| Testing | Vitest |
| Build | Vite for the frontend and esbuild for the server bundle |
| Deployment | Render Web Service |

## Architecture

```
React + TypeScript frontend
  ├── Home.tsx
  ├── ProductPage.tsx
  └── lib/api.ts
          │
          │ JSON over same-origin HTTP
          ▼
Express API
  └── server/productRoutes.ts
          │
          ▼
Database repository
  └── server/db.ts
          │
          ▼
Drizzle ORM + TiDB Cloud
  ├── products
  ├── product_variants
  ├── emi_plans
  └── users
```

The frontend does not contain SQL queries. The Express route layer validates requests and serializes responses. The database layer owns connection pooling, TLS configuration, ordering, and query helpers.

## Data model

The catalog uses three related tables:

```
products 1 ──────── * product_variants 1 ──────── * emi_plans
```

| Table | Purpose | Important fields |
| --- | --- | --- |
| `products` | Product-level marketing and catalog data | Slug, brand, name, category, description, image, rating, featured status |
| `product_variants` | Color, storage, SKU, pricing, image, and stock | Product ID, SKU, color, storage, MRP, price, image URL, stock label |
| `emi_plans` | Variant-specific financing options | Tenure, monthly payment, interest rate, cashback, fund partner |
| `users` | Optional scaffold authentication records | Open ID, name, email, role, timestamps |

Prices are stored as integer paise to avoid floating-point currency errors. Interest rates are stored as basis points; `1050` represents `10.50%`.

The SQL migrations are safe for the existing database because table creation uses `CREATE TABLE IF NOT EXISTS`. The seed script uses product slugs and variant SKUs as stable identities, so it can be run repeatedly without creating duplicate catalog records.

## REST API

### `GET /api/health`

Returns service status and whether `DATABASE_URL` is configured.

```json
{
  "ok": true,
  "service": "emi-marketplace-api",
  "database": true
}
```

### `GET /api/products`

Returns product summaries for the home page.

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

Returns one product, all of its variants, and the initial variant's EMI plans.

Example:

```
/api/products/iphone-17-pro
```

### `GET /api/products/:slug/emi-plans?variantId=:id`

Returns EMI plans for the selected variant.

Example:

```
/api/products/iphone-17-pro/emi-plans?variantId=1
```

The API returns `400` for an invalid variant ID and `404` when a product or variant does not exist. Internal database errors are logged server-side and are returned to the client as a generic `500` error.

## Seeded catalog

The seed script creates or updates:

- Three products.

- Seven product variants.

- Forty-two EMI plans.

- Six EMI terms per variant: 3, 6, 12, 24, 36, and 48 months.

- Zero-interest plans for shorter terms and 10.50% interest for longer terms.

The seeded image URLs have been checked for successful responses. If an image later fails to load, the React image handler switches to a generated brand-specific SVG fallback.

## Local development

### Prerequisites

Install Node.js 22 or newer, pnpm, and a MySQL-compatible database. TiDB Cloud is supported.

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

Do not commit credentials. Set the following variables in your shell or local `.env` file:

```bash
export DATABASE_URL='mysql://user:password@host:4000/database_name'
export NODE_ENV=development
export PORT=3000
```

TiDB Cloud Serverless requires secure public connections. The application parses `DATABASE_URL` and explicitly enables TLS 1.2 for both runtime queries and Drizzle Kit migrations.

### Initialize or update the database

For a new database, apply the schema and seed the catalog:

```bash
pnpm db:push
pnpm db:seed
```

For the deployed database used by this project, the tables already exist and the Render build runs the idempotent seed command directly:

```bash
pnpm db:seed
```

### Start the development server

```bash
pnpm dev
```

The frontend and API are served by the same Express process.

## Production build

Run the checks and build locally:

```bash
pnpm check
pnpm test
pnpm build
```

Start the production server with:

```bash
pnpm start
```

The production build outputs the bundled server to `dist/index.js` and the frontend assets to `dist/public`.

## Render deployment

Deploy this repository as a **Web Service**, not a Static Site. The repository includes `render.yaml` for the service configuration.

| Render setting | Value |
| --- | --- |
| Service type | Web Service |
| Runtime | Node |
| Build command | `pnpm install --frozen-lockfile && pnpm db:seed && pnpm build` |
| Start command | `pnpm start` |
| Health check path | `/api/health` |

Configure these environment variables in Render:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Complete TiDB Cloud MySQL connection string |

The production build seeds the already-created database and then builds the frontend and server. The seed process closes its connection pool after completion so the Render build exits cleanly.

After deployment, verify the following endpoints:

```bash
curl https://YOUR-RENDER-DOMAIN.onrender.com/api/health
curl https://YOUR-RENDER-DOMAIN.onrender.com/api/products
```

The health response must contain `"database": true`. The catalog response must contain three products. The homepage should then display the catalog and images.

## Testing

The repository includes API contract tests and an authentication logout regression test. The product route tests mock the query layer, so they validate HTTP behavior without modifying the production database.

The final local validation passed with:

```
TypeScript check: passed
Test files: 2 passed
Tests: 4 passed
Production build: passed
Migration validation: passed
```

## Project structure

```
client/
  index.html
  src/
    App.tsx
    index.css
    lib/api.ts
    lib/fallbackImages.ts
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
  relations.ts
  0000_great_lady_vermin.sql
  0001_hesitant_magneto.sql
  meta/
drizzle.config.ts
render.yaml
package.json
README.md
```


## References

[1]: https://github.com/sahil-gaikwad94/emi-marketplace "Fundora source repository"

[2]: https://react.dev/ "React documentation"

[3]: https://expressjs.com/ "Express documentation"

[4]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"

[5]: https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-mysql2/ "TiDB Cloud Node.js mysql2 TLS guide"

[6]: https://render.com/docs/blueprint-spec "Render Blueprint specification"

[7]: https://vitest.dev/guide/ "Vitest documentation"

[8]: https://vite.dev/guide/ "Vite documentation"

[9]: https://pnpm.io/ "pnpm documentation"

