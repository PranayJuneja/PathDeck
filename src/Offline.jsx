import { useEffect, useRef, useState } from 'react';
import { Download, Check, LoaderCircle, WifiOff } from 'lucide-react';

export default function Offline({ images }) {
    const [status, setStatus] = useState(null);
    const [online, setOnline] = useState(navigator.onLine);
    const [error, setError] = useState('');
    const lastProgress = useRef(0);
    useEffect(() => {
        const offline = () => setOnline(false);
        const online = () => setOnline(true);
        window.addEventListener('online', online); window.addEventListener('offline', offline);
        const message = event => { if (event.data?.type === 'CACHE_PROGRESS') { lastProgress.current = Date.now(); setError(''); setStatus(event.data); } };
        navigator.serviceWorker?.addEventListener('message', message);
        return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); navigator.serviceWorker?.removeEventListener('message', message); };
    }, []);
    useEffect(() => {
        if (!status?.running) return;
        const timer = setInterval(() => {
            if (Date.now() - lastProgress.current > 30000) {
                setStatus(previous => ({ ...previous, running: false }));
                setError('Download paused. Reconnect or tap Save offline to continue.');
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [status?.running]);
    const download = async () => {
        setError('');
        if (!navigator.serviceWorker?.controller) { setError(import.meta.env.DEV ? 'Use the production preview or installed app to save the atlas offline.' : 'Offline saving is preparing. Wait a moment, then retry.'); return; }
        if (!online) { setError('Reconnect to download more images. Previously saved images are still available.'); return; }
        lastProgress.current = Date.now();
        setStatus({ done: 0, total: images.length, running: true, failed: 0 });
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_MEDIA', paths: [...new Set(images.map(image => image.localPath))] });
    };
    const downloadMiB = Math.ceil(images.reduce((sum, image) => sum + (image.bytes || 0), 0) / 1024 / 1024);
    const complete = Boolean(status && !status.running && !status.failed && status.done === status.total && !error);
    return <div className="offline-control"><button className={`quiet-button ${status?.running ? 'downloading' : ''}`} onClick={download} disabled={status?.running || images.length === 0} title="Save images in the current system for offline study">{!online ? <WifiOff size={15} /> : status?.running ? <LoaderCircle className="spin" size={15} /> : complete ? <Check size={15} /> : <Download size={15} />}<span>{status?.running ? `Saving ${status.done}/${status.total}` : complete ? 'Saved offline' : 'Save offline'}</span></button><span className="pd-offline-size">{images.length} images · about {downloadMiB} MiB</span>{(error || (status && !status.running && status.failed > 0)) && <span className="offline-message" role="status">{error || (status.storageFull ? 'Browser storage is full. Free some space, then retry Save offline.' : `${status.failed} images need another download. Tap Save offline to retry.`)}</span>}</div>;
}
