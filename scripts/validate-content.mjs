import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

export async function validateContent({ writeReport = true } = {}) {
    const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
    const topics = read('topics'); const media = read('media'); const diagrams = read('diagrams');
    const ids = new Set(); const imageIds = new Set(); const hashes = new Set();
    const systems = {};
    for (const topic of topics) {
        assert.match(topic.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `Invalid topic ID: ${topic.id}`);
        assert.ok(!ids.has(topic.id), `Duplicate topic: ${topic.id}`); ids.add(topic.id);
        for (const key of ['name', 'system', 'category', 'definition', 'pathogenesis']) assert.ok(typeof topic[key] === 'string' && topic[key].trim().length > 2, `${topic.id}: missing ${key}`);
        for (const key of ['aliases', 'gross', 'microscopy', 'clinical', 'examTips', 'differentials', 'stains', 'imageQueries', 'references']) assert.ok(Array.isArray(topic[key]), `${topic.id}: invalid ${key}`);
        assert.ok(topic.microscopy.length >= 3 && topic.gross.length >= 2 && topic.clinical.length >= 2 && topic.examTips.length && topic.references.length, `${topic.id}: insufficient study notes`);
        for (const reference of topic.references) assert.match(reference.url, /^https:\/\//, `${topic.id}: invalid reference URL`);
        systems[topic.system] = (systems[topic.system] || 0) + 1;
    }
    const all = [...media, ...diagrams.map(image => ({ ...image, kind: 'diagram', localPath: image.path }))];
    const acceptedFiles = new Set(media.map(image => image.localPath.split('/').at(-1)));
    for (const name of readdirSync(new URL('../public/images/commons/', import.meta.url))) assert.ok(acceptedFiles.has(name), `Unreferenced or rejected image remains public: ${name}`);
    let bytes = 0;
    const illustrated = new Set();
    await Promise.all(all.map(async image => {
        assert.ok(!imageIds.has(image.id), `Duplicate image ID: ${image.id}`); imageIds.add(image.id);
        assert.ok(['microscopy', 'gross', 'diagram', 'clinical', 'radiology'].includes(image.kind), `${image.id}: invalid modality`);
        assert.match(image.localPath, /^\/(?:images|diagrams)\//);
        assert.ok(!image.localPath.includes('..'));
        assert.ok(image.author?.trim() && image.license?.trim(), `${image.id}: missing attribution`);
        assert.ok(/^(CC BY(?:-SA)? [234](?:\.[05])?|CC0(?: 1\.0)?|Public domain|PD)$/i.test(image.license), `${image.id}: unapproved licence ${image.license}`);
        assert.match(image.licenseUrl, /^https?:\/\//);
        assert.ok(Array.isArray(image.topicIds) && image.topicIds.length, `${image.id}: unassociated image`);
        for (const id of image.topicIds) { assert.ok(ids.has(id), `${image.id}: unknown topic ${id}`); illustrated.add(id); }
        const file = new URL(`../public${image.localPath}`, import.meta.url);
        assert.ok(existsSync(file), `${image.id}: missing asset`);
        const data = readFileSync(file); bytes += data.length;
        const metadata = await sharp(data).metadata();
        assert.ok(metadata.width > 0 && metadata.height > 0, `${image.id}: invalid image`);
        if (image.sha256) {
            const hash = createHash('sha256').update(data).digest('hex');
            assert.equal(hash, image.sha256, `${image.id}: checksum mismatch`);
            assert.ok(!hashes.has(hash), `${image.id}: duplicate image bytes`); hashes.add(hash);
        }
        if (image.sourceName === 'Wikimedia Commons') {
            assert.match(image.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
            assert.ok(image.attribution && image.description, `${image.id}: incomplete provenance`);
        }
    }));
    const report = {
        checkedAt: new Date().toISOString(), topics: topics.length, systems,
        specimenImages: media.length, originalDiagrams: diagrams.length, totalImages: all.length,
        mediaByKind: Object.fromEntries(Object.entries(Object.groupBy(all, image => image.kind)).map(([kind, images]) => [kind, images.length])),
        illustratedTopics: illustrated.size,
        notesOnlyTopics: topics.filter(topic => !illustrated.has(topic.id)).map(topic => ({ id: topic.id, name: topic.name, system: topic.system })),
        imageBytes: bytes, imageMiB: Math.round(bytes / 1024 / 1024 * 10) / 10,
        integrity: 'All images decode, linked topic IDs exist, checksums match, reusable licence metadata is present.',
        limits: 'Technical integrity and recorded licensing do not constitute specialist medical review or a guarantee about a source uploader’s rights.',
    };
    if (writeReport) writeFileSync(new URL('../research/content-integrity.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
    return report;
}
if (process.argv[1]?.endsWith('validate-content.mjs')) {
    const report = await validateContent();
    console.log(JSON.stringify(report, null, 2));
}
