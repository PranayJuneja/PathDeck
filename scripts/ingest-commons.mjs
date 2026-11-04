import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = createRequire('D:/Antigravity Projects/Tissue Deck/package.json')('sharp'); }
const UA = 'PathDeck/0.1 (educational pathology atlas; https://github.com/PranayJuneja/TissueDeck)';
const headers = { 'User-Agent': UA, Accept: 'application/json,image/*;q=0.9,*/*;q=0.5' };
const cacheDirectory = path.join(root, 'research/commons-cache');
const imageDirectory = path.join(root, 'public/images/commons');
const mediaFile = path.join(root, 'content/media.json');
const rejectionFile = path.join(root, 'research/commons-rejections.json');
const overrideFile = path.join(root, 'research/commons-overrides.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const readJson = async (file, fallback) => { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; } };
const writeJson = async (file, value) => {
    await fs.writeFile(`${file}.tmp`, JSON.stringify(value, null, 2) + '\n');
    await fs.rename(`${file}.tmp`, file);
};
const strip = value => String(value || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, number) => String.fromCharCode(Number(number))).replace(/\s+/g, ' ').trim();
const medicalText = value => value.toLowerCase().replace(/tumour/g, 'tumor').replace(/anaem/g, 'anem').replace(/haem/g, 'hem').replace(/leukaem/g, 'leukem').replace(/oesoph/g, 'esoph');
const hasTerm = (value, term) => new RegExp(`\\b${term}${term === 'iga' ? '(?:[12])?' : '(?:s|es)?'}\\b`).test(value);
const nonHuman = /\b(?:mouse|mice|rat|rats|murine|rabbit|rabbits|canine|feline|bovine|porcine|equine|veterinary|frog|rana|dog|dogs|cat|cats|pig|pigs|goat|goats|horse|horses|sheep|fish|zebrafish|chicken|avian|macaque|primate|monkey|monkeys|rodent|rodents|drosophila|caenorhabditis|xenopus|arabidopsis|saccharomyces|salamander|turtle|gecko|lizard|axolotl|newt|reptile|cattle|cows|calves)\b/i;
const bootstrap = [
    ['coagulative-necrosis', 'Coagulative necrosis', ['coagulative necrosis histopathology', 'renal infarct gross pathology']],
    ['caseous-necrosis', 'Caseous necrosis', ['caseous necrosis histopathology', 'tuberculosis lung gross pathology']],
    ['fat-necrosis', 'Fat necrosis', ['fat necrosis histopathology', 'pancreatitis fat necrosis gross']],
    ['acute-inflammation', 'Acute inflammation', ['acute inflammation histopathology', 'acute appendicitis histopathology']],
    ['granulomatous-inflammation', 'Granulomatous inflammation', ['granuloma histopathology', 'tuberculosis granuloma histopathology']],
    ['atherosclerosis', 'Atherosclerosis', ['atherosclerosis histopathology', 'atherosclerosis gross pathology']],
    ['thrombosis', 'Thrombosis', ['thrombus histopathology', 'thrombus gross pathology']],
    ['squamous-cell-carcinoma', 'Squamous cell carcinoma', ['squamous cell carcinoma histopathology', 'squamous cell carcinoma diagram']],
    ['breast-carcinoma', 'Breast carcinoma', ['invasive ductal carcinoma histopathology', 'breast carcinoma gross pathology']],
    ['lung-adenocarcinoma', 'Lung adenocarcinoma', ['lung adenocarcinoma histopathology', 'lung carcinoma gross pathology']],
    ['pneumonia', 'Pneumonia', ['lobar pneumonia histopathology', 'lobar pneumonia gross pathology']],
    ['myocardial-infarction', 'Myocardial infarction', ['myocardial infarction histopathology', 'myocardial infarction gross pathology']],
    ['cirrhosis', 'Cirrhosis', ['cirrhosis histopathology', 'cirrhosis gross pathology']],
    ['glomerulonephritis', 'Glomerulonephritis', ['glomerulonephritis histopathology', 'glomerulonephritis diagram']],
    ['hodgkin-lymphoma', 'Hodgkin lymphoma', ['Hodgkin lymphoma histopathology', 'Reed Sternberg cell']],
    ['iron-deficiency-anemia', 'Iron deficiency anemia', ['iron deficiency anemia blood smear', 'microcytic anemia blood smear']],
    ['acute-myeloid-leukemia', 'Acute myeloid leukemia', ['acute myeloid leukemia blood smear', 'Auer rods']],
    ['papillary-thyroid-carcinoma', 'Papillary thyroid carcinoma', ['papillary thyroid carcinoma histopathology', 'papillary thyroid carcinoma gross']],
    ['seminoma', 'Seminoma', ['seminoma histopathology', 'seminoma gross pathology']],
    ['osteosarcoma', 'Osteosarcoma', ['osteosarcoma histopathology', 'osteosarcoma gross pathology']],
].map(([id, name, imageQueries]) => ({ id, name, imageQueries }));

