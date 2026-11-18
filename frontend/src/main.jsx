import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { RouterProvider } from './lib/router.jsx';
import { CatalogProvider } from './context/Catalog.jsx';
import { CartProvider } from './context/Cart.jsx';
import './styles.css';
import './admin.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider>
      <CatalogProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CatalogProvider>
    </RouterProvider>
  </React.StrictMode>
);
