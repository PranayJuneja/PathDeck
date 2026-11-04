import { useState } from 'react';
import { Columns2, ArrowLeftRight, Sparkles } from 'lucide-react';
import Viewer from './Viewer.jsx';

function Specimen({ topic, onSource, onDiscuss, onSelectionChange }) {
    const [imageId, setImageId] = useState(topic.media[0]?.id);
    const image = topic.media.find(item => item.id === imageId) || topic.media[0];
    return <><Viewer key={image?.id || topic.id} images={topic.media} image={image} onChange={id => { setImageId(id); onSelectionChange?.(); }} onSource={onSource} compact /><div className="comparison-points">{onDiscuss && <button className="text-button" onClick={() => onDiscuss(topic, image)}><Sparkles size={14}/> Ask tutor about this image</button>}<h3>Identification features</h3><ul>{topic.microscopy?.slice(0, 4).map(point => <li key={point}>{point}</li>)}</ul>{topic.stains?.length > 0 && <p className="stain-summary"><strong>Stains:</strong> {topic.stains.join(' · ')}</p>}</div></>;
}

export default function Compare({ topic, topics, onSource, onDiscuss, onSelectionChange }) {
    const [leftId, setLeftId] = useState(topic.id);
    const differential = topics.find(item => topic.differentials?.some(other => other.name.toLowerCase() === item.name.toLowerCase()));
    const [rightId, setRightId] = useState(differential?.id || topics.find(item => item.id !== topic.id && item.system === topic.system)?.id || topics.find(item => item.id !== topic.id)?.id);
    const left = topics.find(item => item.id === leftId) || topic;
    const right = topics.find(item => item.id === rightId) || topics[0];
    const distinguishing = left.differentials?.find(item => item.name.toLowerCase() === right.name.toLowerCase()) || right.differentials?.find(item => item.name.toLowerCase() === left.name.toLowerCase());
    return <section className="compare-view"><div className="compare-intro"><div><span className="eyebrow"><Columns2 size={14} /> COMPARE THE PATTERN</span><h2>Find the difference that matters.</h2></div><button className="quiet-button" onClick={() => { setLeftId(rightId); setRightId(leftId); onSelectionChange?.(); }}><ArrowLeftRight size={16} /> Swap</button></div>{distinguishing && <p className="distinction-callout">{distinguishing.distinction}</p>}<div className="compare-grid">{[[left, setLeftId, 'First condition'], [right, setRightId, 'Second condition']].map(([item, setter, label]) => <article className="compare-column" key={label}><label className="compare-select"><span>{label}</span><select aria-label={label} value={item.id} onChange={event => { setter(event.target.value); onSelectionChange?.(); }}>{topics.map(option => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label><p className="compare-definition">{item.definition}</p><Specimen key={item.id} topic={item} onSource={onSource} onDiscuss={onDiscuss} onSelectionChange={onSelectionChange} /></article>)}</div></section>;
}
