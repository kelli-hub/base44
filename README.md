# Signature Liquor Store

Two-branch bottle shop in Nairobi & Kiambu — storefront, distance-based delivery
checkout and a staff dashboard.

- `frontend/` — React + Vite storefront (`#/`, `#/shop`, `#/product/:slug`, `#/stores`,
  `#/about`, `#/checkout`) and the staff dashboard at `#/admin`.
- `backend/` — Express API on PostgreSQL: catalogue, delivery quotes, orders, and the
  admin endpoints the dashboard uses. The Vite dev server proxies `/api` to it.

## Staff dashboard

Open `#/admin` (or the **Staff access** link in the footer) and enter the staff code.

- The first-run code is `SIG-ADMIN-2026`. Change it right away under **Access code**.
- Set `ADMIN_ACCESS_CODE` before the very first boot to seed a different code instead;
  after that the code lives hashed in the database and is managed from the dashboard.
- **Orders** lists every checkout from the public site with the customer, phone,
  address, area, rider fee, items and payment method. Move an order through
  New → Confirmed → Out for delivery → Delivered, or cancel it. Deleting a cancelled
  order puts its bottles back on the shelf.
- **Products** edits prices, "was" prices, stock, badges, featured picks and the **Live**
  switch. A bottle that is not live disappears from the public shop immediately.

## Checkout

Orders are real: the server re-prices the basket, applies the rider fee (KSh 100 for the
first 3 km, +KSh 50 per extra 3 km, capped at KSh 600), reserves stock and returns a
reference such as `SIG-7K2QF`. No card data is collected online — the rider confirms
M-Pesa, a card link or cash on delivery.

## Running locally

The Compose setup lives in the Base44 environment (not in this repository) and starts
PostgreSQL, the API (`/api`, internal port 4000) and the Vite dev server on host port
3000 from the mounted source, with hot reload.

## Notes

- Catalogue, orders, staff code and newsletter subscribers are stored in PostgreSQL;
  the API creates its tables and seeds the 22-bottle catalogue on first boot.
- Images live in `frontend/public/img` and are served under `/img/…`.
