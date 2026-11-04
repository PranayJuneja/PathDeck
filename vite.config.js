import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { devApi } from './server/dev-api.js';

export default defineConfig({
    plugins: [react(), devApi(), {
        name: 'lean-client-catalog',
        enforce: 'post',
        transform(_code, id) {
            if (!/[\\/]content[\\/](topics|media|diagrams)\.json$/.test(id)) return null;
            const records = JSON.parse(readFileSync(id, 'utf8'));
            const allowed = id.endsWith('media.json') ? ['id','title','kind','localPath','sourceUrl','author','license','licenseUrl','description','topicIds','attribution','sourceName','transformation','bytes'] : null;
            const lean = records.map(record => allowed ? Object.fromEntries(allowed.filter(key => record[key] !== undefined).map(key => [key, record[key]])) : Object.fromEntries(Object.entries(record).filter(([key]) => !['imageQueries','keywords','sourceRevision','importedAt'].includes(key))));
            return { code: `export default ${JSON.stringify(lean)};`, map: null };
        },
    }, {
        name: 'path-deck-offline-build',
        writeBundle(options, bundle) {
            const assets = Object.keys(bundle).filter(path => /\.(js|css|woff2?|ttf)$/.test(path)).map(path => `/${path}`);
            const version = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 12);
            const worker = readFileSync('public/sw.js', 'utf8').replace("'development'", JSON.stringify(version)).replace('/* BUILD_ASSETS */', `, ${assets.map(path => JSON.stringify(path)).join(', ')}`);
            writeFileSync(`${options.dir}/sw.js`, worker);
        },
    }],
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: { groups: [
                    { name: 'firebase', test: /node_modules[\\/]@?firebase/ },
                    { name: 'pathology-notes', test: /[\\/]content[\\/]topics\.json$/ },
                    { name: 'pathology-images', test: /[\\/]content[\\/]media\.json$/ },
                    { name: 'pathology-diagrams', test: /[\\/]content[\\/]diagrams\.json$/ },
                ] },
            },
        },
    },
});
