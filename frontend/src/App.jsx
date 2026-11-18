import { useEffect } from 'react';
import { Link, useRouter } from './lib/router.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer, { Toast } from './components/CartDrawer.jsx';
import Logo from './components/Logo.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Stores from './pages/Stores.jsx';
import About from './pages/About.jsx';
import Checkout from './pages/Checkout.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { path } = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [path]);

  const productMatch = path.match(/^\/product\/([^/]+)$/);

  let page;
  if (path === '/') page = <Home />;
  else if (path === '/shop') page = <Shop />;
  else if (productMatch) page = <Product slug={decodeURIComponent(productMatch[1])} />;
  else if (path === '/stores') page = <Stores />;
  else if (path === '/about') page = <About />;
  else if (path === '/checkout') page = <Checkout />;
  else if (path === '/admin') page = <Admin />;
  else page = <NotFound />;

  if (path === '/admin') {
    return (
      <>
        <div className="admin-topbar">
          <div className="container admin-topbar-inner">
            <Logo />
            <div>
              <Link to="/" className="btn btn-ghost btn-sm">
                View the shop
              </Link>
            </div>
          </div>
        </div>
        <main>{page}</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>{page}</main>
      <Footer />
      <CartDrawer />
      <Toast />
    </>
  );
}
