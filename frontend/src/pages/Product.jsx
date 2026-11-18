import { Link } from '../lib/router.jsx';
import { useCatalog } from '../context/Catalog.jsx';
import { useCart } from '../context/Cart.jsx';
import { discountPercent, money } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Product({ slug }) {
  const { find, products, categoryLabel, loading, error } = useCatalog();
  const product = find(slug);
  const { add, lastAdded, openDrawer } = useCart();

  if (!product && loading) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Checking the shelf…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <h1>{error ? 'We could not load the shelf' : "We can't find that bottle"}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 12 }}>
          {error || 'It may have sold out. Have a look at what is on the shelf instead.'}
        </p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: 24 }}>
          Back to the shop
        </Link>
      </div>
    );
  }

  const related = products
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3);
  const discount = discountPercent(product);
  const justAdded = lastAdded === product.slug;

  return (
    <>
      <div className="container crumbs">
        <Link to="/">Home</Link> <span>/</span> <Link to="/shop">Shop</Link> <span>/</span>{' '}
        <Link to="/shop" search={{ cat: product.category }}>
          {categoryLabel(product.category)}
        </Link>{' '}
        <span>/</span> <em>{product.brand}</em>
      </div>

      <section className="container product-detail">
        <div className="pd-media">
          {discount > 0 && <span className="badge">-{discount}% this week</span>}
          {!product.inStock && <span className="badge out">Out of stock</span>}
          <img src={product.image} alt={product.name} />
        </div>
        <div className="pd-copy">
          <span className="eyebrow">
            {product.brand} · {product.origin}
          </span>
          <h1>{product.name}</h1>
          <div className="pd-price">
            <b>{money(product.price)}</b>
            {product.was && <s>{money(product.was)}</s>}
            {discount > 0 && <span className="pd-save">Save {money(product.was - product.price)}</span>}
          </div>
          <p className="pd-note">{product.note}</p>
          {!product.inStock && (
            <p className="card-stock out" style={{ marginTop: 12 }}>
              Out of stock — check back soon or message us to reserve the next delivery.
            </p>
          )}
          <dl className="pd-facts">
            <div>
              <dt>Size</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>Strength</dt>
              <dd>{product.abv}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{categoryLabel(product.category)}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{product.origin}</dd>
            </div>
          </dl>
          <div className="pd-actions">
            <button
              className={`btn btn-primary ${justAdded ? 'added' : ''}`}
              onClick={() => add(product.slug)}
              disabled={!product.inStock}
            >
              {product.inStock ? (justAdded ? 'Added to basket ✓' : 'Add to basket') : 'Out of stock'}
            </button>
            <button className="btn btn-ghost" onClick={openDrawer}>
              View basket
            </button>
          </div>
          <ul className="pd-perks">
            <li>Delivered today from our nearest branch</li>
            <li>Delivery from KSh 100 by distance — shown at checkout</li>
            <li>Pay by M-Pesa, card or cash on delivery</li>
            <li>Genuine stock — sealed and checked before dispatch</li>
          </ul>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Pairs well with</span>
              <h2>More {categoryLabel(product.category).toLowerCase()}</h2>
            </div>
            <Link to="/shop" search={{ cat: product.category }} className="link-arrow">
              See category →
            </Link>
          </div>
          <div className="product-grid three">
            {(related.length ? related : products.slice(0, 3)).map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