const curatedQueries = {
    'sickle-cell-disease': ['sickle cells blood smear', 'drepanocytose', 'sickle cell anemia blood film'],
    'aplastic-anemia': ['aplastic anemia bone marrow', 'bone marrow aplasia', 'hypocellular bone marrow'],
    'iga-nephropathy': ['IgA glomerulonephritis', 'IgA nephritis', 'IgA nephropathy microscopy'],
    'infection-related-glomerulonephritis': ['poststreptococcal glomerulonephritis', 'postinfectious glomerulonephritis', 'post streptococcal glomerulonephritis'],
    'alcohol-associated-hepatitis': ['alcoholic hepatitis', 'alcoholic steatohepatitis histopathology', 'Mallory bodies alcoholic hepatitis'],
    'hyperplastic-arteriolosclerosis': ['hyperplastic arteriolosclerosis', 'onion skin arteriolosclerosis', 'hyperplastic arteriolosclerosis histology'],
    'disseminated-intravascular-coagulation': ['disseminated intravascular coagulation histology', 'disseminated intravascular coagulation diagram', 'disseminated intravascular coagulation pathology'],
    'infective-endocarditis': ['bacterial endocarditis histopathology', 'infective endocarditis', 'bacterial endocarditis gross'],
    'diabetes-mellitus-type-2': ['islet amyloid diabetes', 'type 2 diabetes pancreatic islet histology', 'pancreatic islet amyloidosis diabetes'],
};

let lastApi = 0;
async function search(query) {
    const file = path.join(cacheDirectory, `${hash(query).slice(0, 20)}.json`);
    const cached = await readJson(file, null);
    if (cached && !process.argv.includes('--refresh')) return cached;
    await delay(Math.max(0, 450 - (Date.now() - lastApi)));
    lastApi = Date.now();
    const parameters = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '12', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime|sha1|timestamp', iiurlwidth: '1600', format: 'json' });
    const url = `https://commons.wikimedia.org/w/api.php?${parameters}`;
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
    if (response.status === 429) throw new Error('Commons API rate limit reached; stop and resume later, retaining completed assets.');
    if (response.status === 403) throw new Error('Commons API access blocked; stop and inspect access before resuming.');
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error(`Commons API returned ${response.status} for ${query}`);
    const value = await response.json();
    if (value.error) throw new Error(value.error.info);
    const result = { query, requestedAt: new Date().toISOString(), url, pages: Object.values(value.query?.pages || {}) };
    await writeJson(file, result);
    return result;
}

function licensed(image) {
    const metadata = image.extmetadata || {};
    const license = strip(metadata.LicenseShortName?.value);
    const url = metadata.LicenseUrl?.value || '';
    const restrictions = strip(metadata.Restrictions?.value);
    const normalized = `${license} ${url}`.toLowerCase();
    const credit = strip(`${metadata.ImageDescription?.value || ''} ${metadata.Credit?.value || ''} ${metadata.Permission?.value || ''}`).toLowerCase();
    if (/reprinted|re[-\s]?produced|used with permission|all rights reserved/.test(credit)) return null;
    if (/non.?commercial|\bnc\b|no.?derivatives|\bnd\b/.test(normalized) || restrictions) return null;
    if (!/^CC0$|^CC BY(?:-SA)? (?:1\.0|2\.[05]|[34]\.0)$|^Public domain$|^PD[- ]/i.test(license)) return null;
    if (!url && !/public domain|^PD/i.test(license)) return null;
    return { license, licenseUrl: url || 'https://commons.wikimedia.org/wiki/Commons:Copyright_tags#Public_domain' };
}

