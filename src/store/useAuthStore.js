import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initializeAuthListener: () => {
    // Note: If using placeholder API keys, this will likely throw or do nothing
    // We will wrap it in a try-catch for safety during testing
    try {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Fetch user profile from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              set({ user, profile: { ...data, role: data.role || 'umpire' }, loading: false });
            } else {
              set({ user, profile: { displayName: 'User', role: 'umpire' }, loading: false });
            }
          } catch (e) {
            console.error("Firestore error (likely invalid config):", e);
            set({ user, profile: { displayName: 'User (Mock)' }, loading: false });
          }
        } else {
          set({ user: null, profile: null, loading: false });
        }
      });
    } catch (e) {
       console.error("Auth init error:", e);
       set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || email.split('@')[0],
        role: 'umpire',
        createdAt: new Date().toISOString()
      });
      set({ user: userCredential.user, loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ user: null, profile: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
