import { useCallback, useState } from 'react';

export function readSaved(key, fallback) {
    try { return JSON.parse(localStorage.getItem(`path-deck:${key}`)) ?? fallback; } catch { return fallback; }
}

export function useSaved(key, fallback) {
    const [value, setValue] = useState(() => readSaved(key, fallback));
    const save = useCallback(next => {
        setValue(previous => {
            const result = typeof next === 'function' ? next(previous) : next;
            try { localStorage.setItem(`path-deck:${key}`, JSON.stringify(result)); } catch { /* Browsing remains available when storage is full. */ }
            return result;
        });
    }, [key]);
    return [value, save];
}

export function exportProgress(bookmarks, progress) {
    const blob = new Blob([JSON.stringify({ app: 'Path Deck', exportedAt: new Date().toISOString(), bookmarks, progress }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'path-deck-progress.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
