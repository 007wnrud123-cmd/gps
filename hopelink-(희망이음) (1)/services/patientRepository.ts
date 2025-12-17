import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';
import { PatientData } from '../types';
import { INITIAL_MOCK_DATA } from '../constants';

// Firebase Instance
let db: any = null;

if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 Firebase Connected");
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
}

const COLLECTION_NAME = 'patients';
const LOCAL_STORAGE_KEY = 'hopeLinkData';

// --- Interface Definition ---
export const patientRepository = {
  // 1. Subscribe to Data (Real-time listener)
  subscribe: (callback: (data: PatientData[]) => void) => {
    if (isFirebaseConfigured() && db) {
      // --- Firebase Mode ---
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PatientData));
        callback(patients);
      });
      
      return unsubscribe; // Return cleanup function
    } else {
      // --- Local Storage Mode ---
      const loadLocal = () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          callback(JSON.parse(saved));
        } else {
          // Initialize mock data if empty
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
          callback(INITIAL_MOCK_DATA);
        }
      };

      loadLocal();

      // Listen for storage events (changes from other tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEY) {
          loadLocal();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Custom event for same-tab updates
      window.addEventListener('local-data-update', loadLocal);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('local-data-update', loadLocal);
      };
    }
  },

  // 2. Add Data
  add: async (patient: PatientData) => {
    if (isFirebaseConfigured() && db) {
      // --- Firebase Mode ---
      // We don't need to manually set ID, firestore does it. But our type expects it.
      // We'll let Firestore generate ID, but pass other fields.
      const { id, ...dataWithoutId } = patient;
      await addDoc(collection(db, COLLECTION_NAME), {
        ...dataWithoutId,
        createdAt: serverTimestamp() // Add timestamp for sorting
      });
    } else {
      // --- Local Storage Mode ---
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const currentData: PatientData[] = saved ? JSON.parse(saved) : [];
      const newData = [patient, ...currentData];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      window.dispatchEvent(new Event('local-data-update'));
    }
  },

  // 3. Delete Data
  delete: async (id: string) => {
    if (isFirebaseConfigured() && db) {
      // --- Firebase Mode ---
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } else {
      // --- Local Storage Mode ---
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const currentData: PatientData[] = saved ? JSON.parse(saved) : [];
      const newData = currentData.filter(p => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      window.dispatchEvent(new Event('local-data-update'));
    }
  },

  // 4. Get Next Sequence Number
  getNextSequence: (currentData: PatientData[]) => {
    return currentData.length > 0 ? Math.max(...currentData.map(p => p.sequenceNumber || 0)) + 1 : 1;
  },

  // 5. Check Mode
  isLiveMode: () => isFirebaseConfigured()
};