function classify(text, title) {
    const primary = title.toLowerCase();
    if (/\bdiagram|schematic|flowchart|drawing|illustration/.test(primary)) return 'diagram';
    if (/gross|macroscop|specimen|autopsy/.test(primary)) return 'gross';
    if (/histopath|histolog|micrograph|microscop|\bsmear\b|blood film|cytolog|low power|high power|\bhe\b|h&e|\bfna\b/.test(primary)) return 'microscopy';
    if (/\.svg$/.test(primary)) return 'diagram';
    if (/\bx.ray|radiograph|\bmri\b|\bmr\b|ultrasound|\bct scan|computed tomography/.test(primary)) return 'radiology';
    if (/\.svg$/i.test(title) || /\bdiagram|schematic|flowchart|drawing|illustration|schemata|schematic/.test(text)) return 'diagram';
    if (/\bx.ray|\bradiograph|\bmri\b|\bct scan|computed tomography/.test(text)) return 'radiology';
    if (/gross path|macroscop|gross specimen|gross photograph|gross appearance|autopsy|gross view/.test(text)) return 'gross';
    if (/histopath|histolog|micrograph|photomicrograph|microscop|blood smear|blood film|peripheral smear|bone marrow smear|low power|high power|h&e|h & e|hematoxylin|haematoxylin|wright.giemsa|papanicolaou|cytolog/.test(text)) return 'microscopy';
    if (/\bclinical photograph|\bpatient|dermatolog|clinical appearance|endoscop|colonoscopy|gastroscopy|bronchoscopy/.test(text)) return 'clinical';
    return null;
}

