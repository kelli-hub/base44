import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../context/Catalog.jsx';
import { formatDate, money } from '../lib/format.js';

const STATUS_LABELS = {
  new: 'New',
  confirmed: 'Confirmed',
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const BADGES = ['', 'Signature Pick', 'Deal', 'New'];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const error = new Error((data && data.error) || 'That request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function LoginCard({ onSignedIn }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ code }) });
      onSignedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={submit}>
        <span className="eyebrow wine">Staff only</span>
        <h1>Shop dashboard</h1>
        <p>
          Enter the unique staff code to manage the shelves and see the orders placed on the public
          site.
        </p>
        <label>
          Staff code
          <input
            type="password"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter your code"
            required
            autoFocus
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Checking…' : 'Open dashboard'}
        </button>
        <p className="fine">Forgotten the code? Ask the shop owner to reset it.</p>
      </form>
    </div>
  );
}

function Stats({ stats }) {
  if (!stats) return null;
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <span>Orders</span>
        <b>{stats.orders.orders}</b>
        <small>{stats.orders.open_orders} still open</small>
      </div>
      <div className="stat-card">
        <span>Sales</span>
        <b>{money(stats.orders.revenue)}</b>
        <small>{money(stats.orders.revenue_24h)} in the last 24 h</small>
      </div>
      <div className="stat-card">
        <span>On the shelf</span>
        <b>{stats.products.available}</b>
        <small>
          {stats.products.out_of_stock} sold out · {stats.products.low_stock} running low
        </small>
      </div>
      <div className="stat-card">
        <span>Newsletter</span>
        <b>{stats.subscribers}</b>
        <small>subscribers</small>
      </div>
    </div>
  );
}

