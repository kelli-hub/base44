const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://signature:signature@localhost:5432/signature',
});

const DEFAULT_ADMIN_CODE = 'SIG-ADMIN-2026';

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function waitForDatabase(attempts = 40) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      was INTEGER,
      size TEXT,
      abv TEXT,
      image TEXT NOT NULL,
      origin TEXT,
      note TEXT,
      badge TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      available BOOLEAN NOT NULL DEFAULT true,
      featured BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      area_id TEXT,
      area_name TEXT,
      notes TEXT,
      payment TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL,
      total INTEGER NOT NULL,
      branch TEXT,
      distance_km NUMERIC(6, 1),
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT,
      price INTEGER NOT NULL,
      qty INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function seed() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM products');
  if (rows[0].count === 0) {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'catalog.json'), 'utf8')
    );
    let order = 0;
    for (const p of catalog) {
      await query(
        `INSERT INTO products
          (slug, name, brand, category, price, was, size, abv, image, origin, note, badge, stock, available, featured, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.slug,
          p.name,
          p.brand,
          p.category,
          p.price,
          p.was ?? null,
          p.size ?? null,
          p.abv ?? null,
          p.image,
          p.origin ?? null,
          p.note ?? null,
          p.badge ?? null,
          p.stock ?? 0,
          p.available !== false,
          Boolean(p.featured),
          order++,
        ]
      );
    }
  }

  const code = await query("SELECT value FROM settings WHERE key = 'admin_code_hash'");
  if (code.rowCount === 0) {
    const initial = process.env.ADMIN_ACCESS_CODE || DEFAULT_ADMIN_CODE;
    await query('INSERT INTO settings (key, value) VALUES ($1, $2)', [
      'admin_code_hash',
      hash(initial),
    ]);
    if (!process.env.ADMIN_ACCESS_CODE) {
      console.log(`[admin] seeded default access code: ${DEFAULT_ADMIN_CODE}`);
    } else {
      console.log('[admin] seeded access code from ADMIN_ACCESS_CODE');
    }
  }
}

async function init() {
  await waitForDatabase();
  await migrate();
  await seed();
}

module.exports = { pool, query, init, hash, DEFAULT_ADMIN_CODE };
