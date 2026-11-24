import { Link } from '../lib/router.jsx';
import { stores } from '../data/stores.js';

const promises = [
  {
    title: 'Genuine stock',
    text: 'Everything is bought through licensed distributors. Sealed, checked and counted before it leaves the shop.',
  },
  {
    title: 'Plain pricing',
    text: 'The shelf price is the price. No surprise service charge at the counter.',
  },
  {
    title: 'Open all night',
    text: 'Both branches trade 24 hours — including public holidays.',
  },
  {
    title: 'Fast local delivery',
    text: 'Riders based at each branch, so Roysambu and Kiambu Road orders go out in minutes.',
  },
  {
    title: 'Responsible selling',
    text: 'Strictly 18+. No sale to minors, and we will always call a cab instead of letting someone drive.',
  },
];

export default function About() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Our story</span>
          <h1>Neighbourhood bottles, honestly priced</h1>
          <p>
            Signature Liquor Store is a two-door bottle shop in Nairobi and Kiambu — open every
            hour of every day, with riders who know the estate roads.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="split">
            <div className="split-media">
              <img src="/img/store.webp" alt="A Signature Liquor Store counter" />
              <div className="stamp">
                <b>24 hours</b>
                <span>Both shops</span>
              </div>
            </div>
            <div>
              <span className="eyebrow">How we got here</span>
              <h2>Started behind one counter in Roysambu</h2>
              <p className="lede" style={{ marginTop: 16 }}>
                We opened because the neighbourhood needed something simple: a shop that is always
                open, where the price on the shelf is the price at the till, and where the bottle is
                exactly what the label says.
              </p>
              <p className="lede" style={{ marginTop: 14 }}>
                Enough people agreed that a second door made sense — this time on Kiambu Road in
                Thindigua, serving the estates along that corridor. Same stock, same standard, same
                open sign.
              </p>
              <p className="lede" style={{ marginTop: 14 }}>
                We are not a big chain. The person behind the counter is usually an owner, and if we
                do not have what you want, we will tell you straight and suggest something better.
              </p>
              <div className="mini-stats">
                <div>
                  <b>2</b>
                  <span>Branches</span>
                </div>
                <div>
                  <b>57</b>
                  <span>Google reviews</span>
                </div>
                <div>
                  <b>4.6★</b>
                  <span>Average rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">What we promise</span>
              <h2>Five things we never compromise</h2>
            </div>
          </div>
          <div className="promise-grid">
            {promises.map((promise) => (
              <article className="promise-card" key={promise.title}>
                <h3>{promise.title}</h3>
                <p>{promise.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Come say hello</h2>
              <p>Two doors, both open right now. Or send us the order and stay on the sofa.</p>
            </div>
            <div className="branch-actions">
              <Link to="/stores" className="btn btn-cream">
                Find a branch
              </Link>
              <a href={stores[0].phoneHref} className="btn btn-ghost on-dark">
                Call {stores[0].phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