function rank(page, query, topic) {
    const image = page.imageinfo?.[0];
    if (!image || !image.mime?.startsWith('image/') || /\.pdf$|\.djvu$|\.gif$/i.test(page.title)) return null;
    const rights = licensed(image);
    if (!rights) return null;
    const metadata = image.extmetadata || {};
    const description = strip(metadata.ImageDescription?.value);
    const categories = strip(metadata.Categories?.value);
    const text = medicalText(`${page.title} ${description} ${categories}`);
    if (nonHuman.test(text)) return null;
    if (/ai.generated|pd.algorithm|generated using.{0,30}(?:gpt|chatgpt|gemini|midjourney)/.test(text)) return null;
    const sourceTitle = medicalText(strip(page.title));
    if (/slave ship|\bpride flag\b|fantasy|by.david.revoy|market value|magic bullets|history of.*therapeutic antibodies|\bvideo game\b|\bboard game\b/.test(text)) return null;
    // Disease names in bibliography, titles of artwork, or secondary context do not establish pathology shown.
    if (topic.id === 'hepatic-steatosis' && /liver lobule/.test(sourceTitle) && !/steatosis|fatty liver/.test(description.split(/bibliography/i)[0])) return null;
    if (topic.id === 'nephrotic-syndrome' && /glomerular filtration barrier/.test(sourceTitle) && !/nephrotic|injury|damage|effacement/.test(description)) return null;
    if (topic.id === 'alzheimer-disease' && /normal.brain/.test(description) && !/compar|versus|affected/.test(description)) return null;
    if (topic.id === 'granulomatous-inflammation' && /pyogenic granuloma/.test(sourceTitle)) return null;
    if (topic.id === 'shock' && /hsp70|heat.shock/.test(sourceTitle)) return null;
    if (topic.id === 'ovarian-high-grade-serous-carcinoma' && /low.grade/.test(sourceTitle)) return null;
    if (topic.id === 'ovarian-mucinous-tumour' && /pancrea/.test(sourceTitle)) return null;
    if (topic.id === 'invasive-breast-carcinoma-nst' && /mucinous|lobular|metaplastic|medullary/.test(sourceTitle)) return null;
    if (topic.id === 'giant-cell-tumour-of-bone' && /osteosarcoma/.test(sourceTitle)) return null;
    if (topic.id === 'reversible-cell-injury' && /hydatidiform|hydatid.*mole/.test(sourceTitle)) return null;
    if (topic.id === 'keloid' && /hypertrophic scar/.test(sourceTitle)) return null;
    if (topic.id === 'cervical-squamous-cell-carcinoma' && /in situ|intraepithelial/.test(sourceTitle) && !/invasive/.test(sourceTitle)) return null;
    const diabetesType = topic.id.match(/^diabetes-mellitus-type-([12])$/);
    if (diabetesType) {
        const arabic = diabetesType[1], roman = arabic === '1' ? 'i' : 'ii';
        const typedDiabetes = new RegExp(`\\btype[\\s_-]*(?:${arabic}|${roman})\\b.{0,25}diabet|diabet.{0,35}\\btype[\\s_-]*(?:${arabic}|${roman})\\b`).test(text);
        if (!typedDiabetes) return null;
    }
    if (topic.id === 'neurofibromatosis-type-1' && !/\bnf[\s_-]*1\b|neurofibromatosis.{0,15}\btype[\s_-]*(?:1|i)\b|\btype[\s_-]*(?:1|i)\b.{0,15}neurofibromatosis|recklinghausen/.test(text)) return null;
    const primaryDiagnosis = medicalText(`${sourceTitle} ${description.split(/[.!?]\s/)[0]}`);
    if (topic.id === 'autosomal-dominant-polycystic-kidney-disease' && (!/\badpkd\b|dominant|adult polycystic/.test(primaryDiagnosis) || /recessive|recesiva|\barpkd\b/.test(primaryDiagnosis))) return null;
    if (topic.id === 'autosomal-recessive-polycystic-kidney-disease' && (!/\barpkd\b|recessive|recesiva|infantile polycystic/.test(primaryDiagnosis) || /dominant|\badpkd\b/.test(primaryDiagnosis))) return null;
    const hypersensitivity = topic.id.match(/^type-(i|ii|iii|iv)-hypersensitivity$/);
    if (hypersensitivity) {
        const roman = hypersensitivity[1];
        const numeral = { i: 1, ii: 2, iii: 3, iv: 4 }[roman];
        const explicitType = new RegExp(`\\btype[\\s_-]*(?:${roman}|${numeral})[\\s_-]*hypersens`).test(text);
        const comparisonPlate = /types of hypersensitivity/.test(sourceTitle) && new RegExp(`\\btype\\s+(?:${roman}|${numeral})\\b`).test(medicalText(description));
        if (!explicitType && !comparisonPlate) return null;
    }
    if (/lobar-pneumonia/.test(topic.id) && /carcinoma|neoplasm|tumou?r/.test(sourceTitle)) return null;
    if (/small-cell-lung-carcinoma/.test(topic.id) && /epidermoid|squamous|herpes|non.small/.test(sourceTitle)) return null;
    if (topic.id === 'pilocytic-astrocytoma' && /pilomyxoid/.test(sourceTitle)) return null;
    if (/textbook|book scan|book page|wellcome.*[0-9]{7}|cover of|portrait of|chemical structure|wiktionary|list of|patient.*face|surgical instrument/.test(text)) return null;
    const kind = classify(text, page.title);
    if (!kind) return null;
    if (kind === 'diagram' && /[-_](?:de|fr|ca|es|it|ru|pt|ar|zh|ja|ko|uk|pl)\.(?:svg|png|jpg)$/i.test(page.title)) return null;
    const generic = new Set(['histopathology', 'histology', 'pathology', 'gross', 'specimen', 'microscopy', 'diagram', 'micrograph', 'of', 'and', 'the', 'in', 'with', 'disease', 'blood', 'smear']);
    const terms = medicalText(query).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(term => term.length > 2 && !generic.has(term));
    if (!terms.length) return null;
    for (const required of ['aplastic', 'aplasia', 'hypocellular']) if (terms.includes(required) && !hasTerm(text, required)) return null;
    const matched = terms.filter(term => hasTerm(text, term));
    if (terms.length && matched.length / terms.length < 0.66) return null;
    if (/\bdifferential|\bmimic|\bsimulat|\bshould not|\bnot be mistaken|\bnot be confused/i.test(description)) {
        const primary = medicalText(`${sourceTitle} ${description.split(/\bdifferential|\bmimic|\bsimulat|\bshould not|\bnot be mistaken|\bnot be confused/i)[0]}`);
        if (terms.length && terms.filter(term => hasTerm(primary, term)).length / terms.length < 0.66) return null;
    }
    let score = matched.length * 4;
    if (text.includes((topic.name || topic.title || '').toLowerCase())) score += 8;
    if (kind === 'microscopy') score += 4;
    if (kind === 'gross') score += 3;
    if (kind === 'diagram') score += 2;
    if (image.width >= 900 && image.height >= 500) score += 2;
    if (image.width < 400 || image.height < 250) score -= 12;
    return { page, image, rights, description, categories, kind, score };
}

