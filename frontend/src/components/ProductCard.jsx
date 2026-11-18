import { Link } from '../lib/router.jsx';
import { useCart } from '../context/Cart.jsx';
import { discountPercent, money } from '../lib/format.js';

export default function ProductCard({ product }) {
  const { add, lastAdded } = useCart();
  const justAdded = lastAdded === product.slug;
  const discount = discountPercent(product);

  return (
    <article className={`card ${product.inStock ? '' : 'sold-out'}`}>
      <Link
        to={`/product/${product.slug}`}
        className="card-media"
        aria-label={product.name}
        style={{ display: 'grid' }}
      >
        {product.badge ? (
          <span
            className={`badge ${
              product.badge === 'New' ? 'new' : product.badge === 'Signature Pick' ? 'pick' : ''
            }`}
          >
            {product.badge === 'Deal' && discount ? `-${discount}%` : product.badge}
          </span>
        ) : null}
        {!product.inStock && <span className="badge out">Out of stock</span>}
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="card-body">
        <span className="card-brand">{product.brand}</span>
        <Link to={`/product/${product.slug}`} className="card-name">
          {product.name}
        </Link>
        <div className="card-price">
          <b>{money(product.price)}</b>
          {product.was ? <s>{money(product.was)}</s> : null}
        </div>
        <span className={`card-stock ${product.inStock ? '' : 'out'}`}>
          {product.inStock
            ? product.lowStock
              ? `Only ${product.stock} left — ready today`
              : 'In stock · ready today'
            : 'Out of stock — check back soon'}
        </span>
        <button
          className={`btn btn-primary btn-sm ${justAdded ? 'added' : ''}`}
          onClick={() => add(product.slug)}
          disabled={!product.inStock}
        >
          {product.inStock ? (justAdded ? 'Added ✓' : 'Add to basket') : 'Out of stock'}
        </button>
      </div>
    </article>
  );
}
