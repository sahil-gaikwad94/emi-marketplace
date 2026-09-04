import { ArrowRight, Check, CircleHelp, Menu, ShieldCheck, Sparkles, Star, TrendingDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchProducts, formatINR, type ProductSummary } from "@/lib/api";
import { fallbackForBrand } from "@/lib/fallbackImages";

const money = (value: number) => formatINR(value);

function ProductCard({ product, index }: { product: ProductSummary; index: number }) {
  return (
    <Link href={`/products/${product.slug}`} className="product-card group" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="product-card-image" style={{ background: `linear-gradient(145deg, ${product.accentColor}, #fbf8f1)` }}>
        <span className="product-card-badge">{product.featured ? "Editor pick" : product.category}</span>
        <img src={product.imageUrl} alt={product.name} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackForBrand(product.brand); }} />
        <span className="product-card-arrow"><ArrowRight size={16} /></span>
      </div>
      <div className="product-card-body">
        <p className="eyebrow">{product.brand}</p>
        <h3>{product.name}</h3>
        <p>{product.tagline}</p>
        <div className="product-card-meta">
          <span><Star size={13} fill="currentColor" /> {product.rating}</span>
          <span>{product.reviewCount} reviews</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = products.find(product => product.featured) ?? products[0];

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand-lockup" aria-label="Fundora home">
          <span className="brand-mark">F</span>
          <span>fundora<span className="brand-dot">.</span></span>
        </Link>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#catalog" onClick={() => setMenuOpen(false)}>Shop smartphones</a>
          <a href="#trust" onClick={() => setMenuOpen(false)}>Why Fundora</a>
        </nav>
        <div className="header-actions">
          <button className="text-button desktop-only">Sign in</button>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <button className="header-cta desktop-only">Get started <ArrowRight size={16} /></button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="pill-label"><Sparkles size={13} /> Smart shopping, simply funded</div>
            <h1>Own the tech you want.<br /><em>Pay at your pace.</em></h1>
            <p className="hero-description">Premium smartphones, transparent monthly plans, and mutual-fund-backed financing that keeps your cash flow comfortable.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#catalog">Explore products <ArrowRight size={17} /></a>
              <a className="secondary-button" href="#how-it-works">See how it works</a>
            </div>
            <div className="hero-proof"><span className="proof-avatars"><i>R</i><i>A</i><i>K</i></span><span>Trusted by 20,000+ smart shoppers</span></div>
          </div>
          <div className="hero-art" aria-label="Featured product preview">
            <div className="hero-art-orbit orbit-one" />
            <div className="hero-art-orbit orbit-two" />
            <div className="hero-note note-top"><span>0%</span> interest options</div>
            <div className="hero-product-card">
              <div className="hero-product-top"><span className="mini-label">{featured?.brand ?? "Apple"}</span><span className="mini-chip">NEW</span></div>
              <div className="hero-phone-wrap">
                {featured ? <img src={featured.imageUrl} alt={featured.name} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackForBrand(featured.brand); }} /> : <div className="image-skeleton" />}
              </div>
              <div className="hero-product-bottom"><span>from</span><strong>₹3,499<span>/mo</span></strong><small>with a plan</small></div>
            </div>
            <div className="hero-note note-bottom"><ShieldCheck size={15} /> Mutual fund backed</div>
          </div>
        </section>

        <section className="trust-strip" id="trust">
          <div><ShieldCheck size={18} /><span>Secure & transparent</span></div>
          <div><TrendingDown size={18} /><span>Low monthly payments</span></div>
          <div><CircleHelp size={18} /><span>No hidden surprises</span></div>
          <div><Check size={18} /><span>Flexible plan selection</span></div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading"><div><p className="eyebrow">Curated for your next upgrade</p><h2>Pick your perfect <em>device.</em></h2></div><span className="catalog-count">{products.length ? `${products.length} products` : "Loading catalog"}</span></div>
          {loading && <div className="loading-grid">{[1, 2, 3].map(item => <div className="loading-card" key={item} />)}</div>}
          {error && <div className="error-panel">We couldn't load the catalog: {error}. Please refresh to try again.</div>}
          {!loading && !error && <div className="product-grid">{products.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div>}
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading"><p className="eyebrow">Simple by design</p><h2>A better way to <em>buy big.</em></h2><p>Choose your device, find a monthly plan that feels right, and let your money keep working in the background.</p></div>
          <div className="steps-grid">
            <div className="step-card"><span className="step-number">01</span><h3>Choose your variant</h3><p>Compare storage and color options. Every price and image is pulled live from our catalog database.</p></div>
            <div className="step-card step-card-highlight"><span className="step-number">02</span><h3>Make a plan</h3><p>Review multiple tenures, interest rates, cashback, and the fund partner behind each option.</p></div>
            <div className="step-card"><span className="step-number">03</span><h3>Proceed with ease</h3><p>Select your plan and continue when the monthly number feels comfortable for you.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="brand-lockup"><span className="brand-mark">F</span><span>fundora<span className="brand-dot">.</span></span></div><span>Built for intentional upgrades.</span><span>© 2026 Fundora Labs</span></footer>
    </div>
  );
}
