import { authenticate, getServices, json, countForMonth, getMonthKey, MONTHLY_LIMIT } from '../server/firebase.js';

export function createUsageHandler({ services = getServices } = {}) {
    return async function GET(request) {
        if (!request.headers.get('Authorization')?.startsWith('Bearer ')) return json({ error: 'Sign in to view your question allowance.' }, 401);
        let backend;
        try { backend = services(); } catch { return json({ error: 'Question allowance is temporarily unavailable.' }, 503); }
        const identity = await authenticate(request, backend);
        if (identity.response) return identity.response;
        try {
            const document = await backend.db.collection('path_deck_usage').doc(identity.user.uid).get();
            return json({ remaining: Math.max(0, MONTHLY_LIMIT - countForMonth(document.data(), getMonthKey())) });
        } catch { return json({ error: 'Question allowance is temporarily unavailable.' }, 503); }
    };
}
export const GET = createUsageHandler();
