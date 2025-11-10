import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentRequest {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  requested_at: string;
  member: {
    display_name: string;
    upi_id: string;
  };
}

interface PaymentRequestsListProps {
  groupId: string;
  currentMemberId: string;
  onRequestUpdated: () => void;
}

export function PaymentRequestsList({
  groupId,
  currentMemberId,
  onRequestUpdated,
}: PaymentRequestsListProps) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [groupId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          member:group_members(display_name, upi_id)
        `)
        .eq('group_id', groupId)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((req) => ({
        ...req,
        member: Array.isArray(req.member) ? req.member[0] : req.member,
      })) || [];

      setRequests(formattedData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'accepted' | 'rejected', amount: number) => {
    setActionLoading(requestId);

    try {
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        const { error: txError } = await supabase.from('transactions').insert({
          group_id: groupId,
          member_id: currentMemberId,
          type: 'pool_in',
          amount,
          description: 'Payment request accepted',
        });

        if (txError) throw txError;

        const { data: groupData } = await supabase
          .from('groups')
          .select('total_pooled')
          .eq('id', groupId)
          .single();

        if (groupData) {
          await supabase
            .from('groups')
            .update({ total_pooled: groupData.total_pooled + amount })
            .eq('id', groupId);
        }
      }

      await loadRequests();
      onRequestUpdated();
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No payment requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Requests</h3>
      {requests.map((request) => {
        const isMine = request.member_id === currentMemberId;
        const isPending = request.status === 'pending';

        return (
          <div
            key={request.id}
            className={`p-4 rounded-lg border-2 ${
              request.status === 'accepted'
                ? 'bg-green-50 border-green-200'
                : request.status === 'rejected'
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-800">{request.member.display_name}</p>
                  {request.status === 'accepted' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {request.status === 'rejected' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {request.status === 'pending' && (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{request.member.upi_id}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Requested {new Date(request.requested_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">₹{request.amount.toFixed(2)}</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                    request.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : request.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : request.status === 'pending'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            </div>

            {isMine && isPending && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleResponse(request.id, 'accepted', request.amount)}
                  disabled={actionLoading === request.id}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading === request.id ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleResponse(request.id, 'rejected', request.amount)}
                  disabled={actionLoading === request.id}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
