import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
        if (!isFirebaseConfigured || !auth || !googleProvider) {
            console.warn('Firebase not configured. Cannot sign in.');
            alert('Authentication is not configured yet. Please set up Firebase environment variables.');
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Sign in error:', error);
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
