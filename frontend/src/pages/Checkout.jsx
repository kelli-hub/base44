import { useMemo, useState } from 'react';
import { Link } from '../lib/router.jsx';
import { useCart } from '../context/Cart.jsx';
import { useCatalog } from '../context/Catalog.jsx';
import { areas, otherArea, quoteArea } from '../lib/delivery.js';
import { money } from '../lib/format.js';
import { stores } from '../data/stores.js';

const paymentOptions = [
  ['mpesa', 'M-Pesa', 'Pay on the STK prompt when the rider is dispatched'],
  ['card', 'Card', 'Secure payment link sent by SMS'],
  ['cash', 'Cash on delivery', 'Pay the rider when the bottles arrive'],
];

export default function Checkout() {
  const { lines, subtotal, clear, count } = useCart();
  const { find } = useCatalog();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState('mpesa');
  const [areaId, setAreaId] = useState('roysambu');
  const [order, setOrder] = useState(null);

  const outsideRadius = areaId === otherArea.id;
  const quote = useMemo(() => quoteArea(areaId), [areaId]);
  const total = subtotal + quote.fee;
  const areaName = outsideRadius
    ? otherArea.name
    : areas.find((area) => area.id === areaId)?.name ?? '';

  const items = lines.flatMap((line) => {
    const product = find(line.slug);
    return product ? [{ line, product }] : [];
  });

  const submit = async (event) => {
    event.preventDefault();
    if (placing) return;
    setPlacing(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          address: form.get('address'),
          notes: form.get('notes'),
          areaId,
          payment,
          lines: lines.map((line) => ({ slug: line.slug, qty: line.qty })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not place that order.');
      setOrder({ ...data, name: form.get('name') });
      clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <div className="container section">
        <div className="order-done">
          <span className="eyebrow wine">Order received</span>
          <h1>Asante — we are on it.</h1>
          <p>
            Your reference is <b>{order.reference}</b>. A rider will confirm on the phone number you
            gave us and be at your door shortly. Bring your ID — we check age on delivery.
          </p>
          <div className="done-sum">
            <div>
              <span>Order total</span>
              <b>{money(order.total)}</b>
            </div>
            <div>
              <span>Delivery to</span>
              <b>{order.area}</b>
            </div>
            <div>
              <span>Delivery fee</span>
              <b>{money(order.deliveryFee)}</b>
            </div>
          </div>
          <p className="demo-note">
            Payment is confirmed with the rider on {stores[0].phone} — M-Pesa, card link or cash on
            delivery, exactly as you chose at checkout.
          </p>
          <div className="branch-actions" style={{ justifyContent: 'center' }}>
            <Link to="/shop" className="btn btn-primary">
              Keep shopping
            </Link>
            <a href="https://wa.me/254702432522" className="btn btn-ghost">
              WhatsApp the shop
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Checkout</span>
          <h1>Almost at the door</h1>
          <p>
            Delivery is from KSh 100 around either shop and rises with distance. Pick your area and
            we will show the exact fee before you order.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="container checkout-layout">
          {count === 0 ? (
            <div className="no-results">
              Your basket is empty.{' '}
              <Link to="/shop" style={{ textDecoration: 'underline' }}>
                Add a bottle first
              </Link>
              .
            </div>
          ) : (
            <form className="checkout-form" onSubmit={submit}>
              <h2>1 · Who is it for</h2>
              <div className="field-row">
                <label>
                  Full name
                  <input name="name" required autoComplete="name" placeholder="Jane Wanjiru" />
                </label>
                <label>
                  Phone (M-Pesa)
                  <input name="phone" required autoComplete="tel" placeholder="07XX XXX XXX" />
                </label>
              </div>
              <label>
                Delivery address
                <input name="address" required placeholder="House / apartment, street, estate" />
              </label>
              <label>
                Area
                <select value={areaId} onChange={(event) => setAreaId(event.target.value)}>
                  {areas.map((area) => (
                    <option value={area.id} key={area.id}>
                      {area.name}
                    </option>
                  ))}
                  <option value={otherArea.id}>{otherArea.name}</option>
                </select>
              </label>
              {quote.km !== null && !outsideRadius && (
                <p className="fee-hint">
                  {quote.km <= 3
                    ? `Within ${quote.km} km of our ${quote.branch} shop — neighbourhood rate.`
                    : `${quote.km} km from our ${quote.branch} shop — ${quote.extraKm} km past the first 3 km.`}
                </p>
              )}
              {outsideRadius && (
                <p className="fee-hint">
                  Outside our usual radius. We will call to confirm a rider and the fee (never more
                  than KSh 600).
                </p>
              )}
              <label>
                Notes for the rider (optional)
                <textarea name="notes" rows={3} placeholder="Gate code, landmark, call on arrival" />
              </label>

              <h2 style={{ marginTop: 34 }}>2 · How you want to pay</h2>
              <div className="pay-options">
                {paymentOptions.map(([id, title, description]) => (
                  <button
                    type="button"
                    key={id}
                    className={`pay-option ${payment === id ? 'selected' : ''}`}
                    onClick={() => setPayment(id)}
                  >
                    <b>{title}</b>
                    <span>{description}</span>
                  </button>
                ))}
              </div>
              <p className="fee-hint" style={{ marginTop: 18 }}>
                No card details are taken on this site. Your order is sent straight to{' '}
                {quote.branch ? `the ${quote.branch} shop` : 'the shop'} and the rider confirms
                payment on the phone — M-Pesa, a card link by SMS, or cash at the door.
              </p>
              {error && (
                <p className="form-error" role="alert" style={{ marginTop: 18 }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 26 }}
                disabled={placing}
              >
                {placing
                  ? 'Placing order…'
                  : `Place order · ${money(outsideRadius ? subtotal : total)}${
                      outsideRadius ? ' + delivery' : ''
                    }`}
              </button>
              <p className="fine">
                By ordering you confirm you are 18 or older. Delivery is refused, without refund of
                the ride, where age cannot be verified.
              </p>
            </form>
          )}

          {count > 0 && (
            <aside className="order-summary">
              <h3>Your basket</h3>
              {items.map(({ line, product }) => (
                <div className="sum-line" key={line.slug}>
                  <span className="sl-qty">{line.qty}×</span>
                  <span className="sl-name">
                    {product.name}
                    <small>{product.size}</small>
                  </span>
                  <b>KSh {(product.price * line.qty).toLocaleString()}</b>
                </div>
              ))}
              <div className="sum-row" style={{ marginTop: 16 }}>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="sum-row">
                <span>
                  Delivery
                  {quote.km !== null && !outsideRadius && (
                    <small className="zone-sub">
                      {areaName} · {quote.km} km
                    </small>
                  )}
                </span>
                <span>{outsideRadius ? 'Agreed on call' : money(quote.fee)}</span>
              </div>
              <div className="sum-row total">
                <span>Total</span>
                <span>{outsideRadius ? `${money(subtotal)} + ride` : money(total)}</span>
              </div>
              <p className="fine" style={{ marginTop: 14 }}>
                First 3 km from either shop is KSh 100, then KSh 50 for every extra 3 km. Genuine
                stock · sealed and checked.
              </p>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
