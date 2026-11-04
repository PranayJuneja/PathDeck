import { Readable } from 'node:stream';

// Serve the same Web-standard handlers locally as Vercel serves in production.
export function devApi() {
    const attach = server => {
            server.middlewares.use(async (req, res, next) => {
                const pathname = new URL(req.url, 'http://localhost').pathname;
                if (!['/api/chat', '/api/usage'].includes(pathname)) return next();
                const method = pathname === '/api/chat' ? 'POST' : 'GET';
                if (req.method !== method) { res.writeHead(405, { Allow: method }).end(); return; }
                try {
                    const controller = new AbortController();
                    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
                    const chunks = [];
                    let size = 0;
                    for await (const chunk of req) {
                        size += chunk.length;
                        if (size > 100000) { res.writeHead(413).end('Request too large'); return; }
                        chunks.push(chunk);
                    }
                    const request = new Request(`http://localhost${pathname}`, {
                        method, headers: req.headers, signal: controller.signal,
                        ...(method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
                    });
                    const module = pathname === '/api/chat' ? await import('../api/chat.js') : await import('../api/usage.js');
                    const response = await module[method](request);
                    res.writeHead(response.status, Object.fromEntries(response.headers));
                    if (response.body) Readable.fromWeb(response.body).on('error', () => res.destroy()).pipe(res);
                    else res.end();
                } catch {
                    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Local API unavailable' }));
                    else res.destroy();
                }
            });
    };
    return {
        name: 'local-api',
        configureServer: attach,
        configurePreviewServer: attach,
    };
}
