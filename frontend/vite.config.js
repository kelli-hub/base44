import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API runs as its own compose service; the dev server proxies /api so the
// storefront and the dashboard stay on a single origin (cookies included).
const apiTarget = process.env.VITE_API_PROXY || 'http://localhost:4000';

// Inside the Base44 sandbox the preview proxy rewrites the Host header to the
// sandbox domain. An empty allowlist lets Vite append the host handed over in
// __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS; outside preview mode Vite's defaults
// apply unchanged.
const previewHosts = process.env.BASE44_PREVIEW_MODE === '1' ? [] : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: previewHosts,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
    },
  },
});
