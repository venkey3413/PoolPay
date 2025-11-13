import { collection, addDoc, doc, updateDoc, query, where, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PaymentRequest, Transaction } from '../types';

export const sendPaymentRequest = async (groupId: string, fromUserId: string, toUserId: string, amount: number) => {
  await addDoc(collection(db, 'paymentRequests'), {
    groupId,
    fromUserId,
    toUserId,
    amount,
    status: 'pending',
    requestedAt: new Date()
  });
};

export const acceptPaymentRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'paymentRequests', requestId), {
    status: 'accepted',
    respondedAt: new Date()
  });
};

export const rejectPaymentRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'paymentRequests', requestId), {
    status: 'rejected',
    respondedAt: new Date()
  });
};

export const getPaymentRequests = (userId: string, callback: (requests: PaymentRequest[]) => void) => {
  const q = query(collection(db, 'paymentRequests'), where('toUserId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PaymentRequest[];
    callback(requests);
  });
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, 'transactions'), {
    ...transaction,
    createdAt: new Date()
  });
};

export const payMerchant = async (groupId: string, merchantUpiId: string, amount: number, merchantName: string) => {
  // Create payment transaction
  await addTransaction({
    groupId,
    userId: 'system',
    type: 'payment_out',
    amount,
    description: `Payment to ${merchantName}`,
    merchantName,
    upiTransactionId: `UPI_${Date.now()}`
  });

  // Update group balance
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    totalPooled: increment(-amount)
  });
};

export const processUPIPayment = (merchantId: string, amount: number, merchantName: string) => {
  // Check if it's phone number or UPI ID
  const isPhoneNumber = /^\d{10}$/.test(merchantId);
  const payeeAddress = isPhoneNumber ? `${merchantId}@paytm` : merchantId;
  
  // Generate UPI payment URL
  const upiUrl = `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
  
  // Open UPI app
  if (navigator.userAgent.match(/Android/i)) {
    window.location.href = upiUrl;
  } else {
    window.open(upiUrl, '_blank');
  }
};

export const sendUPIRequest = async (groupId: string, memberUpiId: string, amount: number, description: string) => {
  // Generate UPI collect request
  const collectUrl = `upi://pay?pa=${memberUpiId}&pn=PoolPay&am=${amount}&tn=${encodeURIComponent(description)}&mode=02`;
  
  // Store request in Firebase
  await addDoc(collection(db, 'paymentRequests'), {
    groupId,
    memberUpiId,
    amount,
    description,
    status: 'pending',
    requestedAt: new Date()
  });
  
  return collectUrl;
};