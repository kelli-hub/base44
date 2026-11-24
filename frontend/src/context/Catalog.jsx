import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from '../lib/router.jsx';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const { path, search } = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/catalog');
      if (!response.ok) throw new Error('catalog unavailable');
      const data = await response.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setError(null);
    } catch (err) {
      setError('We could not reach the shelves. Refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // The shelf is re-read on every route change, so a change saved in the staff
  // dashboard shows up on the storefront the moment you navigate to it.
  useEffect(() => {
    load();
  }, [load, path, search.cat]);

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      refresh: load,
      find: (slug) => products.find((product) => product.slug === slug),
      categoryLabel: (id) => categories.find((category) => category.id === id)?.label ?? id,
    }),
    [products, categories, loading, error, load]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider');
  return context;
}
