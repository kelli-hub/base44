import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './Catalog.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'signature-cart-v1';

function readStoredLines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line) =>
          line &&
          typeof line === 'object' &&
          typeof line.slug === 'string' &&
          typeof line.qty === 'number' &&
          line.slug &&
          line.qty > 0
      )
      .map((line) => ({ slug: line.slug, qty: Math.min(24, Math.floor(line.qty)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { find } = useCatalog();
  const [lines, setLines] = useState(readStoredLines);
  const [lastAdded, setLastAdded] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    if (!lastAdded) return undefined;
    const timer = setTimeout(() => setLastAdded(null), 2500);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  const add = useCallback(
    (slug, amount = 1) => {
      const product = find(slug);
      if (!product || !product.inStock) return;
      setLines((current) => {
        const existing = current.find((line) => line.slug === slug);
        const limit = Math.min(24, product.stock);
        if (existing) {
          return current.map((line) =>
            line.slug === slug ? { ...line, qty: Math.min(limit, line.qty + amount) } : line
          );
        }
        return [...current, { slug, qty: Math.min(limit, amount) }];
      });
      setLastAdded(slug);
    },
    [find]
  );

  const setQty = useCallback((slug, qty) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) => (line.slug === slug ? { ...line, qty: Math.min(24, qty) } : line))
    );
  }, []);

  const remove = useCallback((slug) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const product = find(line.slug);
        return total + (product ? product.price * line.qty : 0);
      }, 0),
    [lines, find]
  );

  const value = {
    lines,
    count: lines.reduce((total, line) => total + line.qty, 0),
    subtotal,
    add,
    setQty,
    remove,
    clear,
    lastAdded,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
