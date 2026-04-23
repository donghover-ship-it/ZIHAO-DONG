import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import localforage from 'localforage';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
  }
};

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null) => {
  if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: user ? {
        userId: user.uid,
        email: user.email || '',
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        providerInfo: user.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        }))
      } : {
        userId: '',
        email: '',
        emailVerified: false,
        isAnonymous: true,
        providerInfo: []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

// Sync functions
export const syncCompetitorImagesToCloud = async (localImages: any) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  
  try {
    // We update Firestore using batch or individual writes.
    // For simplicity, we just loop and write.
    for (const categoryId of Object.keys(localImages)) {
      const images = localImages[categoryId];
      for (const img of images) {
        const docRef = doc(db, `users/${userId}/competitorImages/${img.id}`);
        await setDoc(docRef, {
          userId,
          categoryId,
          data: img.data,
          parsedData: img.parsedData || {},
          createdAt: img.createdAt || Date.now(),
          updatedAt: Date.now()
        }, { merge: true }).catch(e => handleFirestoreError(e, 'create', docRef.path));
      }
    }
  } catch (error) {
    console.error("Error syncing to cloud:", error);
  }
};

export const syncStructureLibraryToCloud = async (localLibrary: any) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  
  try {
    for (const category of Object.keys(localLibrary)) {
      const images = localLibrary[category];
      for (const img of images) {
        const docRef = doc(db, `users/${userId}/structureImages/${img.id}`);
        await setDoc(docRef, {
          userId,
          category,
          data: img.url || img.data,
          name: img.name || 'Unnamed',
          createdAt: img.addedAt || Date.now(),
          updatedAt: Date.now()
        }, { merge: true }).catch(e => handleFirestoreError(e, 'create', docRef.path));
      }
    }
  } catch (error) {
    console.error("Error syncing structure to cloud:", error);
  }
};

export const fetchCompetitorImagesFromCloud = async () => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  const result: Record<string, any[]> = {};
  
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/competitorImages`));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!result[data.categoryId]) result[data.categoryId] = [];
      result[data.categoryId].push({
        id: doc.id,
        data: data.data,
        parsedData: data.parsedData,
        createdAt: data.createdAt
      });
    });
    return result;
  } catch (error) {
    console.error("Error fetching competitor images:", error);
    return null;
  }
};

export const fetchStructureLibraryFromCloud = async () => {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  const result: Record<string, any[]> = {};
  
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/structureImages`));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!result[data.category]) result[data.category] = [];
      result[data.category].push({
        id: doc.id,
        url: data.data,
        name: data.name,
        addedAt: data.createdAt
      });
    });
    return result;
  } catch (error) {
    console.error("Error fetching structure images:", error);
    return null;
  }
};

export const deleteCompetitorImageFromCloud = async (imageId: string) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const docRef = doc(db, `users/${userId}/competitorImages/${imageId}`);
  await deleteDoc(docRef).catch(e => handleFirestoreError(e, 'delete', docRef.path));
};

export const deleteStructureImageFromCloud = async (imageId: string) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const docRef = doc(db, `users/${userId}/structureImages/${imageId}`);
  await deleteDoc(docRef).catch(e => handleFirestoreError(e, 'delete', docRef.path));
};

