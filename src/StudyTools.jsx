import { useEffect, useRef, useState } from 'react';
import { BookOpen, Columns2, Target, Bookmark, SlidersHorizontal, ChevronDown, Download, FileDown } from 'lucide-react';
import Offline from './Offline.jsx';
import './PathTools.css';

export default function StudyTools({ mode, onMode, savedOnly, onSavedOnly, bookmarked, onBookmark, kind, onKind, images, onExport }) {
    const [open, setOpen] = useState(false);
    const container = useRef(null);
    const first = useRef(null);
    useEffect(() => {
        if (!open) return;
        first.current?.focus();
        const outside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
        const escape = event => { if (event.key === 'Escape') { setOpen(false); container.current?.querySelector('button')?.focus(); } };
        document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);
    return <div className="pd-tools" ref={container}><button className={`pd-tools-trigger ${mode !== 'atlas' ? 'pd-selected' : ''}`} aria-expanded={open} aria-controls="path-study-tools" onClick={() => setOpen(!open)}><SlidersHorizontal size={15}/><span>{mode === 'compare' ? 'Comparing' : mode === 'practice' ? 'Spotters' : 'Study tools'}</span><ChevronDown size={12}/></button>{open && <div className="pd-tools-menu" id="path-study-tools" aria-label="Study tools"><div className="pd-tools-section"><small>WORKSPACE</small>{[['atlas','Atlas',BookOpen],['compare','Compare conditions',Columns2],['practice','Spotter practice',Target]].map(([id,label,Icon],index)=><button ref={index===0?first:null} key={id} onClick={()=>{onMode(id);setOpen(false);}} aria-pressed={mode===id}><Icon size={16}/><span>{label}</span>{mode===id&&<span className="pd-tools-dot"/>}</button>)}</div><div className="pd-tools-section"><small>REVISION</small><button onClick={onBookmark}><Bookmark size={15} fill={bookmarked?'currentColor':'none'}/>{bookmarked?'Remove bookmark':'Save this condition'}</button><button onClick={()=>{onSavedOnly(!savedOnly);setOpen(false);}}><BookOpen size={15}/>{savedOnly?'Show all conditions':'Browse saved conditions'}</button><button onClick={onExport}><FileDown size={15}/>Export progress</button></div><div className="pd-tools-section"><small>IMAGE TYPE</small><div className="pd-kind-buttons">{[['all','All'],['microscopy','Microscopy'],['gross','Gross'],['diagram','Diagrams']].map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>{onKind(id);setOpen(false);}}>{label}</button>)}</div></div><div className="pd-tools-section"><small><Download size={11}/> OFFLINE ATLAS</small><Offline images={images}/></div></div>}</div>;
}
