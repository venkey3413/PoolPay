import { useState, useEffect } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface P2PTransaction {
  id: string;
  type: 'received' | 'used';
  amount: number;
  description: string;
  fromMember?: string;
  forExpense?: string;
  createdAt: Date;
  groupId?: string;
}

interface P2PTransactionDashboardProps {
  groupId?: string;
}

export function P2PTransactionDashboard({ groupId }: P2PTransactionDashboardProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<P2PTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'received' | 'used'>('received');
  
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    fromMember: '',
    forExpense: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [user, groupId]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      let q;
      if (groupId) {
        q = query(
          collection(db, 'p2p_transactions'),
          where('userId', '==', user.uid),
          where('groupId', '==', groupId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'p2p_transactions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const txns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as P2PTransaction[];
      
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      alert('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      const txnData = {
        userId: user?.uid,
        groupId: groupId || null,
        type: formType,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        fromMember: formType === 'received' ? newTransaction.fromMember : null,
        forExpense: formType === 'used' ? newTransaction.forExpense : null,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'p2p_transactions'), txnData);
      
      setNewTransaction({ amount: '', description: '', fromMember: '', forExpense: '' });
      setShowAddForm(false);
      loadTransactions();
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const totalReceived = transactions
    .filter(t => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalUsed = transactions
    .filter(t => t.type === 'used')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalReceived - totalUsed;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold">P2P Transaction Dashboard</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Total Received</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{totalReceived.toFixed(2)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Total Used</span>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{totalUsed.toFixed(2)}</p>
        </div>
        
        <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className={`w-4 h-4 ${balance >= 0 ? 'text-blue-600' : 'text-yellow-600'}`} />
            <span className={`text-sm font-medium ${balance >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
              Current Balance
            </span>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
            ₹{balance.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">{transactions.length}</p>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-3">Add New Transaction</h4>
          
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setFormType('received')}
              className={`px-3 py-1 rounded text-sm ${
                formType === 'received' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Money Received
            </button>
            <button
              onClick={() => setFormType('used')}
              className={`px-3 py-1 rounded text-sm ${
                formType === 'used' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Money Used
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="number"
              placeholder="Amount"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {formType === 'received' && (
            <input
              type="text"
              placeholder="From Member (optional)"
              value={newTransaction.fromMember}
              onChange={(e) => setNewTransaction({ ...newTransaction, fromMember: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
          )}
          
          {formType === 'used' && (
            <input
              type="text"
              placeholder="For Expense (optional)"
              value={newTransaction.forExpense}
              onChange={(e) => setNewTransaction({ ...newTransaction, forExpense: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleAddTransaction}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h4 className="font-medium mb-3">Transaction History</h4>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transactions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {transaction.type === 'received' ? (
                    <Plus className="w-4 h-4 text-green-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="text-sm text-gray-500">
                      {transaction.fromMember && <span>From: {transaction.fromMember} • </span>}
                      {transaction.forExpense && <span>For: {transaction.forExpense} • </span>}
                      <span>{transaction.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'received' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}