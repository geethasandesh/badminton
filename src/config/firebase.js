import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB05EegtxUYJC8skqVwqe67k8QnKpe2MX4",
  authDomain: "baddie-12cfd.firebaseapp.com",
  projectId: "baddie-12cfd",
  storageBucket: "baddie-12cfd.firebasestorage.app",
  messagingSenderId: "272868686230",
  appId: "1:272868686230:web:173f7660b743d6571ec5b7",
  measurementId: "G-5R5X07KZPX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
