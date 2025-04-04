
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCab84rBOO_ooUgZK51N3lEzUNQyQCzebQ",
  authDomain: "campuscare-26d25.firebaseapp.com",
  projectId: "campuscare-26d25",
  storageBucket: "campuscare-26d25.firebasestorage.app",
  messagingSenderId: "851214907640",
  appId: "1:851214907640:web:266dd9328c96df1e34a30d"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
