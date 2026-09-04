import { ArrowLeft, ArrowRight, Check, ChevronDown, LockKeyhole, Minus, Plus, ShieldCheck, Star, Tag, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { fetchProduct, fetchVariantPlans, formatINR, type EmiPlan, type ProductDetail } from "@/lib/api";
import { fallbackForBrand } from "@/lib/fallbackImages";

const money = (value: number) => formatINR(value);

function ProductLoading() {
  return <div className="product-page"><div className="loading-product"><div className="loading-image" /><div className="loading-lines"><span /><span /><span /><span /></div></div></div>;
}

function EmiPlanCard({ plan, selected, onSelect }: { plan: EmiPlan; selected: boolean; onSelect: () => void }) {
  return (
    <button className={selected ? "emi-card is-selected" : "emi-card"} onClick={onSelect} aria-pressed={selected}>
      <span className={selected ? "plan-radio is-selected" : "plan-radio"}>{selected && <Check size={12} strokeWidth={3} />}</span>
      <span className="emi-card-content">
        <span className="emi-card-top"><strong>{money(plan.monthlyPayment)} <small>/ month</small></strong><span>{plan.tenureMonths} months</span></span>
        <span className="emi-card-bottom"><span className={plan.interestRate === 0 ? "interest-free" : "interest-paid"}>{plan.interestRateLabel}</span><span className="cashback-label">{plan.cashback > 0 ? `+ ${plan.cashbackLabel}` : "Flexible payoff"}</span></span>
      </span>
      <ArrowRight size={16} className="emi-arrow" />
    </button>
  );
}

export default function ProductPage() {
  const [, params] = useRoute("/products/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [plans, setPlans] = useState<EmiPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchProduct(slug)
      .then(data => {
        if (!active) return;
        setProduct(data);
        setSelectedVariantId(data.variants[0]?.id ?? null);
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0]?.id ?? null);
      })
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  const selectedVariant = useMemo(() => product?.variants.find(variant => variant.id === selectedVariantId) ?? product?.variants[0], [product, selectedVariantId]);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) ?? plans[0];
  const discount = selectedVariant ? Math.round((1 - selectedVariant.price / selectedVariant.mrp) * 100) : 0;

  async function handleVariantChange(variantId: number) {
    if (!product || variantId === selectedVariantId) return;
    setSelectedVariantId(variantId);
    setPlansLoading(true);
    setNotice("");
    try {
      const nextPlans = await fetchVariantPlans(product.slug, variantId);
      setPlans(nextPlans);
      setSelectedPlanId(nextPlans[0]?.id ?? null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to load plans for this variant");
    } finally {
      setPlansLoading(false);
    }
  }

  if (loading) return <ProductLoading />;
  if (error || !product || !selectedVariant) return <div className="error-screen"><h1>Product unavailable</h1><p>{error || "This product could not be found."}</p><Link href="/" className="primary-button">Back to catalog</Link></div>;

  return (
    <div className="site-shell product-shell">
      <header className="site-header"><Link href="/" className="brand-lockup" aria-label="Fundora home"><span className="brand-mark">F</span><span>fundora<span className="brand-dot">.</span></span></Link><div className="checkout-trust"><LockKeyhole size={14} /> secure checkout</div></header>
      <main className="product-page">
        <div className="breadcrumb"><Link href="/"><ArrowLeft size={15} /> Catalog</Link><span>/</span><span>{product.brand} {product.name}</span></div>
        <section className="product-layout">
          <div className="product-visual-column">
            <div className="product-image-panel" style={{ background: `linear-gradient(145deg, ${product.accentColor}, #fbf8f1)` }}>
              <span className="image-flag">{product.brand} original</span>
              <img src={selectedVariant.imageUrl} alt={`${product.name} ${selectedVariant.label}`} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackForBrand(product.brand); }} />
              <div className="image-float-note"><ShieldCheck size={15} /><span>Quality checked<br /><strong>30-day returns</strong></span></div>
            </div>
            <div className="variant-preview-row">{product.variants.map(variant => <button key={variant.id} className={variant.id === selectedVariant.id ? "preview-thumb is-selected" : "preview-thumb"} onClick={() => handleVariantChange(variant.id)}><img src={variant.imageUrl} alt={variant.label} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackForBrand(product.brand); }} /></button>)}</div>
          </div>
          <div className="product-detail-column">
            <div className="detail-intro"><p className="eyebrow">{product.brand} / {product.category}</p><h1>{product.name}</h1><p className="detail-tagline">{product.tagline}</p><div className="rating-row"><span className="rating-star"><Star size={13} fill="currentColor" /> {product.rating}</span><span>{product.reviewCount} verified reviews</span><span className="dot-separator">•</span><span>Available online</span></div></div>
            <div className="price-block"><div><span className="price-label">Our price</span><strong>{money(selectedVariant.price)}</strong><span className="mrp">MRP <s>{money(selectedVariant.mrp)}</s></span><span className="discount-pill">{discount}% off</span></div><span className="price-caption">Inclusive of all taxes</span></div>
            <div className="option-section"><div className="option-heading"><span>Choose finish & storage</span><strong>{selectedVariant.label}</strong></div><div className="variant-options">{product.variants.map(variant => <button key={variant.id} className={variant.id === selectedVariant.id ? "variant-option is-selected" : "variant-option"} onClick={() => handleVariantChange(variant.id)}><span className="variant-swatch" style={{ background: variant.colorHex }} /> <span>{variant.colorName}</span><small>{variant.storage}</small></button>)}</div></div>
            <div className="plans-section"><div className="plans-heading"><div><p className="eyebrow">Powered by Northstar Mutual Fund</p><h2>Pick your monthly plan</h2></div><span className="plan-count">{plans.length} plans</span></div><p className="plans-subtitle">Your money stays invested while you spread the purchase comfortably. Select a plan to continue.</p>{plansLoading && <div className="plans-loading">Refreshing plans for {selectedVariant.label}...</div>}{!plansLoading && <div className="emi-list">{plans.map(plan => <EmiPlanCard key={plan.id} plan={plan} selected={plan.id === selectedPlanId} onSelect={() => setSelectedPlanId(plan.id)} />)}</div>}</div>
            {selectedPlan && <div className="selected-summary"><div><span>Selected plan</span><strong>{money(selectedPlan.monthlyPayment)} <small>/ month for {selectedPlan.tenureMonths} months</small></strong></div><span className="summary-total">Total {money(selectedPlan.monthlyPayment * selectedPlan.tenureMonths)}</span></div>}
            {notice && <div className="inline-notice">{notice}</div>}
            <button className="proceed-button" disabled={!selectedPlan || plansLoading} onClick={() => setNotice(`Plan selected: ${money(selectedPlan?.monthlyPayment ?? 0)} / month for ${selectedPlan?.tenureMonths ?? 0} months. Checkout integration is ready for the next step.`)}>Proceed with selected plan <ArrowRight size={18} /></button>
            <div className="detail-assurances"><span><WalletCards size={15} /> No-cost options available</span><span><Tag size={15} /> Cashback on select plans</span><span><ShieldCheck size={15} /> Funds stay protected</span></div>
          </div>
        </section>
        <section className="product-info-band"><div><p className="eyebrow">Why this one</p><h2>Made to be used.<br /><em>Designed to last.</em></h2></div><p>{product.description}</p><div className="spec-list"><span><strong>01</strong> Premium build</span><span><strong>02</strong> Flagship performance</span><span><strong>03</strong> One-year warranty</span></div></section>
      </main>
      <footer className="site-footer"><div className="brand-lockup"><span className="brand-mark">F</span><span>fundora<span className="brand-dot">.</span></span></div><span>Financing that respects your future.</span><span><Link href="/">Back to catalog</Link></span></footer>
    </div>
  );
}
