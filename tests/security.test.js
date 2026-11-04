import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign, verify } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import { loadCatalog, validateChat, imageInput } from '../server/catalog.js';

test('AI Markdown does not execute raw HTML or javascript URLs', () => {
    const html = renderToStaticMarkup(React.createElement(Markdown, { skipHtml: true }, '**Pattern**\n\n<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>\n\n[link](javascript:alert(1))'));
    assert.ok(html.includes('<strong>Pattern</strong>'));
    assert.ok(!html.includes('<img') && !html.includes('<script') && !html.includes('href="javascript:'));
});

test('Firebase Auth loads when require(ESM) is disabled, as on the tested Vercel runtime', () => {
    const child = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', "import { getAuth } from 'firebase-admin/auth'; if (typeof getAuth !== 'function') process.exit(1)"], { encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
});

test('the pinned Firebase signing-key dependency extracts valid RSA keys', async () => {
    const require = createRequire(import.meta.url);
    const clientFactory = require('jwks-rsa');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const client = clientFactory({ jwksUri: 'https://example.invalid/keys', fetcher: async () => ({ keys: [{ ...publicKey.export({ format: 'jwk' }), alg: 'RS256', kid: 'test', use: 'sig' }] }), cache: false });
    const key = await client.getSigningKey('test');
    const bytes = Buffer.from('signing test');
    assert.equal(verify('RSA-SHA256', bytes, key.getPublicKey(), sign('RSA-SHA256', bytes, privateKey)), true);
    await assert.rejects(client.getSigningKey('unknown'));
});

test('attached images must belong to the selected condition', () => {
    const { topics, images } = loadCatalog();
    const image = images[0];
    const other = topics.find(topic => !image.topicIds.includes(topic.id));
    assert.throws(() => validateChat({ topicId: other.id, includeImage: true, imageId: image.id, messages: [{ role: 'user', content: 'Explain' }] }), /current pathology topic/);
});

test('original SVG diagrams become valid model-supported image input', async () => {
    const image = loadCatalog().images.find(image => image.localPath.endsWith('.svg'));
    const result = await imageInput(image);
    assert.equal(result.type, 'input_image');
    assert.match(result.image_url, /^data:image\/webp;base64,UklGR/);
});
