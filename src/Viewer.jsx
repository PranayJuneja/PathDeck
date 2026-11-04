import { useMemo } from 'react';
import { Info } from 'lucide-react';
import SlideViewer from './components/SlideViewer.jsx';

export default function Viewer({ images, image, onChange, onSource, conceal = false }) {
    const tissue = useMemo(() => ({ name: conceal ? 'Pathology practice specimen' : image?.title || 'Pathology specimen', slides: { default: images.map(item => item.localPath) } }), [images, image, conceal]);
    if (!image) return <div className="path-viewer" style={{display:'grid',placeItems:'center',color:'#b5a7c8',padding:25,textAlign:'center'}}>This condition currently has study notes. Choose another condition for an image.</div>;
    const index = images.findIndex(item => item.id === image.id);
    const select = next => { const selected = typeof next === 'function' ? next(index) : next; if(images[selected]) onChange(images[selected].id); };
    return <div className="path-viewer"><SlideViewer tissue={tissue} currentSlideIndex={index} setCurrentSlideIndex={select} concealSource={conceal}/>{!conceal&&<button className="pd-source-trigger" aria-label="Image source and licence" onClick={()=>onSource(image)}><Info size={15}/></button>}</div>;
}
