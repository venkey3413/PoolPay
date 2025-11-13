import { collection, addDoc, getDocs, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  totalPooled: number;
  status: 'active' | 'closed';
  createdAt: any;
  members: any[];
}

export const createGroup = async (groupData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...groupData,
      createdAt: new Date(),
      totalPooled: 0,
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const q = query(collection(db, 'groups'), where('createdBy', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
    callback(groups);
  });
};

export const getGroupById = async (groupId: string) => {
  try {
    const groupDoc = await getDocs(query(collection(db, 'groups'), where('__name__', '==', groupId)));
    if (!groupDoc.empty) {
      const doc = groupDoc.docs[0];
      return { id: doc.id, ...doc.data() } as Group;
    }
    return null;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
};