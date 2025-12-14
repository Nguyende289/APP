
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  Firestore,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { FirebaseConfig, AppData } from '../types';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Define collection names
const COLLECTIONS = {
  TRAFFIC_ACCIDENTS: 'trafficAccidents',
  VEHICLE_REGISTRATIONS: 'vehicleRegistrations',
  EVENTS: 'events',
  DAILY_TASKS: 'dailyTasks',
  VERIFICATION_REQUESTS: 'verificationRequests',
  ADVISORY_DOCUMENTS: 'advisoryDocuments',
  SETTINGS: 'settings' // For templates
};

export const initFirebase = (config: FirebaseConfig) => {
  if (!config.enabled || !config.apiKey) return false;

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// --- Real-time Listeners ---

export const subscribeToCollection = <T>(
  collectionName: string, 
  callback: (data: T[]) => void
) => {
  if (!db) return () => {};

  const colRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(colRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const data: T[] = [];
    snapshot.forEach((doc) => {
      // We assume the doc.id is part of the data object, but we also ensure it is set
      data.push({ ...doc.data(), id: doc.id } as unknown as T);
    });
    callback(data);
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error);
  });

  return unsubscribe;
};

// --- CRUD Operations ---

export const addItemToFirebase = async (collectionName: string, item: any) => {
  if (!db) return;
  try {
    // If item already has an ID, use setDoc to preserve it, otherwise addDoc
    if (item.id) {
        const docRef = doc(db, collectionName, item.id);
        await setDoc(docRef, item);
    } else {
        await addDoc(collection(db, collectionName), item);
    }
  } catch (e) {
    console.error(`Error adding to ${collectionName}:`, e);
  }
};

export const updateItemInFirebase = async (collectionName: string, item: any) => {
  if (!db || !item.id) return;
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (e) {
    console.error(`Error updating in ${collectionName}:`, e);
  }
};

export const deleteItemFromFirebase = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error(`Error deleting from ${collectionName}:`, e);
  }
};

// --- Full Data Sync (One-time push) ---
// Used when migrating from Local/Sheets to Firebase
export const pushAllDataToFirebase = async (data: AppData) => {
    if (!db) throw new Error("Firebase not initialized");
    
    // Helper to batch push
    const pushList = async (list: any[], colName: string) => {
        for (const item of list) {
            await addItemToFirebase(colName, item);
        }
    };

    await pushList(data.trafficAccidents, COLLECTIONS.TRAFFIC_ACCIDENTS);
    await pushList(data.vehicleRegistrations, COLLECTIONS.VEHICLE_REGISTRATIONS);
    await pushList(data.events, COLLECTIONS.EVENTS);
    await pushList(data.dailyTasks, COLLECTIONS.DAILY_TASKS);
    await pushList(data.verificationRequests, COLLECTIONS.VERIFICATION_REQUESTS);
    await pushList(data.advisoryDocuments, COLLECTIONS.ADVISORY_DOCUMENTS);
    
    // Save templates
    if (data.responseDocumentTemplates) {
         await setDoc(doc(db, COLLECTIONS.SETTINGS, 'templates'), {
             list: data.responseDocumentTemplates,
             selectedId: data.selectedDocumentTemplateId
         });
    }
};
