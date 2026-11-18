const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const {
  categories,
  areas,
  OTHER_AREA,
  PAYMENT_METHODS,
  ORDER_STATUSES,
  quoteArea,
} = require('./data');
const { pool, query, init, hash } = require('./db');

const PORT = Number(process.env.PORT || 4000);
const SESSION_HOURS = 12;
const COOKIE_NAME = 'sig_admin';

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '100kb' }));

const money = (value) => Math.round(Number(value) || 0);

const toPublicProduct = (row) => ({
  slug: row.slug,
  name: row.name,
  brand: row.brand,
  category: row.category,
  price: row.price,
  was: row.was,
  size: row.size,
  abv: row.abv,
  image: row.image,
  origin: row.origin,
  note: row.note,
  badge: row.badge,
  stock: row.stock,
  available: row.available,
  inStock: row.available && row.stock > 0,
  lowStock: row.available && row.stock > 0 && row.stock <= 6,
  featured: row.featured,
});

const toAdminProduct = (row) => ({
  ...toPublicProduct(row),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const cleanPhone = (value) => String(value || '').replace(/[\s-]/g, '');

function validPhone(value) {
  const phone = cleanPhone(value);
  return /^(\+?254|0)?[17]\d{8}$/.test(phone);
}

function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += alphabet[crypto.randomInt(alphabet.length)];
  return `SIG-${out}`;
}

// ---------------------------------------------------------------- public API

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'database unavailable' });
  }
});

app.get('/api/catalog', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM products WHERE available = true ORDER BY featured DESC, sort_order ASC, name ASC'
    );
    res.json({
      products: rows.map(toPublicProduct),
      categories,
      featured: rows.filter((r) => r.featured).map((r) => r.slug),
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/delivery/areas', (_req, res) => {
  res.json({
    areas: areas.map(({ id, name, note }) => ({ id, name, note })),
    other: OTHER_AREA,
  });
});

app.get('/api/delivery/quote', (req, res) => {
  res.json(quoteArea(String(req.query.area || 'roysambu')));
});

