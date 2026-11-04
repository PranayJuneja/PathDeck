// Firebase configuration for Tissue Deck
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
} else {
    console.warn('Firebase not configured. Set VITE_FIREBASE_* environment variables to enable authentication.');
}

export { auth, googleProvider, isFirebaseConfigured };