function OrdersPanel({ orders, loading, onStatusChange, onDeleteOrder }) {
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter]
  );

  const change = async (order, status) => {
    setBusyId(order.id);
    await onStatusChange(order.id, status);
    setBusyId(null);
  };

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <div>
          <h2>Orders from the public site</h2>
          <p>Every checkout lands here. Update the status as the rider moves.</p>
        </div>
        <label className="admin-filter">
          <span>Show</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All orders</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="admin-empty">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">No orders here yet. New checkouts appear the moment they are placed.</p>
      ) : (
        <div className="admin-orders">
          {visible.map((order) => (
            <article className="admin-order" key={order.id}>
              <header>
                <div>
                  <b>{order.reference}</b>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <span className={`status-badge status-${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </header>
              <div className="admin-order-grid">
                <div>
                  <span>Customer</span>
                  <b>{order.customerName}</b>
                  <small>{order.phone}</small>
                </div>
                <div>
                  <span>Deliver to</span>
                  <b>{order.areaName}</b>
                  <small>{order.address}</small>
                </div>
                <div>
                  <span>Rider</span>
                  <b>{order.branch || 'To confirm'}</b>
                  <small>
                    {order.distanceKm !== null ? `${order.distanceKm} km` : 'Distance on call'} ·{' '}
                    {order.payment === 'cash' ? 'Cash on delivery' : order.payment === 'card' ? 'Card link' : 'M-Pesa'}
                  </small>
                </div>
                <div>
                  <span>Total</span>
                  <b>{money(order.total)}</b>
                  <small>
                    {money(order.subtotal)} + {money(order.deliveryFee)} delivery
                  </small>
                </div>
              </div>
              <ul className="admin-order-items">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    <span>{item.qty}×</span> {item.name} <small>{item.size}</small>
                    <b>{money(item.price * item.qty)}</b>
                  </li>
                ))}
              </ul>
              {order.notes && <p className="admin-order-note">Rider note: {order.notes}</p>}
              <footer>
                <label className="admin-filter">
                  <span>Status</span>
                  <select
                    value={order.status}
                    disabled={busyId === order.id}
                    onChange={(event) => change(order, event.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="admin-order-actions">
                  <a className="btn btn-ghost btn-sm" href={`tel:${order.phone}`}>
                    Call {order.phone}
                  </a>
                  {order.status === 'cancelled' && (
                    <button
                      className={`btn btn-ghost btn-sm ${pendingDelete === order.id ? 'danger' : ''}`}
                      onClick={() => {
                        if (pendingDelete === order.id) {
                          setPendingDelete(null);
                          onDeleteOrder(order.id);
                        } else {
                          setPendingDelete(order.id);
                        }
                      }}
                    >
                      {pendingDelete === order.id ? 'Confirm delete' : 'Delete'}
                    </button>
                  )}
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const blankProduct = {
  name: '',
  brand: '',
  category: 'whisky',
  price: '',
  was: '',
  size: '750ml',
  abv: '',
  origin: '',
  note: '',
  badge: '',
  stock: '',
  image: '/img/jwblack.webp',
  available: true,
  featured: false,
};

function ProductsPanel({ products, categories, images, onSave, onDelete, onCreated }) {
  const [drafts, setDrafts] = useState({});
  const [savingSlug, setSavingSlug] = useState(null);
  const [message, setMessage] = useState(null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState(blankProduct);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [creatingBusy, setCreatingBusy] = useState(false);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        products.map((product) => [
          product.slug,
          {
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: String(product.price),
            was: product.was ? String(product.was) : '',
            stock: String(product.stock),
            badge: product.badge || '',
            available: product.available,
            featured: product.featured,
            image: product.image,
            note: product.note || '',
            size: product.size || '',
            abv: product.abv || '',
            origin: product.origin || '',
          },
        ])
      )
    );
  }, [products]);

  const visible = products.filter((product) =>
    `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const update = (slug, patch) =>
    setDrafts((current) => ({ ...current, [slug]: { ...current[slug], ...patch } }));

  const save = async (slug) => {
    setSavingSlug(slug);
    setMessage(null);
    try {
      await onSave(slug, drafts[slug]);
      setMessage({ ok: true, text: 'Saved — the public site is updated.' });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSavingSlug(null);
    }
  };

  const toggleAvailable = async (product) => {
    setSavingSlug(product.slug);
    setMessage(null);
    try {
      await onSave(product.slug, { available: !product.available });
      setMessage({
        ok: true,
        text: product.available ? `${product.name} is now hidden from the shop.` : `${product.name} is back on the shop.`,
      });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSavingSlug(null);
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setCreatingBusy(true);
    setMessage(null);
    try {
      const created = await onCreated({
        ...newProduct,
        price: Number(newProduct.price),
        was: newProduct.was === '' ? null : Number(newProduct.was),
        stock: Number(newProduct.stock || 0),
      });
      setNewProduct(blankProduct);
      setCreating(false);
      setMessage({ ok: true, text: `${created.name} is live on the shop.` });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setCreatingBusy(false);
    }
  };

  const remove = async (slug) => {
    if (pendingDelete !== slug) {
      setPendingDelete(slug);
      return;
    }
    setPendingDelete(null);
    setSavingSlug(slug);
    try {
      await onDelete(slug);
      setMessage({ ok: true, text: 'Removed from the shop.' });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <div>
          <h2>What is on the public shelf</h2>
          <p>Change prices, stock and availability — the storefront follows immediately.</p>
        </div>
        <div className="admin-tools">
          <input
            className="search-input"
            type="search"
            placeholder="Find a bottle…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Find a product"
          />
          <button className="btn btn-primary btn-sm" onClick={() => setCreating((value) => !value)}>
            {creating ? 'Close' : '+ New bottle'}
          </button>
        </div>
      </div>

      {message && <p className={`admin-message ${message.ok ? 'ok' : 'error'}`}>{message.text}</p>}

      {creating && (
        <form className="admin-new" onSubmit={create}>
          <h3>Add a bottle</h3>
          <div className="admin-form-grid">
            <label>
              Name
              <input
                required
                value={newProduct.name}
                onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })}
              />
            </label>
            <label>
              Brand
              <input
                required
                value={newProduct.brand}
                onChange={(event) => setNewProduct({ ...newProduct, brand: event.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={newProduct.category}
                onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price (KSh)
              <input
                type="number"
                min="1"
                required
                value={newProduct.price}
                onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })}
              />
            </label>
            <label>
              Was price (optional)
              <input
                type="number"
                min="1"
                value={newProduct.was}
                onChange={(event) => setNewProduct({ ...newProduct, was: event.target.value })}
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={newProduct.stock}
                onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })}
              />
            </label>
            <label>
              Size
              <input
                value={newProduct.size}
                onChange={(event) => setNewProduct({ ...newProduct, size: event.target.value })}
              />
            </label>
            <label>
              Strength
              <input
                placeholder="40%"
                value={newProduct.abv}
                onChange={(event) => setNewProduct({ ...newProduct, abv: event.target.value })}
              />
            </label>
            <label>
              Origin
              <input
                placeholder="Scotland"
                value={newProduct.origin}
                onChange={(event) => setNewProduct({ ...newProduct, origin: event.target.value })}
              />
            </label>
            <label>
              Badge
              <select
                value={newProduct.badge}
                onChange={(event) => setNewProduct({ ...newProduct, badge: event.target.value })}
              >
                {BADGES.map((badge) => (
                  <option value={badge} key={badge || 'none'}>
                    {badge || 'No badge'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Photo
              <select
                value={newProduct.image}
                onChange={(event) => setNewProduct({ ...newProduct, image: event.target.value })}
              >
                {images.map((image) => (
                  <option value={image} key={image}>
                    {image.replace('/img/', '')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Featured on the home page
              <select
                value={newProduct.featured ? 'yes' : 'no'}
                onChange={(event) =>
                  setNewProduct({ ...newProduct, featured: event.target.value === 'yes' })
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
          <label className="admin-full">
            Shelf note
            <textarea
              rows={2}
              placeholder="Twelve-year blended Scotch. Smoke, dark fruit and a long, smooth finish."
              value={newProduct.note}
              onChange={(event) => setNewProduct({ ...newProduct, note: event.target.value })}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={creatingBusy}>
            {creatingBusy ? 'Adding…' : 'Add to the shop'}
          </button>
        </form>
      )}

      <div className="admin-products">
        <div className="admin-products-head">
          <span>Bottle</span>
          <span>Price</span>
          <span>Was</span>
          <span>Stock</span>
          <span>Badge</span>
          <span>Live</span>
          <span>Featured</span>
          <span />
        </div>
        {visible.map((product) => {
          const draft = drafts[product.slug] || {};
          const busy = savingSlug === product.slug;
          return (
            <div className="admin-product" key={product.slug}>
              <div className="admin-product-name">
                <img src={product.image} alt="" />
                <div>
                  <b>{draft.name || product.name}</b>
                  <small>
                    {product.brand} · {product.category} · {product.slug}
                  </small>
                </div>
              </div>
              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="1"
                  value={draft.price ?? ''}
                  onChange={(event) => update(product.slug, { price: event.target.value })}
                />
              </label>
              <label>
                <span>Was</span>
                <input
                  type="number"
                  min="1"
                  value={draft.was ?? ''}
                  onChange={(event) => update(product.slug, { was: event.target.value })}
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  value={draft.stock ?? ''}
                  onChange={(event) => update(product.slug, { stock: event.target.value })}
                />
              </label>
              <label>
                <span>Badge</span>
                <select
                  value={draft.badge ?? ''}
                  onChange={(event) => update(product.slug, { badge: event.target.value })}
                >
                  {BADGES.map((badge) => (
                    <option value={badge} key={badge || 'none'}>
                      {badge || 'None'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-check">
                <span>Live</span>
                <input
                  type="checkbox"
                  checked={Boolean(draft.available)}
                  onChange={() => toggleAvailable(product)}
                />
              </label>
              <label className="admin-check">
                <span>Featured</span>
                <input
                  type="checkbox"
                  checked={Boolean(draft.featured)}
                  onChange={(event) => update(product.slug, { featured: event.target.checked })}
                />
              </label>
              <div className="admin-product-actions">
                <button className="btn btn-primary btn-sm" onClick={() => save(product.slug)} disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button
                  className={`btn btn-ghost btn-sm ${pendingDelete === product.slug ? 'danger' : ''}`}
                  onClick={() => remove(product.slug)}
                  disabled={busy}
                >
                  {pendingDelete === product.slug ? 'Confirm' : 'Remove'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodePanel({ onChanged }) {
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (code !== confirm) {
      setMessage({ ok: false, text: 'The two codes do not match.' });
      return;
    }
    setBusy(true);
    try {
      await api('/api/admin/code', { method: 'POST', body: JSON.stringify({ code }) });
      setCode('');
      setConfirm('');
      setMessage({ ok: true, text: 'Staff code changed. Use the new code next time you sign in.' });
      onChanged();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card admin-code">
      <h2>Access code</h2>
      <p>
        This code is the only way into the dashboard. Use at least 8 characters, and share it only
        with staff you trust.
      </p>
      <form onSubmit={submit}>
        <label>
          New staff code
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Repeat the code
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {message && <p className={`admin-message ${message.ok ? 'ok' : 'error'}`}>{message.text}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Saving…' : 'Change code'}
        </button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { refresh: refreshCatalog } = useCatalog();
  const [auth, setAuth] = useState('checking');
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, productData, statData, imageData] = await Promise.all([
        api('/api/admin/orders'),
        api('/api/admin/products'),
        api('/api/admin/stats'),
        api('/api/admin/images'),
      ]);
      setOrders(orderData.orders);
      setProducts(productData.products);
      setCategories(productData.categories);
      setStats(statData);
      setImages(imageData.images.length ? imageData.images : ['/img/jwblack.webp']);
      setAuth('in');
      setNotice(null);
    } catch (err) {
      if (err.status === 401) {
        setAuth('out');
      } else {
        setNotice(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api('/api/admin/me')
      .then((data) => {
        if (!active) return;
        if (data.authenticated) loadAll();
        else setAuth('out');
      })
      .catch(() => active && setAuth('out'));
    return () => {
      active = false;
    };
  }, [loadAll]);

  const logout = async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuth('out');
    setOrders([]);
    setProducts([]);
    setStats(null);
  };

  const changeStatus = async (id, status) => {
    const previous = orders;
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    try {
      await api(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const statData = await api('/api/admin/stats');
      setStats(statData);
    } catch (err) {
      setOrders(previous);
      setNotice(err.message);
    }
  };

  const saveProduct = async (slug, patch) => {
    const payload = { ...patch };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.was !== undefined) payload.was = payload.was === '' ? null : Number(payload.was);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    const data = await api(`/api/admin/products/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setProducts((current) =>
      current.map((product) => (product.slug === slug ? { ...product, ...data.product } : product))
    );
    const statData = await api('/api/admin/stats');
    setStats(statData);
    refreshCatalog();
  };

  const createProduct = async (payload) => {
    const data = await api('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setProducts((current) => [...current, data.product]);
    const statData = await api('/api/admin/stats');
    setStats(statData);
    refreshCatalog();
    return data.product;
  };

  const deleteOrder = async (id) => {
    try {
      await api(`/api/admin/orders/${id}`, { method: 'DELETE' });
      setOrders((current) => current.filter((order) => order.id !== id));
      const [statData, productData] = await Promise.all([
        api('/api/admin/stats'),
        api('/api/admin/products'),
      ]);
      setStats(statData);
      setProducts(productData.products);
    } catch (err) {
      setNotice(err.message);
    }
  };

  const deleteProduct = async (slug) => {
    await api(`/api/admin/products/${slug}`, { method: 'DELETE' });
    setProducts((current) => current.filter((product) => product.slug !== slug));
    const statData = await api('/api/admin/stats');
    setStats(statData);
    refreshCatalog();
  };

  if (auth === 'checking') {
    return (
      <div className="container section">
        <p className="admin-empty">Checking your session…</p>
      </div>
    );
  }

  if (auth === 'out') {
    return (
      <div className="container">
        <LoginCard onSignedIn={loadAll} />
      </div>
    );
  }

  return (
    <div className="container section admin-shell">
      <div className="admin-head">
        <div>
          <span className="eyebrow wine">Signature Liquor Store</span>
          <h1>Shop dashboard</h1>
          <p>Manage the public shelf and follow every order from checkout to delivery.</p>
        </div>
        <div className="admin-head-actions">
          <button className="btn btn-ghost btn-sm" onClick={loadAll} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {notice && <p className="admin-message error">{notice}</p>}

      <Stats stats={stats} />

      <div className="admin-tabs" role="tablist">
        <button
          className={tab === 'orders' ? 'active' : ''}
          onClick={() => setTab('orders')}
          role="tab"
          aria-selected={tab === 'orders'}
        >
          Orders <span>{orders.filter((order) => order.status === 'new').length || ''}</span>
        </button>
        <button
          className={tab === 'products' ? 'active' : ''}
          onClick={() => setTab('products')}
          role="tab"
          aria-selected={tab === 'products'}
        >
          Products <span>{products.length}</span>
        </button>
        <button
          className={tab === 'code' ? 'active' : ''}
          onClick={() => setTab('code')}
          role="tab"
          aria-selected={tab === 'code'}
        >
          Access code
        </button>
      </div>

      {tab === 'orders' && (
        <OrdersPanel
          orders={orders}
          loading={loading}
          onStatusChange={changeStatus}
          onDeleteOrder={deleteOrder}
        />
      )}
      {tab === 'products' && (
        <ProductsPanel
          products={products}
          categories={categories}
          images={images}
          onSave={saveProduct}
          onDelete={deleteProduct}
          onCreated={createProduct}
        />
      )}
      {tab === 'code' && <CodePanel onChanged={() => setNotice(null)} />}
    </div>
  );
}
