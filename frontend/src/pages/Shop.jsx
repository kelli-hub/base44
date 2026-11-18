import { useMemo, useState } from 'react';
import { Link, useRouter } from '../lib/router.jsx';
import { useCatalog } from '../context/Catalog.jsx';
import ProductCard from '../components/ProductCard.jsx';

const sortOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name A–Z' },
];

export default function Shop() {
  const { search } = useRouter();
  const { categories, products, loading, error } = useCatalog();
  const category = search.cat && categories.some((item) => item.id === search.cat) ? search.cat : null;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [underTwoThousand, setUnderTwoThousand] = useState(false);

  const visible = useMemo(() => {
    let list = products.slice();
    if (category) list = list.filter((product) => product.category === category);
    if (underTwoThousand) list = list.filter((product) => product.price < 2000);

    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter((product) =>
        [product.name, product.brand, product.category, product.origin, product.note]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      );
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else {
      const rank = (product) =>
        product.badge === 'Signature Pick' ? 0 : product.badge === 'Deal' ? 1 : product.badge === 'New' ? 2 : 3;
      list.sort((a, b) => rank(a) - rank(b));
    }
    return list;
  }, [category, query, sort, underTwoThousand, products]);

  const heading = category
    ? categories.find((item) => item.id === category).label
    : query
    ? `Results for “${query}”`
    : 'Everything in stock';

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">The shelf</span>
          <h1>{heading}</h1>
          <p>
            {loading && !visible.length
              ? 'Loading the shelves…'
              : `${visible.length} ${visible.length === 1 ? 'bottle' : 'bottles'} · genuine stock · delivered today from Roysambu or Thindigua.`}
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="container shop-layout">
          <aside className="filters" aria-label="Filters">
            <div className="filter-block">
              <h4>Categories</h4>
              <ul>
                <li>
                  <Link to="/shop" className={category ? undefined : 'active'}>
                    All products
                  </Link>
                </li>
                {categories.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/shop"
                      search={{ cat: item.id }}
                      className={category === item.id ? 'active' : undefined}
                    >
                      {item.label}
                      <span>{products.filter((product) => product.category === item.id).length}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="filter-block">
              <h4>Price</h4>
              <label className="check">
                <input
                  type="checkbox"
                  checked={underTwoThousand}
                  onChange={(event) => setUnderTwoThousand(event.target.checked)}
                />
                Under KSh 2,000
              </label>
            </div>
            <div className="filter-block">
              <h4>Need a hand?</h4>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                Tell us what the night looks like and we will pick the bottle. WhatsApp us on 0702
                432 522 — we answer 24 hours.
              </p>
            </div>
          </aside>

          <div>
            <div className="shop-tools">
              <input
                className="search-input"
                type="search"
                placeholder="Search whisky, wine, brand…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search products"
              />
              <label className="sort">
                <span>Sort</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  {sortOptions.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && !products.length ? (
              <div className="no-results">{error}</div>
            ) : visible.length === 0 && !loading ? (
              <div className="no-results">
                <b>Nothing matched that.</b>
                Try a different spelling, or browse the categories on the left. If you cannot find a
                bottle, message us — we will source it.
              </div>
            ) : (
              <div className="product-grid three">
                {visible.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