function authorName(value) {
    const caption = String(value || '').match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
    return strip(caption || value).split('Author info')[0].replace(/\s*[-–]\s*$/, '') || 'See source page for creator';
}

function sourceAuthor(image) {
    const named = authorName(image.extmetadata?.Artist?.value);
    if (!/unknown|see source page/i.test(named)) return named;
    const caption = strip(image.extmetadata?.ImageDescription?.value);
    const provider = caption.match(/Content Providers?\(s\):\s*(.+?)(?=\s+Creation Date:|\s+Copyright Restrictions:|$)/i)?.[1];
    const photographer = caption.match(/Photograph by\s+(.+?)\.\s*(?:Public domain|Posted|$)/i)?.[1];
    const credit = strip(image.extmetadata?.Credit?.value);
    const institution = /National Cancer Institute/i.test(credit) ? 'National Cancer Institute' : null;
    return provider || photographer || institution || named;
}

async function download(candidate) {
    const { image, page, rights, description, kind } = candidate;
    const id = `commons-${hash(image.descriptionurl).slice(0, 16)}`;
    const override = sourceOverrides[id] || {};
    const author = override.author || sourceAuthor(image);
    const caption = override.description || description;
    if (/unknown|see source page/i.test(author)) throw new Error(`Creator not established at point of use: ${page.title}`);
    if (!caption.trim()) throw new Error(`Meaningful source caption unavailable: ${page.title}`);
    const localPath = `/images/commons/${id}.webp`;
    const destination = path.join(root, 'public', localPath);
    const originalUrl = image.url;
    const downloadUrl = image.thumburl || originalUrl;
    const response = await fetch(downloadUrl, { headers, signal: AbortSignal.timeout(35000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image ${response.status}: ${page.title}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 30000000) throw new Error(`Oversized image: ${page.title}`);
    const converted = await sharp(bytes, { limitInputPixels: 60000000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const dimensions = await sharp(converted).metadata();
    await fs.writeFile(destination, converted);
    return {
        id, title: override.title || strip(page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ')), kind: override.kind || kind,
        localPath, sourceUrl: image.descriptionurl, originalUrl, author, ...rights,
        description: caption, topicIds: [], keywords: candidate.categories.split('|').filter(category => /patholog|histolog|smear|carcinoma|tumou?r|necro|inflamm|diagra/i.test(category)).slice(0, 10),
        width: dimensions.width, height: dimensions.height, bytes: converted.length, sha256: hash(converted),
        attribution: `${author}. ${strip(page.title.replace(/^File:/, ''))}. ${rights.license}. Resized and converted to WebP for Path Deck.`,
        sourceName: 'Wikimedia Commons', reviewed: false,
        transformation: { format: 'webp', maxDimension: 1600, quality: 84, sourceDerivative: image.thumburl ? 'thumbnail' : 'original' },
        importedAt: new Date().toISOString(), sourceRevision: image.timestamp,
    };
}

async function contactSheets(media) {
    const thumbWidth = 280, thumbHeight = 180, cellHeight = 230, columns = 4, count = 32;
    const escape = value => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]));
    for (let offset = 0; offset < media.length; offset += count) {
        const items = media.slice(offset, offset + count);
        const composites = [];
        for (let index = 0; index < items.length; index++) {
            const image = items[index];
            const x = index % columns * thumbWidth, y = Math.floor(index / columns) * cellHeight;
            composites.push({ input: await sharp(path.join(root, 'public', image.localPath)).resize(thumbWidth, thumbHeight, { fit: 'contain', background: '#ffffff' }).toBuffer(), left: x, top: y });
            const lines = [image.title.slice(0, 39), `${image.kind} | ${image.topicIds.join(', ').slice(0, 35)}`, image.id];
            const label = `<svg width="280" height="50"><rect width="280" height="50" fill="#f5f5f5"/>${lines.map((line, lineIndex) => `<text x="5" y="${12 + lineIndex * 15}" font-family="Arial" font-size="10">${escape(line)}</text>`).join('')}</svg>`;
            composites.push({ input: Buffer.from(label), left: x, top: y + thumbHeight });
        }
        await sharp({ create: { width: columns * thumbWidth, height: Math.ceil(items.length / columns) * cellHeight, channels: 3, background: '#dddddd' } }).composite(composites).jpeg({ quality: 85 }).toFile(path.join(root, `research/contact-sheet-${String(offset / count + 1).padStart(2, '0')}.jpg`));
    }
}

await fs.mkdir(cacheDirectory, { recursive: true });
await fs.mkdir(imageDirectory, { recursive: true });
const topics = await readJson(path.join(root, 'content/topics.json'), bootstrap);
const allTopics = Array.isArray(topics) ? topics : topics.topics;
const limit = Number(process.argv.find(argument => argument.startsWith('--limit='))?.split('=')[1]) || allTopics.length;
const requested = Number(process.argv.find(argument => argument.startsWith('--per-topic='))?.split('=')[1]) || 3;
const rejections = await readJson(rejectionFile, []);
const sourceOverrides = await readJson(overrideFile, {});
const rejected = (sourceUrl, topicId) => rejections.some(rejection => rejection.sourceUrl === sourceUrl && (!rejection.topicId || rejection.topicId === topicId));
const loadedMedia = (await readJson(mediaFile, [])).map(image => ({ ...image, kind: sourceOverrides[image.id]?.kind || classify(`${image.title} ${image.description} ${image.keywords.join(' ')}`.toLowerCase(), image.title) || image.kind, topicIds: (sourceOverrides[image.id]?.topicIds || image.topicIds).filter(topicId => !rejected(image.sourceUrl, topicId)) })).filter(image => image.topicIds.length && !nonHuman.test(`${image.title} ${image.description} ${image.keywords.join(' ')}`));
const cachedSources = new Map();
for (const filename of await fs.readdir(cacheDirectory)) {
    const result = await readJson(path.join(cacheDirectory, filename), null);
    for (const page of result?.pages || []) if (page.imageinfo?.[0]) cachedSources.set(page.imageinfo[0].descriptionurl, page);
}
const excludedAssociations = [];
for (const image of loadedMedia) {
    const source = cachedSources.get(image.sourceUrl);
    if (!source) continue;
    image.author = sourceAuthor(source.imageinfo[0]);
    const override = sourceOverrides[image.id] || {};
    if (override.author) image.author = override.author;
    if (override.description) image.description = override.description;
    if (override.title) image.title = override.title;
    if (override.kind) image.kind = override.kind;
    image.attribution = `${image.author}. ${strip(source.title.replace(/^File:/, ''))}. ${image.license}. Resized and converted to WebP for Path Deck.`;
    image.topicIds = image.topicIds.filter(topicId => {
        const topic = allTopics.find(item => item.id === topicId);
        if (!topic) return false;
        if (override.topicIds?.includes(topicId)) return true;
        const queries = [...(curatedQueries[topicId] || []), ...(topic.imageQueries || []), topic.name || topic.title, ...(topic.aliases || [])].filter(Boolean);
        if (queries.some(query => rank(source, query, topic))) return true;
        excludedAssociations.push({ sourceUrl: image.sourceUrl, topicId, reason: 'Source primary diagnosis does not establish the requested topic, or stricter rights/content checks rejected it.' });
        return false;
    });
}
const excludedByPolicy = [];
for (let index = loadedMedia.length - 1; index >= 0; index--) {
    const image = loadedMedia[index];
    const source = cachedSources.get(image.sourceUrl);
    if (!source) continue;
    const info = source.imageinfo[0];
    const sourceText = strip(`${source.title} ${info.extmetadata?.ImageDescription?.value || ''} ${info.extmetadata?.Categories?.value || ''}`);
    if (!licensed(info) || /ai.generated|pd.algorithm/i.test(sourceText) || /unknown|see source page/i.test(image.author) || !image.description.trim()) {
        excludedByPolicy.push({ sourceUrl: image.sourceUrl, reason: 'Per-file metadata indicates ambiguous third-party rights or AI-generated medical media.' });
        loadedMedia.splice(index, 1);
    }
}
const media = [];
const figureTitle = title => title.toLowerCase().replace(/\s*-?\s*censored version/g, '').replace(/\b(?:cropped|crop)\b/g, '').replace(/\s+/g, ' ').trim();
const figureKey = image => `${figureTitle(image.title)}|${image.author.toLowerCase()}`;
for (const image of loadedMedia) {
    if (!image.topicIds.length) continue;
    const existingIndex = media.findIndex(item => item.sha256 === image.sha256 || figureKey(item) === figureKey(image));
    const existingFigure = media[existingIndex];
    if (existingFigure) {
        const topicIds = [...new Set([...existingFigure.topicIds, ...image.topicIds])];
        if (/censored version/i.test(image.title) && !/censored version/i.test(existingFigure.title)) media[existingIndex] = { ...image, topicIds };
        else existingFigure.topicIds = topicIds;
    }
    else media.push(image);
}
const bySource = new Map(media.map(image => [image.sourceUrl, image]));
const errors = [];
let processed = 0;
const only = process.argv.find(argument => argument.startsWith('--only='))?.split('=')[1].split(',');
const selectedTopics = process.argv.includes('--audit-only') ? [] : allTopics.slice(0, limit).filter(topic => !only || only.includes(topic.id));
for (const topic of selectedTopics) {
    const topicId = topic.id;
    const existing = media.filter(image => image.topicIds.includes(topicId));
    if (existing.length >= requested) { processed++; continue; }
    const candidates = [];
    const queries = curatedQueries[topicId] || (topic.imageQueries?.length ? topic.imageQueries : [`${topic.name || topic.title} histopathology`, `${topic.name || topic.title} gross pathology`]);
    for (const query of queries.slice(0, 3)) {
        try {
            const result = await search(query);
            candidates.push(...result.pages.map(page => rank(page, query, topic)).filter(Boolean));
        } catch (error) {
            errors.push({ topicId, query, error: error.message });
            if (/rate limit|access blocked/.test(error.message)) { await writeJson(mediaFile, media); throw error; }
        }
    }
    // Commons captions often say "micrograph" rather than "histopathology".
    // A disease-name fallback avoids treating that vocabulary difference as absent coverage.
    const fallbackQuery = topic.aliases?.find(alias => alias.length > 3) || topic.name || topic.title;
    if (new Set(candidates.map(candidate => candidate.image.descriptionurl)).size < requested - existing.length && !queries.includes(fallbackQuery)) {
        try {
            const result = await search(fallbackQuery);
            candidates.push(...result.pages.map(page => rank(page, fallbackQuery, topic)).filter(Boolean));
        } catch (error) {
            errors.push({ topicId, query: fallbackQuery, error: error.message });
            if (/rate limit|access blocked/.test(error.message)) { await writeJson(mediaFile, media); throw error; }
        }
    }
    const seen = new Set(existing.map(image => image.sourceUrl));
    let added = 0;
    const ranked = [...new Map(candidates.sort((a, b) => b.score - a.score).map(candidate => [candidate.image.descriptionurl, candidate])).values()];
    const diverse = [];
    const kindsSeen = new Set(existing.map(image => image.kind));
    for (const candidate of ranked) {
        if (!kindsSeen.has(candidate.kind)) { diverse.push(candidate); kindsSeen.add(candidate.kind); }
    }
    for (const candidate of [...diverse, ...ranked]) {
        const source = candidate.image.descriptionurl;
        if (rejected(source, topicId)) continue;
        if (seen.has(source) || existing.length + added >= requested) continue;
        seen.add(source);
        try {
            let image = bySource.get(source);
            if (!image) {
                const title = strip(candidate.page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' '));
                const author = sourceAuthor(candidate.image);
                image = media.find(item => figureTitle(item.title) === figureTitle(title) && item.author.toLowerCase() === author.toLowerCase());
            }
            if (!image) {
                image = await download(candidate);
                media.push(image); bySource.set(source, image);
            }
            if (image.topicIds.includes(topicId)) continue;
            image.topicIds.push(topicId);
            added++;
        } catch (error) { errors.push({ topicId, source, error: error.message }); }
    }
    processed++;
    await writeJson(mediaFile, media);
    console.log(`${processed}/${Math.min(limit, allTopics.length)} ${topicId}: ${existing.length + added} images (${media.length} unique total)`);
}
for (const image of media) if (!image.bytes) image.bytes = (await fs.stat(path.join(root, 'public', image.localPath))).size;
await writeJson(mediaFile, media);
const retainedFiles = new Set(media.map(image => path.basename(image.localPath)));
let prunedFiles = 0;
for (const filename of await fs.readdir(imageDirectory)) {
    if (!/^commons-[a-f0-9]{16}\.webp$/.test(filename) || retainedFiles.has(filename)) continue;
    const file = path.resolve(imageDirectory, filename);
    if (path.dirname(file) !== path.resolve(imageDirectory)) throw new Error('Unsafe generated-image cleanup path');
    await fs.unlink(file);
    prunedFiles++;
}
const integrityFailures = [];
for (const image of media) {
    try {
        const bytes = await fs.readFile(path.join(root, 'public', image.localPath));
        const dimensions = await sharp(bytes).metadata();
        if (hash(bytes) !== image.sha256 || dimensions.width !== image.width || dimensions.height !== image.height || bytes.length !== image.bytes) throw new Error('Hash, dimensions or byte-size mismatch');
        if (!image.topicIds.length || image.topicIds.some(topicId => !allTopics.some(topic => topic.id === topicId))) throw new Error('Missing or unknown topic association');
    } catch (error) { integrityFailures.push({ id: image.id, error: error.message }); }
}
const licenses = {}, kinds = {};
for (const image of media) { licenses[image.license] = (licenses[image.license] || 0) + 1; kinds[image.kind] = (kinds[image.kind] || 0) + 1; }
await writeJson(path.join(root, 'research/media-audit.json'), {
    generatedAt: new Date().toISOString(), mediaCount: media.length, topicCount: allTopics.length,
    topicsWithMedia: allTopics.filter(topic => media.some(image => image.topicIds.includes(topic.id))).length,
    missingTopics: allTopics.filter(topic => !media.some(image => image.topicIds.includes(topic.id))).map(topic => ({ id: topic.id, name: topic.name || topic.title })),
    licenses, kinds, errors, excludedByPolicy, excludedAssociations, integrityFailures, prunedFiles,
    totalBytes: media.reduce((sum, image) => sum + image.bytes, 0),
    policy: 'Only documented CC0, public domain, CC BY or CC BY-SA. Third-party reprints and AI-generated medical media are excluded. License and source metadata are retained. Automated matching needs visual review.',
});
if (!process.argv.includes('--no-contact-sheets')) await contactSheets(media);
console.log(JSON.stringify({ complete: true, uniqueMedia: media.length, licenses, kinds, errors: errors.length }));
if (integrityFailures.length) process.exitCode = 1;
