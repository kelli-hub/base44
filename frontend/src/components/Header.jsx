import { useEffect, useState } from 'react';
import { Link, useRouter } from '../lib/router.jsx';
import { navItems, stores } from '../data/stores.js';
import { useCart } from '../context/Cart.jsx';
import Logo from './Logo.jsx';

export default function Header() {
  const { count, openDrawer } = useCart();
  const { path, search } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [path, search.cat]);

  const isActive = (item) =>
    item.cat
      ? path === '/shop' && search.cat === item.cat
      : path === '/shop' && !search.cat;

  return (
    <>
      <div className="announce">
        Same-day delivery in Nairobi &amp; Kiambu · <strong>From KSh 100</strong> · Order online
        or on WhatsApp
      </div>
      <header className="header">
        <div className="container header-inner">
          <Logo />
          <nav className="nav" aria-label="Main">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to="/shop"
                search={item.cat ? { cat: item.cat } : {}}
                className={isActive(item) ? 'active' : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/stores" className={path === '/stores' ? 'active' : undefined}>
              Our stores
            </Link>
          </nav>
          <div className="header-actions">
            <a
              className="btn btn-ghost btn-sm header-phone"
              href={stores[0].phoneHref}
              style={{ textTransform: 'none', letterSpacing: '0.02em' }}
            >
              {stores[0].phone}
            </a>
            <button className="icon-btn" onClick={openDrawer} aria-label={`Open cart, ${count} items`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
            <button
              className="icon-btn burger"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              ☰
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="container">
            {navItems.map((item) => (
              <Link key={item.label} to="/shop" search={item.cat ? { cat: item.cat } : {}}>
                {item.label}
              </Link>
            ))}
            <Link to="/stores">Our stores</Link>
            <Link to="/about">About us</Link>
            <Link to="/checkout">Checkout</Link>
          </div>
        </div>
      </header>
    </>
  );
}
