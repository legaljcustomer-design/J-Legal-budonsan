import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
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
  }
};
