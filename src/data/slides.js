import topics from '../../content/topics.json';
import media from '../../content/media.json';
import diagrams from '../../content/diagrams.json';

const images = [...media, ...diagrams.map(image => ({ ...image, kind: 'diagram', localPath: image.path, sourceName: 'Path Deck original' }))];
export const imageByPath = new Map(images.map(image => [image.localPath, image]));
export const imagesByTopic = new Map();
const slides = topics.map(topic => {
 const available = images.filter(image => image.topicIds.includes(topic.id));
 const ordered = ['microscopy', 'gross', 'diagram', 'clinical', 'radiology'].flatMap(kind => available.filter(image => image.kind === kind));
 imagesByTopic.set(topic.id, ordered);
 return { ...topic, category: topic.system, section: null, subsection: null, description: topic.definition,
   theory: { features: topic.microscopy, location: topic.gross, function: topic.clinical, pathogenesis: topic.pathogenesis, stains: topic.stains, examTips: topic.examTips.join(' '), differentials: topic.differentials, references: topic.references },
   slides: { low: ordered.filter(image => image.kind === 'microscopy').map(image => image.localPath), medium: ordered.filter(image => image.kind === 'gross').map(image => image.localPath), high: ordered.filter(image => image.kind === 'diagram').map(image => image.localPath), default: ordered.filter(image => !['microscopy','gross','diagram'].includes(image.kind)).map(image => image.localPath) }
 };
});
export default slides;
