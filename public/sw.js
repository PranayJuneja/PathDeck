const VERSION = 'development';
const SHELL = `path-deck-shell-${VERSION}`;
const MEDIA = 'path-deck-media-v1';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png', '/icon-192.png', '/icon-512.png' /* BUILD_ASSETS */];

self.addEventListener('install', event => event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(CORE))));
self.addEventListener('activate', event => event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('path-deck-shell-') && key !== SHELL) await caches.delete(key);
    await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
    event.respondWith((async () => {
        const isMedia = /^\/(images|diagrams)\//.test(url.pathname);
        const cache = await caches.open(isMedia ? MEDIA : SHELL);
        if (event.request.mode === 'navigate') {
            try { const response = await fetch(event.request); if (response.ok) return response; } catch { /* Complete build available below. */ }
            return await cache.match('/index.html') || new Response('Reconnect to open Path Deck for the first time.', { status: 503 });
        }
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
            const response = await fetch(event.request);
            if (response.ok) await cache.put(event.request, response.clone());
            return response;
        } catch { return new Response('This image has not been saved offline yet.', { status: 503 }); }
    })());
});

let saving = false;
self.addEventListener('message', event => {
    if (event.data?.type === 'CACHE_MEDIA' && Array.isArray(event.data.paths)) {
        event.waitUntil(saveMedia(event.data.paths));
    }
});
async function broadcast(data) { for (const client of await self.clients.matchAll()) client.postMessage({ type: 'CACHE_PROGRESS', ...data }); }
async function saveMedia(paths) {
    if (saving) return;
    const unique = [...new Set(paths)].filter(path => typeof path === 'string' && /^\/(images|diagrams)\//.test(path) && !path.includes('..'));
    saving = true; let done = 0; let failed = 0; let next = 0; let storageFull = false;
    try {
        const cache = await caches.open(MEDIA);
        await Promise.all(Array.from({ length: 3 }, async () => {
            while (next < unique.length) {
                const path = unique[next++];
                try {
                    if (!await cache.match(path)) {
                        const response = await fetch(path, { signal: AbortSignal.timeout(15000) });
                        if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Image unavailable');
                        await cache.put(path, response);
                    }
                } catch (error) { failed++; if (error.name === 'QuotaExceededError') storageFull = true; }
                done++; await broadcast({ done, total: unique.length, failed, storageFull, running: true });
            }
        }));
    } catch { failed = Math.max(failed, unique.length - done); }
    finally { saving = false; await broadcast({ done, total: unique.length, failed, storageFull, running: false }); }
}
