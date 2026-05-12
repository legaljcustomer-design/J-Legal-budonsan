import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Property } from '../types';

const PROPERTIES_COLLECTION = 'properties';
const ADMINS_COLLECTION = 'admins';

export const firebaseService = {
  // Check if current user is admin
  async checkAdminStatus(uid: string): Promise<boolean> {
    try {
      const docRef = doc(db, ADMINS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Error checking admin status", error);
      return false;
    }
  },

  // Public: Get all properties
  async getProperties(type?: string): Promise<Property[]> {
    const path = PROPERTIES_COLLECTION;
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (type && type !== 'all') {
        q = query(collection(db, path), where('type', '==', type), orderBy('createdAt', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Admin: Add property
  async addProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<string> {
    const path = PROPERTIES_COLLECTION;
    if (!auth.currentUser) throw new Error("Auth required");
    
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return "";
    }
  },

  // Admin: Update property
  async updateProperty(id: string, data: Partial<Property>): Promise<void> {
    const path = `${PROPERTIES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, PROPERTIES_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Admin: Delete property
  async deleteProperty(id: string): Promise<void> {
    const path = `${PROPERTIES_COLLECTION}/${id}`;
    try {
      await deleteDoc(doc(db, PROPERTIES_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Public: Get single property
  async getPropertyById(id: string): Promise<Property | null> {
    const path = `${PROPERTIES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, PROPERTIES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Property;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Site Settings
  async getSettings(): Promise<any> {
    const path = 'settings/general';
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, path);
       return null;
    }
  },

  async updateSettings(data: any): Promise<void> {
    if (!auth.currentUser) throw new Error("Auth required");
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'settings/general');
    }
  },

  // Reviews
  async getReviews(): Promise<any[]> {
    const path = 'reviews';
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
       handleFirestoreError(error, OperationType.LIST, path);
       return [];
    }
  },

  async addReview(data: any): Promise<string> {
    if (!auth.currentUser) throw new Error("Auth required");
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'reviews');
       return "";
    }
  },

  async deleteReview(id: string): Promise<void> {
    if (!auth.currentUser) throw new Error("Auth required");
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
    }
  },

  async updateReview(id: string, data: any): Promise<void> {
    if (!auth.currentUser) throw new Error("Auth required");
    try {
      const docRef = doc(db, 'reviews', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `reviews/${id}`);
    }
  }
};
