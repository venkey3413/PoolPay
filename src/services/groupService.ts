import { collection, addDoc, doc, updateDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group, GroupMember } from '../types';

export const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'members'>) => {
  const docRef = await addDoc(collection(db, 'groups'), {
    ...groupData,
    createdAt: new Date(),
    members: []
  });
  return docRef.id;
};

export const addMemberToGroup = async (groupId: string, member: Omit<GroupMember, 'id' | 'joinedAt'>) => {
  await addDoc(collection(db, 'groupMembers'), {
    ...member,
    groupId,
    joinedAt: new Date(),
    contributedAmount: 0
  });
};

export const getUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const q = query(collection(db, 'groupMembers'), where('userId', '==', userId));
  return onSnapshot(q, async (snapshot) => {
    const memberDocs = snapshot.docs;
    const groupIds = memberDocs.map(doc => doc.data().groupId);
    
    if (groupIds.length === 0) {
      callback([]);
      return;
    }

    const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
    const groupsSnapshot = await getDocs(groupsQuery);
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
    
    callback(groups);
  });
};