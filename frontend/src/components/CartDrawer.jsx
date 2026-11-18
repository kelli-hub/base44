import { Link } from '../lib/router.jsx';
import { useCart } from '../context/Cart.jsx';
import { useCatalog } from '../context/Catalog.jsx';
import { money } from '../lib/format.js';

export function Toast() {
  const { lastAdded } = useCart();
  const { find } = useCatalog();
  const product = lastAdded ? find(lastAdded) : undefined;
  return (
    <div className={`toast ${product ? 'show' : ''}`} role="status">
      {product ? `Added ${product.name}` : ''}
    </div>
  );
}

export default function CartDrawer() {
  const { lines, subtotal, setQty, remove, drawerOpen, closeDrawer, count } = useCart();
  const { find } = useCatalog();
  const items = lines.flatMap((line) => {
    const product = find(line.slug);
    return product ? [{ line, product }] : [];
  });

  return (
    <>
      <div
        className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className={`drawer ${drawerOpen ? 'open' : ''}`}
        aria-label="Shopping cart"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer-head">
          <h3>
            Your basket {count > 0 && <span style={{ fontSize: 13 }}>({count})</span>}
          </h3>
          <button className="icon-btn" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-cart">
              <b>Nothing chilled yet</b>
              Add a bottle and we will have it ready at the counter or on a bike.
              <div style={{ marginTop: 18 }}>
                <Link to="/shop" className="btn btn-primary btn-sm" onClick={closeDrawer}>
                  Browse the shelves
                </Link>
              </div>
            </div>
          ) : (
            items.map(({ line, product }) => (
              <div className="cart-line" key={line.slug}>
                <div className="cart-line-media">
                  <img src={product.image} alt={product.name} />
                </div>
                <div>
                  <h4>{product.name}</h4>
                  <small>{product.size}</small>
                  <div className="qty">
                    <button
                      onClick={() => setQty(line.slug, line.qty - 1)}
                      aria-label={`Remove one ${product.name}`}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button onClick={() => setQty(line.slug, line.qty + 1)} aria-label={`Add one ${product.name}`}>
                      +
                    </button>
                  </div>
                  <button className="remove-link" onClick={() => remove(line.slug)}>
                    Remove
                  </button>
                </div>
                <div className="cart-line-price">KSh {(product.price * line.qty).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="free-ship fee-note">Delivery from KSh 100 · priced by distance at checkout</div>
            <div className="sum-row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="sum-row total">
              <span>Before delivery</span>
              <span>{money(subtotal)}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary" onClick={closeDrawer}>
              Checkout
            </Link>
            <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
              M-Pesa · Card · Cash on delivery · 18+ only
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
