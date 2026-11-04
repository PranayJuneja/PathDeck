import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateContent } from '../scripts/validate-content.mjs';

test('all atlas content, source licences, topic associations and image bytes are valid', async () => {
    const report = await validateContent({ writeReport: false });
    assert.ok(report.topics >= 200, 'The requested broad MBBS atlas must not regress to a small demo dataset');
    for (const system of ['General pathology', 'Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Hepatobiliary & pancreas', 'Renal & urinary', 'Blood & marrow', 'Lymphoid pathology', 'Male reproductive', 'Female reproductive', 'Breast', 'Endocrine', 'Bone & soft tissue', 'Skin', 'Central nervous system', 'Infections', 'Immune pathology', 'Genetic & developmental', 'Nutrition & environmental']) assert.ok(report.systems[system], `Missing MBBS system: ${system}`);
    assert.ok(report.specimenImages >= 250);
    assert.ok(report.originalDiagrams >= 12);
    assert.equal(report.illustratedTopics, report.topics, 'Every included condition needs a relevant specimen image or explanatory diagram');
    console.log(`Validated ${report.topics} topics, ${report.totalImages} images, ${report.illustratedTopics} illustrated topics.`);
});

test('the app uses Tissue Deck components and preserves per-image source attribution', () => {
    const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
    const viewer = readFileSync(new URL('../src/components/SlideViewer.jsx', import.meta.url), 'utf8');
    assert.ok(app.includes("import styles from './App.module.css'"));
    assert.ok(app.includes('styles.aurora') && app.includes('styles.gridOverlay'));
    assert.ok(app.includes('styles.workArea') && app.includes('styles.infoColumn'));
    assert.ok(viewer.includes('imageByPath') && viewer.includes('sourceUrl'));
});

test('the copied core Tissue Deck styles and particles remain unchanged', () => {
    const baseline = JSON.parse(readFileSync(new URL('../research/tissue-design-baseline.json', import.meta.url), 'utf8'));
    for (const [file, hash] of Object.entries(baseline.files)) {
        const bytes = readFileSync(new URL(`../src/${file}`, import.meta.url));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `Original Tissue Deck design changed: ${file}`);
    }
});

test('confirmed source-caption rejections are never reintroduced as topic images', () => {
    const rejected = JSON.parse(readFileSync(new URL('../research/commons-rejections.json', import.meta.url), 'utf8'));
    const media = JSON.parse(readFileSync(new URL('../content/media.json', import.meta.url), 'utf8'));
    for (const decision of rejected) {
        const image = media.find(image => image.sourceUrl === decision.sourceUrl);
        if (!image) continue;
        assert.ok(decision.topicId && !image.topicIds.includes(decision.topicId), `Rejected source association returned: ${decision.sourceUrl} / ${decision.topicId || 'all topics'}`);
    }
});
