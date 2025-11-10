import { useState, useEffect } from 'react';
import { Wallet, Send, QrCode } from 'lucide-react';
import { MerchantPayment } from '../Payments/MerchantPayment';
import { PaymentRequestsList } from '../Payments/PaymentRequestsList';
import { ExpenseTracker } from '../Expenses/ExpenseTracker';
import { Group } from '../../types';

interface GroupWalletProps {
  group: Group;
  onRefresh: () => void;
}

export function GroupWallet({ group, onRefresh }: GroupWalletProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'expenses' | 'pay' | 'requests'>('balance');

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Group Wallet</h2>
              <p className="text-gray-600">{group.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Pooled</p>
            <p className="text-3xl font-bold text-green-600">₹{group.totalPooled.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-3 px-4 text-center whitespace-nowrap ${activeTab === 'balance' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Balance
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-3 px-4 text-center whitespace-nowrap ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('pay')}
          className={`flex-1 py-3 px-4 text-center whitespace-nowrap ${activeTab === 'pay' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Pay Merchant
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 text-center whitespace-nowrap ${activeTab === 'requests' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Requests
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Member Contributions</h3>
            {group.members.map(member => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>{member.displayName}</span>
                <span className="font-medium">₹{member.contributedAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pay' && (
          <MerchantPayment
            groupId={group.id}
            availableBalance={group.totalPooled}
            onPaymentComplete={onRefresh}
          />
        )}

        {activeTab === 'requests' && (
          <PaymentRequestsList groupId={group.id} />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTracker groupId={group.id} members={group.members} />
        )}
      </div>
    </div>
  );
}