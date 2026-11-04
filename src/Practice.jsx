import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, X, RotateCcw, Target, Eye, Trophy } from 'lucide-react';
import Viewer from './Viewer.jsx';

const shuffled = values => [...values].sort(() => Math.random() - 0.5);
function nextQuestion(pool, previousId) {
    const eligible = pool.filter(topic => topic.media.some(image => ['microscopy', 'gross'].includes(image.kind)));
    if (eligible.length < 4) return null;
    const topic = shuffled(eligible.filter(item => item.id !== previousId))[0] || eligible[0];
    const image = shuffled(topic.media.filter(image => ['microscopy', 'gross'].includes(image.kind)))[0];
    const sameSystem = eligible.filter(item => item.system === topic.system && !image.topicIds.includes(item.id));
    const others = [...shuffled(sameSystem), ...shuffled(eligible.filter(item => item.system !== topic.system && !image.topicIds.includes(item.id)))];
    return { topic, image, options: shuffled([topic, ...others.slice(0, 3)]) };
}

export default function Practice({ topics, progress, setProgress, onStudy, system }) {
    const pool = useMemo(() => system === 'All systems' ? topics : topics.filter(topic => topic.system === system), [topics, system]);
    const [question, setQuestion] = useState(() => nextQuestion(pool));
    const [answer, setAnswer] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const choose = useCallback(id => {
        if (answer || revealed || !question) return;
        setAnswer(id);
        setRevealed(true);
        const correct = id === question.topic.id;
        setProgress(previous => ({
            ...previous, attempts: (previous.attempts || 0) + 1, correct: (previous.correct || 0) + (correct ? 1 : 0),
            streak: correct ? (previous.streak || 0) + 1 : 0,
            topics: { ...previous.topics, [question.topic.id]: { attempts: (previous.topics?.[question.topic.id]?.attempts || 0) + 1, correct: (previous.topics?.[question.topic.id]?.correct || 0) + (correct ? 1 : 0), lastPractised: new Date().toISOString() } },
        }));
    }, [answer, revealed, question, setProgress]);
    useEffect(() => {
        const keyboard = event => {
            if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.ctrlKey || event.metaKey) return;
            const index = Number(event.key) - 1;
            if (index >= 0 && index < 4 && question && !answer && !revealed) choose(question.options[index].id);
        };
        window.addEventListener('keydown', keyboard);
        return () => window.removeEventListener('keydown', keyboard);
    }, [choose, question, answer, revealed]);
    if (!question) return <section className="practice-intro"><Target size={38} /><h2>Choose a broader practice set</h2><p>This system needs at least four illustrated conditions for useful answer choices. Choose “All systems” to practise across the atlas.</p></section>;
    const correct = answer === question.topic.id;
    return <div className="practice-layout"><div className="practice-specimen"><div className="section-heading"><span className="eyebrow">SPOTTER PRACTICE</span><span className="practice-modality">{question.image.kind === 'gross' ? 'Gross specimen' : 'Microscopic field'}</span></div><Viewer key={question.image.id} images={[question.image]} image={question.image} onChange={() => {}} onSource={() => {}} conceal /><p className="practice-footnote">Some source images contain labels. Identify the overall pattern before reading any annotations.</p></div><aside className="practice-answers"><div className="practice-score"><span><Target size={15} />{progress.attempts || 0} attempts</span><span><Trophy size={15} />{progress.attempts ? Math.round(progress.correct / progress.attempts * 100) : 0}% accuracy</span></div><h2>What is the most likely diagnosis?</h2><p className="muted">Look at the architecture, cell population and background. Choose the best match.</p><div className="answer-options">{question.options.map((topic, index) => <button key={topic.id} onClick={() => choose(topic.id)} disabled={Boolean(answer) || revealed} className={`answer-option ${answer && topic.id === question.topic.id ? 'correct' : answer === topic.id ? 'incorrect' : ''}`}><span className="answer-key">{index + 1}</span><span>{topic.name}</span>{answer && topic.id === question.topic.id ? <Check size={18} /> : answer === topic.id ? <X size={18} /> : null}</button>)}</div>{revealed ? <div className={`answer-explanation ${correct ? 'is-correct' : ''}`} aria-live="polite"><span className="eyebrow">{answer ? correct ? 'WELL SPOTTED' : 'PATTERN TO REVISIT' : 'ANSWER'}</span><h3>{question.topic.name}</h3><p>{question.topic.microscopy?.[0]}</p><p>{question.topic.microscopy?.[1]}</p><button className="text-button" onClick={() => onStudy(question.topic.id)}>Review this topic <ArrowRight size={14} /></button><button className="primary-button" onClick={() => { setQuestion(nextQuestion(pool, question.topic.id)); setAnswer(null); setRevealed(false); }}>Next specimen <ArrowRight size={16} /></button></div> : <button className="quiet-button reveal-button" onClick={() => setRevealed(true)}><Eye size={16} /> Reveal without scoring</button>}<button className="text-button practice-restart" onClick={() => { setQuestion(nextQuestion(pool, question.topic.id)); setAnswer(null); setRevealed(false); }}><RotateCcw size={13} /> Skip specimen</button></aside></div>;
}
