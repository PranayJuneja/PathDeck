import { config } from 'dotenv';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

config({ path: '.env.local', quiet: true });

export const MONTHLY_LIMIT = 100;
export const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

export function getServices() {
    if (!getApps().length) {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n').replace(/\\n/g, '\n'),
            };
        } else {
            throw new Error('Authentication service unavailable');
        }
        initializeApp({ credential: cert(serviceAccount) });
    }
    return { auth: getAuth(), db: getFirestore(), timestamp: () => FieldValue.serverTimestamp() };
}

export function json(data, status = 200) {
    return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function authenticate(req, services) {
    const header = req.headers.get('Authorization');
    if (!header?.startsWith('Bearer ') || !header.slice(7).trim()) {
        return { response: json({ error: 'Sign in to use Meded AI.' }, 401) };
    }
    try {
        return { user: await services.auth.verifyIdToken(header.slice(7)) };
    } catch {
        return { response: json({ error: 'Your session expired. Please sign in again.' }, 401) };
    }
}

export function countForMonth(data, monthKey) {
    return data?.monthKey === monthKey && Number.isFinite(data.messageCount) ? Math.max(0, data.messageCount) : 0;
}

export async function reserveMessage(db, user, monthKey, timestamp) {
    const ref = db.collection('path_deck_usage').doc(user.uid);
    return db.runTransaction(async transaction => {
        const doc = await transaction.get(ref);
        const count = countForMonth(doc.data(), monthKey);
        if (count >= MONTHLY_LIMIT) return null;
        transaction.set(ref, { monthKey, messageCount: count + 1, email: user.email || '', lastUsed: timestamp() }, { merge: true });
        return MONTHLY_LIMIT - count - 1;
    });
}
