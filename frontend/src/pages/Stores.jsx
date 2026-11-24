import { areas, feeTable, otherArea, quoteArea } from '../lib/delivery.js';
import { stores } from '../data/stores.js';

export default function Stores() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Find us</span>
          <h1>Two branches, both open 24 hours</h1>
          <p>
            Walk in, call, or send the order on WhatsApp. We also deliver across Roysambu, Kahawa,
            Ridgeways, Kasarani and along Kiambu Road.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="branch-grid">
            {stores.map((store) => (
              <article className="branch-card" id={store.id} key={store.id}>
                <div className="branch-top">
                  <div>
                    <span className="eyebrow">{store.label}</span>
                    <h3 style={{ marginTop: 6 }}>{store.name}</h3>
                  </div>
                  <span className="branch-rating">
                    <i>★</i> {store.rating} ({store.reviews} reviews)
                  </span>
                </div>
                <div className="branch-row">
                  <span>Address</span>
                  <span>{store.address}</span>
                </div>
                <div className="branch-row">
                  <span>Landmark</span>
                  <span>{store.area}</span>
                </div>
                <div className="branch-row">
                  <span>Hours</span>
                  <span>
                    <span className="open-pill">Open now</span> · {store.hours}
                  </span>
                </div>
                <div className="branch-row">
                  <span>Phone</span>
                  <span>
                    <a href={store.phoneHref} style={{ borderBottom: '1px solid var(--line)' }}>
                      {store.phone}
                    </a>
                  </span>
                </div>
                <div className="branch-row">
                  <span>Delivery</span>
                  <span>Same-day riders · 30–60 minutes typical</span>
                </div>
                <p className="branch-note">{store.note}</p>
                <div className="branch-actions">
                  <a
                    href={store.mapsUrl}
                    className="btn btn-primary btn-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    className="btn btn-ghost btn-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp this branch
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="fee-table-wrap">
            <span className="eyebrow wine">Delivery fees</span>
            <h2 style={{ fontSize: 28, margin: '8px 0 6px' }}>How the rider fee is worked out</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 620 }}>
              We measure the straight-line distance from whichever shop is closer to you. The first
              3 km is KSh 100; after that it is KSh 50 for every extra 3 km, capped at KSh 600. You
              always see the fee before you pay.
            </p>
            <table className="fee-table">
              <thead>
                <tr>
                  <th scope="col">Distance from shop</th>
                  <th scope="col">Delivery fee</th>
                  <th scope="col">Typical area</th>
                </tr>
              </thead>
              <tbody>
                {feeTable.map((row) => (
                  <tr key={row.range}>
                    <td>{row.range}</td>
                    <td>
                      <b>KSh {row.fee}</b>
                    </td>
                    <td>{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fine">
              Orders far outside these bands are quoted on the phone. Fees are per trip, not per
              bottle — one KSh 100 fee covers the whole order.
            </p>
          </div>

          <div className="delivery-grid">
            <div>
              <span className="eyebrow">Delivery area</span>
              <h2 style={{ fontSize: 28, margin: '8px 0 6px' }}>Where the riders go</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Same-day delivery from whichever branch is closer to you. Orders placed before 10pm
                usually arrive within the hour; later orders still go out, sometimes a little
                slower.
              </p>
              <ul className="area-list" style={{ marginTop: 22 }}>
                {areas.map((area) => (
                  <li key={area.id}>
                    {area.name} <b>KSh {quoteArea(area.id).fee}</b>
                  </li>
                ))}
                <li>
                  {otherArea.name} <b>On call</b>
                </li>
              </ul>
            </div>
            <div className="map-embed">
              <iframe
                title="Signature Liquor Store branches — Roysambu and Thindigua"
                src="https://www.openstreetmap.org/export/embed.html?bbox=36.820%2C-1.245%2C36.915%2C-1.180&amp;layer=mapnik&amp;marker=-1.2160%2C36.8888"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="delivery-facts">
              <div>
                <b>KSh 100</b>
                <span>Within 3 km of either shop</span>
              </div>
              <div>
                <b>+ KSh 50</b>
                <span>For every extra 3 km</span>
              </div>
              <div>
                <b>Max KSh 600</b>
                <span>Anywhere we deliver</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
