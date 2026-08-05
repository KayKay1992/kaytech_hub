// Custom service worker (vite-plugin-pwa injectManifest strategy). Scope is
// deliberately modest: precache the app shell so repeat visits load
// instantly and the UI renders on a poor/no connection, cache images
// cache-first so previously-viewed pages keep showing their pictures
// offline, and let API calls hit the network first since course/dashboard/
// forum data goes stale fast — it's fine if authenticated/dynamic pages
// simply don't work with zero connection, this isn't a fully offline app.
import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Injected at build time with every hashed JS/CSS/HTML/font asset from the
// production build — this is the actual "app shell".
precacheAndRoute(self.__WB_MANIFEST);

// Images (course covers, service/plan images, R2-hosted uploads, etc.) —
// cache-first so anything already seen renders instantly and stays
// available offline. Cross-origin (R2 bucket) images match too, since this
// checks the resolved request, not the current page's origin.
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'kaytech-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true }),
    ],
  })
);

// Web fonts (Google Fonts + Fontshare, loaded via <link> in index.html) —
// cross-origin, so not part of the precache manifest. Font files/CSS
// virtually never change once published, so cache-first is safe here too.
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.origin === 'https://api.fontshare.com' ||
    url.origin === 'https://cdn.fontshare.com',
  new CacheFirst({
    cacheName: 'kaytech-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// Backend API calls — network-first. Data (courses, dashboards, forum
// posts, payments, etc.) changes constantly, so a short-lived cache is only
// a fallback for a flaky connection, never the primary source. Matched by
// pathname rather than origin so this works whether the API is same-origin
// (single-server deploy) or a separate VITE_API_URL host.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'kaytech-api',
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

// Page navigations — network-first (always try for the freshest app shell),
// falling back to the precached shell when offline. Only when there's
// truly nothing cached for this request (first-ever visit while offline,
// or an uncached asset) does the catch handler below kick in.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'kaytech-pages',
    networkTimeoutSeconds: 8,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// Last-resort fallback: nothing precached, nothing cached, network failed.
// Show the branded offline page for navigations instead of the browser's
// default "no internet" error.
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const offlinePage = await matchPrecache('offline.html');
    if (offlinePage) return offlinePage;
  }
  return Response.error();
});

self.skipWaiting();
self.addEventListener('activate', () => self.clients.claim());
