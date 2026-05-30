/// <reference lib="webworker" />

/**
 * Custom service worker for Kampai School PWA.
 * Replaces vite-plugin-pwa's GenerateSW with InjectManifest so we can add
 * the `push` event listener that GenerateSW doesn't support.
 *
 * The runtime caching strategies below mirror what vite.config.ts used to
 * configure inline — keep them in sync if you change one.
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// ─── Precache build assets ──────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);

// ─── Runtime caching (ported from old vite.config.ts) ────────────────────
registerRoute(
  ({ url }) => /\.supabase\.co\/.*/i.test(url.href),
  new NetworkOnly(),
);

registerRoute(
  ({ url }) => /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

registerRoute(
  ({ url }) => /\.(woff|woff2|ttf)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  }),
);

registerRoute(
  ({ url }) => /\.(css|js)$/i.test(url.pathname),
  new NetworkFirst({
    cacheName: 'static-resources',
    plugins: [new ExpirationPlugin({ maxEntries: 100 })],
  }),
);

// Navigation fallback — SPA routing
const navHandler = new NavigationRoute(
  async ({ event }) => {
    try {
      return await fetch((event as FetchEvent).request);
    } catch {
      const cache = await caches.open('workbox-precache-v2');
      const match = await cache.match('/index.html');
      return match ?? new Response('Offline', { status: 503 });
    }
  },
  { denylist: [/^\/api\//, /^\/games\//] },
);
registerRoute(navHandler);

// ─── Push notifications ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload: { title?: string; body?: string; url?: string; icon?: string; tag?: string } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { title: 'แจ้งเตือนจากโรงเรียน', body: event.data?.text() ?? '' };
  }

  const title = payload.title ?? 'แจ้งเตือนจากโรงเรียน';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of all) {
        // Reuse an existing window if same origin
        if (new URL(c.url).origin === self.location.origin) {
          await c.focus();
          if ('navigate' in c) await (c as WindowClient).navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

// Update delivery: prompt model — SW ใหม่ "waiting" จนกว่าผู้ใช้กดอัปเดต (PWAUpdatePrompt)
// ซึ่ง post { type: 'SKIP_WAITING' } เข้ามา → activate + reload (ไม่ขัดจังหวะงานที่ค้างอยู่)
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
