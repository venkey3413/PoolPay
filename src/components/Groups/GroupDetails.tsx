import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Wallet, Send, CreditCard, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SendPaymentRequest } from '../Payments/SendPaymentRequest';
import { PaymentRequestsList } from '../Payments/PaymentRequestsList';
import { MakePayment } from '../Payments/MakePayment';
import { TransactionHistory } from '../Transactions/TransactionHistory';

interface GroupDetailsProps {
  groupId: string;
  onBack: () => void;
}

interface Group {
  id: string;
  name: string;
  description: string;
  total_pooled: number;
  status: 'active' | 'closed';
  created_by: string;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  upi_id: string;
  role: 'admin' | 'member';
}

export function GroupDetails({ groupId, onBack }: GroupDetailsProps) {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'payment' | 'history'>('overview');

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    setLoading(true);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      const current = membersData?.find((m) => m.user_id === user?.id);
      setCurrentMember(current || null);
    } catch (error) {
      console.error('Error loading group details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Group not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-700">
          Go Back
        </button>
      </div>
    );
  }

  const isAdmin = currentMember?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Groups
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
            <p className="text-gray-600">{group.description}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              group.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {group.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Total Pooled</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{group.total_pooled.toFixed(2)}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{members.length}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Your Role</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 capitalize">{currentMember?.role || 'Member'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5 inline-block mr-2" />
            Payment Requests
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'payment'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-5 h-5 inline-block mr-2" />
            Make Payment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline-block mr-2" />
            History
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Members</h3>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{member.display_name}</p>
                    <p className="text-sm text-gray-600">{member.upi_id || 'No UPI ID'}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {isAdmin && (
                <SendPaymentRequest
                  groupId={groupId}
                  members={members}
                  onRequestSent={loadGroupDetails}
                />
              )}
              <PaymentRequestsList
                groupId={groupId}
                currentMemberId={currentMember?.id || ''}
                onRequestUpdated={loadGroupDetails}
              />
            </div>
          )}

          {activeTab === 'payment' && (
            <MakePayment
              groupId={groupId}
              availableBalance={group.total_pooled}
              onPaymentMade={loadGroupDetails}
            />
          )}

          {activeTab === 'history' && (
            <TransactionHistory groupId={groupId} />
          )}
        </div>
      </div>
    </div>
  );
}
