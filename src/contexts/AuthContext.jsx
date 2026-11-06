import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [signingIn, setSigningIn] = useState(false);
    const [loading, setLoading] = useState(Boolean(isFirebaseConfigured && auth));

    useEffect(() => {
        // If Firebase isn't configured, skip auth state listener
        if (!isFirebaseConfigured || !auth) {
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        setAuthError(null);
        if (!isFirebaseConfigured || !auth || !googleProvider) {
            setAuthError('Sign-in is temporarily unavailable. Please try again later.');
            return;
        }
        setSigningIn(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Sign in error:', error);
            const messages = {
                'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for Path Deck, then try again.',
                'auth/popup-closed-by-user': 'Sign-in was closed before it finished. Tap the lock to try again.',
                'auth/network-request-failed': 'Could not connect to Google sign-in. Check your connection and try again.',
                'auth/unauthorized-domain': 'Sign-in is unavailable on this address. Open Path Deck from its production link and try again.',
            };
            setAuthError(messages[error.code] || 'Google sign-in could not finish. Please try again.');
        } finally {
            setSigningIn(false);
        }
    };

    const logout = async () => {
        if (auth) {
            await signOut(auth);
        }
    };

    const getIdToken = useCallback(async () => {
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            authError,
            signingIn,
            signInWithGoogle,
            logout,
            getIdToken,
            isConfigured: isFirebaseConfigured
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
