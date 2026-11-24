import { Link } from '../lib/router.jsx';
import { stores } from '../data/stores.js';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="footer-about">
              Signature Liquor Store is a family-run bottle shop with two doors — Roysambu in
              Nairobi and Thindigua on Kiambu Road. Genuine stock, honest prices, cold beer and
              late-night delivery.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All products</Link></li>
              <li><Link to="/shop" search={{ cat: 'whisky' }}>Whisky</Link></li>
              <li><Link to="/shop" search={{ cat: 'wine' }}>Wine</Link></li>
              <li><Link to="/shop" search={{ cat: 'beer' }}>Beer</Link></li>
              <li><Link to="/shop" search={{ cat: 'cognac' }}>Cognac</Link></li>
            </ul>
          </div>
          <div>
            <h4>Visit</h4>
            <ul>
              <li><Link to="/stores">Roysambu branch</Link></li>
              <li><Link to="/stores">Thindigua branch</Link></li>
              <li><Link to="/stores">Opening hours</Link></li>
              <li><Link to="/about">About us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Talk to us</h4>
            <ul>
              <li><a href={stores[0].phoneHref}>{stores[0].phone} · Roysambu</a></li>
              <li><a href={stores[1].phoneHref}>{stores[1].phone} · Thindigua</a></li>
              <li><a href="https://wa.me/254702432522">WhatsApp your order</a></li>
              <li>Open 24 hours, every day</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Signature Liquor Store · Nairobi &amp; Kiambu, Kenya</span>
          <span className="age-note">
            18+ · Drink responsibly · <Link to="/admin" className="staff-link">Staff access</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
