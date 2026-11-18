import { useState } from 'react';
import { Link } from '../lib/router.jsx';
import { useCatalog } from '../context/Catalog.jsx';
import { reviews, stores } from '../data/stores.js';
import ProductCard from '../components/ProductCard.jsx';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState({ text: '18+ only. Unsubscribe any time.', ok: false });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('subscribe failed');
      setNote({ text: 'You are on the list — karibu!', ok: true });
      setEmail('');
    } catch {
      setNote({ text: 'That did not send. Try again in a moment.', ok: false });
    }
  };

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="newsletter">
          <div>
            <h2>Know what lands before it lands</h2>
            <p>
              New arrivals, price drops and the good stuff when it is back in stock. We message
              once a week, never more.
            </p>
          </div>
          <div>
            <form onSubmit={submit}>
              <input
                type="email"
                required
                placeholder="you@email.com"
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="submit" className="btn btn-cream">
                Join
              </button>
            </form>
            <p className={`note ${note.ok ? 'ok' : ''}`}>{note.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { categories, products, loading, error } = useCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 8);
  const picks = featured.length ? featured : products.slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow on-dark">Roysambu · Thindigua · Open 24 hours</span>
            <h1>
              Your bottle,
              <br />
              <em>delivered</em> tonight.
            </h1>
            <p className="lede">
              Whisky, wine, beer and celebration bottles from two Signature doors in Nairobi and
              Kiambu. Genuine stock, fair prices, and a rider on the way within the hour.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary">
                Shop the shelves
              </Link>
              <a href="https://wa.me/254702432522" className="btn btn-ghost on-dark">
                Order on WhatsApp
              </a>
            </div>
            <div className="hero-meta">
              <div>
                <strong>2</strong>
                <span>Nairobi &amp; Kiambu stores</span>
              </div>
              <div>
                <strong>24 hrs</strong>
                <span>Every day, all year</span>
              </div>
              <div>
                <strong>4.6★</strong>
                <span>51 Google reviews</span>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="halo" />
            <span className="hero-tag">This week&apos;s signature pour</span>
            <img className="main-bottle" src="/img/jwblack.webp" alt="" />
            <img className="side-bottle" src="/img/hennessy.webp" alt="" />
          </div>
        </div>
      </section>

      <div className="trustbar">
        <div className="container trustbar-inner">
          <div className="trust-item">
            <strong>Delivery in under an hour</strong>
            <span>Roysambu, Kahawa, Ridgeways, Kiambu Road</span>
          </div>
          <div className="trust-item">
            <strong>100% genuine stock</strong>
            <span>Bought from licensed distributors only</span>
          </div>
          <div className="trust-item">
            <strong>Delivery from KSh 100</strong>
            <span>Near either shop · priced by distance</span>
          </div>
          <div className="trust-item">
            <strong>Open all night</strong>
            <span>Both shops trade 24 hours</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Shop by category</span>
              <h2>Explore the shelves</h2>
            </div>
            <p className="lede">
              From a cold Tusker after work to a bottle worth opening for the big news — all in one
              shop.
            </p>
          </div>
          <div className="cat-grid">
            {categories.map((category) => (
              <Link to="/shop" search={{ cat: category.id }} className="cat-card" key={category.id}>
                <img src={category.image} alt={category.label} loading="lazy" />
                <span>
                  <b>{category.label}</b>
                  <small>{category.blurb}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow wine">Signature picks</span>
              <h2>What Kenya is drinking</h2>
            </div>
            <Link to="/shop" className="link-arrow">
              View all bottles →
            </Link>
          </div>
          {error && !products.length ? (
            <div className="no-results">{error}</div>
          ) : (
            <div className="product-grid">
              {loading && !picks.length
                ? null
                : picks.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section feature-band">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow on-dark">Built for the occasion</span>
              <h2>How it&apos;s usually poured</h2>
            </div>
            <p className="lede" style={{ color: 'rgba(247,241,231,0.65)' }}>
              Tell us the plan — we will tell you what to put on the table.
            </p>
          </div>
          <div className="feature-grid">
            <Link to="/shop" search={{ cat: 'whisky' }} className="feature-card">
              <img src="/img/cat-whisky.webp" alt="" loading="lazy" />
              <span className="eyebrow on-dark">For the long conversation</span>
              <h3>Whisky night</h3>
              <p>Single malts and smooth blends, from everyday pours to the good bottle.</p>
              <span className="link-arrow">Shop whisky →</span>
            </Link>
            <Link to="/shop" search={{ cat: 'wine' }} className="feature-card">
              <img src="/img/cat-wine.webp" alt="" loading="lazy" />
              <span className="eyebrow on-dark">Dinner, sorted</span>
              <h3>Wine for the table</h3>
              <p>Approachable reds and crisp whites that go with everything you cook.</p>
              <span className="link-arrow">Shop wine →</span>
            </Link>
            <Link to="/shop" search={{ cat: 'champagne' }} className="feature-card">
              <img src="/img/cat-champagne.webp" alt="" loading="lazy" />
              <span className="eyebrow on-dark">For the announcement</span>
              <h3>Celebration bottles</h3>
              <p>Champagne, cognac and something gold for the toast that matters.</p>
              <span className="link-arrow">Shop champagne →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split">
            <div className="split-media">
              <img src="/img/store.webp" alt="Inside a Signature Liquor Store branch" />
              <div className="stamp">
                <b>Since 2019</b>
                <span>Serving Nairobi &amp; Kiambu</span>
              </div>
            </div>
            <div>
              <span className="eyebrow">Our story</span>
              <h2>Two doors. One promise: the real bottle.</h2>
              <p className="lede" style={{ marginTop: 16 }}>
                Signature Liquor Store started as a single counter in Roysambu, serving neighbours
                who wanted a cold drink and a fair price at any hour. Word travelled, and the second
                door opened on Kiambu Road in Thindigua.
              </p>
              <p className="lede" style={{ marginTop: 14 }}>
                We keep it simple: stock we would drink ourselves, prices marked plainly, and a
                rider who knows the estate roads. If it is not right, bring it back — no argument.
              </p>
              <div className="mini-stats">
                <div>
                  <b>24 / 7</b>
                  <span>Both branches</span>
                </div>
                <div>
                  <b>4.6★</b>
                  <span>Google rating</span>
                </div>
                <div>
                  <b>57</b>
                  <span>Reviews &amp; counting</span>
                </div>
              </div>
              <div style={{ marginTop: 26 }}>
                <Link to="/about" className="btn btn-ghost">
                  More about us →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Find us</span>
              <h2>Two branches, both open all night</h2>
            </div>
            <Link to="/stores" className="link-arrow">
              Branch details &amp; maps →
            </Link>
          </div>
          <div className="branch-grid">
            {stores.map((store) => (
              <article className="branch-card" id={store.id} key={store.id}>
                <div className="branch-top">
                  <div>
                    <span className="eyebrow">{store.label}</span>
                    <h3 style={{ marginTop: 6 }}>{store.name}</h3>
                  </div>
                  <span className="branch-rating">
                    <i>★</i> {store.rating} ({store.reviews})
                  </span>
                </div>
                <div className="branch-row">
                  <span>Address</span>
                  <span>{store.address}</span>
                </div>
                <div className="branch-row">
                  <span>Hours</span>
                  <span>
                    <span className="open-pill">Open now</span> · {store.hours}
                  </span>
                </div>
                <p className="branch-note">{store.note}</p>
                <div className="branch-actions">
                  <a
                    href={store.mapsUrl}
                    className="btn btn-ghost btn-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                  <a href={store.phoneHref} className="btn btn-primary btn-sm">
                    Call {store.phone}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">From our customers</span>
              <h2>Neighbours say it best</h2>
            </div>
            <p className="lede">Real reviews left on our two Google listings.</p>
          </div>
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.name}>
                <span className="stars">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </span>
                <p>{review.text}</p>
                <footer>
                  <b>{review.name}</b> · {review.branch}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
