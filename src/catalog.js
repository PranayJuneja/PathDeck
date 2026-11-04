import topics from '../content/topics.json';
import media from '../content/media.json';
import diagrams from '../content/diagrams.json';

export const kindLabels = { microscopy: 'Microscopy', gross: 'Gross specimen', diagram: 'Diagram', clinical: 'Clinical image', radiology: 'Radiology' };
export const allMedia = [...media, ...diagrams.map(image => ({ ...image, kind: 'diagram', localPath: image.path, sourceName: 'Path Deck original', attribution: `${image.author} · ${image.license}`, reviewed: true }))];
export const systems = [...new Set(topics.map(topic => topic.system))];
const mediaMap = new Map(topics.map(topic => [topic.id, allMedia.filter(image => image.topicIds?.includes(topic.id))]));
export const catalog = topics.map(topic => ({ ...topic, media: mediaMap.get(topic.id) || [] }));
export const topicById = new Map(catalog.map(topic => [topic.id, topic]));
export const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
export function matchesTopic(topic, search) {
    const terms = normalize(search).trim().split(/\s+/).filter(Boolean);
    const text = normalize([topic.name, topic.system, topic.category, ...(topic.aliases || []), ...(topic.microscopy || []), ...(topic.stains || [])].join(' '));
    return terms.every(term => text.includes(term));
}