app.post('/api/orders', async (req, res, next) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phone = cleanPhone(body.phone);
  const address = String(body.address || '').trim();
  const notes = String(body.notes || '').trim().slice(0, 500);
  const payment = String(body.payment || 'mpesa');
  const areaId = String(body.areaId || '');
  const lines = Array.isArray(body.lines) ? body.lines : [];

  if (name.length < 2) return res.status(400).json({ error: 'Tell us the name for the order.' });
  if (!validPhone(phone)) {
    return res.status(400).json({ error: 'Use a Kenyan mobile number, e.g. 07XX XXX XXX.' });
  }
  if (address.length < 4) return res.status(400).json({ error: 'Add a delivery address.' });
  if (!PAYMENT_METHODS.includes(payment)) {
    return res.status(400).json({ error: 'Choose M-Pesa, card or cash on delivery.' });
  }
  if (!areas.some((a) => a.id === areaId) && areaId !== OTHER_AREA.id) {
    return res.status(400).json({ error: 'Choose a delivery area.' });
  }
  if (!lines.length) return res.status(400).json({ error: 'Your basket is empty.' });

  const wanted = new Map();
  for (const line of lines) {
    const slug = String(line && line.slug ? line.slug : '');
    const qty = Math.floor(Number(line && line.qty));
    if (!slug || !Number.isFinite(qty) || qty < 1) continue;
    wanted.set(slug, Math.min(24, (wanted.get(slug) || 0) + qty));
  }
  if (!wanted.size) return res.status(400).json({ error: 'Your basket is empty.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const items = [];
    let subtotal = 0;

    for (const [slug, qty] of wanted) {
      const { rows } = await client.query('SELECT * FROM products WHERE slug = $1 FOR UPDATE', [
        slug,
      ]);
      const product = rows[0];
      if (!product || !product.available) {
        await client.query('ROLLBACK');
        return res
          .status(409)
          .json({ error: 'One of those bottles is no longer on the shelf. Refresh and try again.' });
      }
      if (product.stock < qty) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Only ${product.stock} left of ${product.name}. Adjust the basket and try again.`,
        });
      }
      subtotal += product.price * qty;
      items.push({ product, qty });
    }

    const quote = quoteArea(areaId);
    const areaName = areaId === OTHER_AREA.id ? OTHER_AREA.name : areas.find((a) => a.id === areaId).name;
    const total = subtotal + quote.fee;
    const reference = makeReference();

    const order = await client.query(
      `INSERT INTO orders
        (reference, customer_name, phone, address, area_id, area_name, notes, payment,
         subtotal, delivery_fee, total, branch, distance_km, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new')
       RETURNING id, created_at`,
      [
        reference,
        name,
        phone,
        address,
        areaId,
        areaName,
        notes || null,
        payment,
        subtotal,
        quote.fee,
        total,
        quote.branch,
        quote.km,
      ]
    );

    for (const { product, qty } of items) {
      await client.query(
        `INSERT INTO order_items (order_id, slug, name, size, price, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.rows[0].id, product.slug, product.name, product.size, product.price, qty]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE slug = $2', [
        qty,
        product.slug,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({
      reference,
      createdAt: order.rows[0].created_at,
      subtotal,
      deliveryFee: quote.fee,
      total,
      area: areaName,
      branch: quote.branch,
      distanceKm: quote.km,
      payment,
      items: items.map(({ product, qty }) => ({
        name: product.name,
        size: product.size,
        price: product.price,
        qty,
      })),
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

app.post('/api/subscribe', async (req, res, next) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Use a valid email address.' });
  }
  try {
    await query('INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [
      email,
    ]);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------- admin auth

const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function noteFailure(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return;
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    });
  return out;
}

async function currentSession(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  const { rows } = await query(
    'SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = $1',
    [hash(token)]
  );
  if (!rows.length) return null;
  if (new Date(rows[0].expires_at).getTime() < Date.now()) {
    await query('DELETE FROM admin_sessions WHERE token_hash = $1', [hash(token)]);
    return null;
  }
  return rows[0];
}

async function requireAdmin(req, res, next) {
  try {
    const session = await currentSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in with the staff code.' });
    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}

app.post('/api/admin/login', async (req, res, next) => {
  const ip = req.ip || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }
  const code = String((req.body && req.body.code) || '').trim();
  if (!code) return res.status(400).json({ error: 'Enter the staff code.' });

  try {
    const { rows } = await query("SELECT value FROM settings WHERE key = 'admin_code_hash'");
    if (!rows.length || rows[0].value !== hash(code)) {
      noteFailure(ip);
      return res.status(401).json({ error: 'That code is not right.' });
    }
    loginAttempts.delete(ip);

    const token = crypto.randomBytes(32).toString('hex');
    await query('DELETE FROM admin_sessions WHERE expires_at < now()');
    await query(
      'INSERT INTO admin_sessions (token_hash, expires_at) VALUES ($1, now() + interval \'1 hour\' * $2)',
      [hash(token), SESSION_HOURS]
    );
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}`
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/logout', async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (token) await query('DELETE FROM admin_sessions WHERE token_hash = $1', [hash(token)]);
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/me', async (req, res, next) => {
  try {
    const session = await currentSession(req);
    res.json({ authenticated: Boolean(session), expiresAt: session ? session.expires_at : null });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/code', requireAdmin, async (req, res, next) => {
  const nextCode = String((req.body && req.body.code) || '').trim();
  if (nextCode.length < 8) {
    return res.status(400).json({ error: 'Use at least 8 characters for the staff code.' });
  }
  try {
    await query(
      `INSERT INTO settings (key, value) VALUES ('admin_code_hash', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [hash(nextCode)]
    );
    await query('DELETE FROM admin_sessions WHERE token_hash <> $1', [req.session.token_hash]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------------- admin dashboard

app.get('/api/admin/products', requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM products ORDER BY sort_order ASC, name ASC'
    );
    res.json({ products: rows.map(toAdminProduct), categories });
  } catch (err) {
    next(err);
  }
});

const PRODUCT_COLUMNS = {
  name: 'name',
  brand: 'brand',
  category: 'category',
  price: 'price',
  was: 'was',
  size: 'size',
  abv: 'abv',
  image: 'image',
  origin: 'origin',
  note: 'note',
  badge: 'badge',
  stock: 'stock',
  available: 'available',
  featured: 'featured',
  sortOrder: 'sort_order',
};

function validateProductInput(input, { partial = false } = {}) {
  const errors = [];
  const out = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);

  if (!partial || has('name')) {
    const name = String(input.name || '').trim();
    if (name.length < 2) errors.push('Name is required.');
    else out.name = name.slice(0, 120);
  }
  if (!partial || has('brand')) {
    const brand = String(input.brand || '').trim();
    if (!brand) errors.push('Brand is required.');
    else out.brand = brand.slice(0, 80);
  }
  if (!partial || has('category')) {
    const category = String(input.category || '').trim();
    if (!categories.some((c) => c.id === category)) errors.push('Choose a valid category.');
    else out.category = category;
  }
  if (!partial || has('price')) {
    const price = Number(input.price);
    if (!Number.isFinite(price) || price <= 0) errors.push('Price must be a positive number.');
    else out.price = Math.round(price);
  }
  if (has('was')) {
    const was = input.was === '' || input.was === null ? null : Number(input.was);
    if (was !== null && (!Number.isFinite(was) || was <= 0)) errors.push('"Was" price is invalid.');
    else out.was = was === null ? null : Math.round(was);
  }
  if (has('stock')) {
    const stock = Number(input.stock);
    if (!Number.isFinite(stock) || stock < 0) errors.push('Stock must be zero or more.');
    else out.stock = Math.floor(stock);
  }
  if (has('image')) {
    const image = String(input.image || '').trim();
    if (!image) errors.push('Image path is required.');
    else out.image = image.slice(0, 300);
  }
  if (has('size')) out.size = String(input.size || '').trim().slice(0, 40) || null;
  if (has('abv')) out.abv = String(input.abv || '').trim().slice(0, 40) || null;
  if (has('origin')) out.origin = String(input.origin || '').trim().slice(0, 80) || null;
  if (has('note')) out.note = String(input.note || '').trim().slice(0, 400) || null;
  if (has('badge')) {
    const badge = String(input.badge || '').trim();
    out.badge = ['Deal', 'New', 'Signature Pick'].includes(badge) ? badge : null;
  }
  if (has('available')) out.available = Boolean(input.available);
  if (has('featured')) out.featured = Boolean(input.featured);
  if (has('sortOrder')) {
    const sortOrder = Number(input.sortOrder);
    if (Number.isFinite(sortOrder)) out.sortOrder = Math.floor(sortOrder);
  }

  return { errors, values: out };
}

app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
  const { errors, values } = validateProductInput(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors[0] });

  try {
    let base = slugify(req.body.slug || values.name);
    if (!base) return res.status(400).json({ error: 'Could not build a product link.' });
    let slug = base;
    let suffix = 2;
    // eslint-disable-next-line no-await-in-loop
    while ((await query('SELECT 1 FROM products WHERE slug = $1', [slug])).rowCount) {
      slug = `${base}-${suffix++}`;
    }

    const maxOrder = await query('SELECT COALESCE(MAX(sort_order), 0) AS max FROM products');
    const sortOrder = values.sortOrder ?? maxOrder.rows[0].max + 1;

    const { rows } = await query(
      `INSERT INTO products
        (slug, name, brand, category, price, was, size, abv, image, origin, note, badge, stock, available, featured, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        slug,
        values.name,
        values.brand,
        values.category,
        values.price,
        values.was ?? null,
        values.size ?? null,
        values.abv ?? null,
        values.image,
        values.origin ?? null,
        values.note ?? null,
        values.badge ?? null,
        values.stock ?? 0,
        values.available !== false,
        Boolean(values.featured),
        sortOrder,
      ]
    );
    res.status(201).json({ product: toAdminProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/admin/products/:slug', requireAdmin, async (req, res, next) => {
  const { errors, values } = validateProductInput(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors[0] });

  const sets = [];
  const params = [];
  Object.entries(values).forEach(([key, value]) => {
    params.push(value);
    sets.push(`${PRODUCT_COLUMNS[key]} = $${params.length}`);
  });
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });

  params.push(req.params.slug);
  try {
    const { rows } = await query(
      `UPDATE products SET ${sets.join(', ')}, updated_at = now()
       WHERE slug = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: toAdminProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/products/:slug', requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM products WHERE slug = $1', [req.params.slug]);
    if (!rowCount) return res.status(404).json({ error: 'Product not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/images', requireAdmin, (_req, res) => {
  const dir = path.join(__dirname, '..', '..', 'frontend', 'public', 'img');
  fs.readdir(dir, (err, files) => {
    if (err) return res.json({ images: [] });
    res.json({ images: files.filter((f) => /\.(webp|png|jpe?g|svg)$/i.test(f)).map((f) => `/img/${f}`) });
  });
});

app.get('/api/admin/orders', requireAdmin, async (req, res, next) => {
  const status = String(req.query.status || '').trim();
  try {
    const params = [];
    let where = '';
    if (ORDER_STATUSES.includes(status)) {
      params.push(status);
      where = 'WHERE o.status = $1';
    }
    const { rows } = await query(
      `SELECT o.*, COALESCE(
         json_agg(json_build_object('name', i.name, 'size', i.size, 'price', i.price, 'qty', i.qty)
                  ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 200`,
      params
    );
    res.json({
      orders: rows.map((row) => ({
        id: row.id,
        reference: row.reference,
        customerName: row.customer_name,
        phone: row.phone,
        address: row.address,
        areaName: row.area_name,
        notes: row.notes,
        payment: row.payment,
        subtotal: row.subtotal,
        deliveryFee: row.delivery_fee,
        total: row.total,
        branch: row.branch,
        distanceKm: row.distance_km === null ? null : Number(row.distance_km),
        status: row.status,
        createdAt: row.created_at,
        items: row.items,
      })),
      statuses: ORDER_STATUSES,
    });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res, next) => {
  const status = String((req.body && req.body.status) || '');
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Unknown order status.' });
  }
  try {
    const { rows } = await query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status',
      [status, Number(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
    res.json({ ok: true, status: rows[0].status });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/orders/:id', requireAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [
      Number(req.params.id),
    ]);
    const order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cancel the order before deleting it.' });
    }
    // A cancelled order goes back on the shelf.
    const items = await client.query('SELECT slug, qty FROM order_items WHERE order_id = $1', [
      order.id,
    ]);
    for (const item of items.rows) {
      await client.query('UPDATE products SET stock = stock + $1 WHERE slug = $2', [
        item.qty,
        item.slug,
      ]);
    }
    await client.query('DELETE FROM orders WHERE id = $1', [order.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

app.get('/api/admin/stats', requireAdmin, async (_req, res, next) => {
  try {
    const totals = await query(
      `SELECT
         COUNT(*)::int AS orders,
         COUNT(*) FILTER (WHERE status IN ('new','confirmed','dispatched'))::int AS open_orders,
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_orders,
         COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::int AS revenue,
         COALESCE(SUM(total) FILTER (WHERE created_at >= now() - interval '24 hours' AND status <> 'cancelled'), 0)::int AS revenue_24h
       FROM orders`
    );
    const stock = await query(
      `SELECT
         COUNT(*)::int AS products,
         COUNT(*) FILTER (WHERE available)::int AS available,
         COUNT(*) FILTER (WHERE available AND stock = 0)::int AS out_of_stock,
         COUNT(*) FILTER (WHERE available AND stock > 0 AND stock <= 6)::int AS low_stock
       FROM products`
    );
    const subscribers = await query('SELECT COUNT(*)::int AS count FROM subscribers');
    res.json({
      orders: totals.rows[0],
      products: stock.rows[0],
      subscribers: subscribers.rows[0].count,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/subscribers', requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT email, created_at FROM subscribers ORDER BY created_at DESC');
    res.json({ subscribers: rows });
  } catch (err) {
    next(err);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[api] error', err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[api] Signature Liquor Store API listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[api] failed to start', err);
    process.exit(1);
  });
