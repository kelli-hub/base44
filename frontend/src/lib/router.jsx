import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

export function parseLocation() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathname, search = ''] = raw.split('?');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return { path, search: Object.fromEntries(new URLSearchParams(search)) };
}

export function buildHref(to, search) {
  const path = `${to.startsWith('/') ? to : `/${to}`}`;
  const params = new URLSearchParams();
  Object.entries(search || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const query = params.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(parseLocation);

  useEffect(() => {
    const sync = () => setLocation(parseLocation());
    window.addEventListener('hashchange', sync);
    if (!window.location.hash) window.history.replaceState(null, '', '#/');
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const target = `#${to.startsWith('/') ? to : `/${to}`}`;
    if (replace) {
      window.history.replaceState(null, '', target);
      setLocation(parseLocation());
    } else {
      window.location.hash = target;
    }
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used inside RouterProvider');
  return context;
}

export function Link({ to, search, children, ...rest }) {
  return (
    <a href={buildHref(to, search)} {...rest}>
      {children}
    </a>
  );
}
