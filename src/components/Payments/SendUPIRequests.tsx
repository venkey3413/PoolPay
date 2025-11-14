import { useState } from 'react';
import { Send, Users, Calculator, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { validateAmount } from '../../utils/validation';

interface Member {
  name: string;
  upiId: string;
}

interface SendUPIRequestsProps {
  groupId: string;
  members: Member[];
  paymentMode: 'p2p' | 'escrow';
  onRequestsSent: () => void;
}

export function SendUPIRequests({ groupId, members, paymentMode, onRequestsSent }: SendUPIRequestsProps) {
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const amountPerPerson = totalAmount ? parseFloat(totalAmount) / members.length : 0;

  const sendUPIRequests = async () => {
    if (!totalAmount || !description || members.length === 0) return;

    setLoading(true);
    try {
      // Send UPI collect request to each member
      for (const member of members) {
        // Create payment request in Firebase
        await addDoc(collection(db, 'paymentRequests'), {
          groupId,
          memberName: member.name,
          memberUpiId: member.upiId,
          amount: amountPerPerson,
          description,
          status: 'pending',
          requestedAt: new Date()
        });

        // Generate UPI URL based on payment mode
        let upiUrl;
        if (paymentMode === 'escrow') {
          // Use virtual account for escrow
          upiUrl = `upi://pay?pa=poolpay.${groupId}@cashfree&pn=PoolPay&am=${amountPerPerson}&tn=${encodeURIComponent(description)}&mode=02`;
        } else {
          // Direct P2P to member
          upiUrl = `upi://pay?pa=${member.upiId}&pn=PoolPay&am=${amountPerPerson}&tn=${encodeURIComponent(description)}&mode=02`;
        }
        
        // Open UPI app
        if (navigator.userAgent.match(/Android/i)) {
          window.open(upiUrl, '_blank');
        }
      }

      onRequestsSent();
    } catch (error) {
      console.error('Error sending requests:', error);
      alert('Failed to send requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold">Send UPI Requests</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount to Pool
          </label>
          <div>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="5000"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                totalAmount && !validateAmount(totalAmount) ? 'border-red-500' : ''
              }`}
            />
            {totalAmount && !validateAmount(totalAmount) && (
              <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Enter amount between ₹1 and ₹1,00,000</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Trip to Goa - Hotel booking"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {totalAmount && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Split Calculation</span>
            </div>
            <p className="text-blue-700">
              ₹{amountPerPerson.toFixed(2)} per person ({members.length} members)
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Requests will be sent to:
        </h4>
        <div className="space-y-2">
          {members.map((member, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{member.name}</span>
                <p className="text-sm text-gray-500">{member.upiId}</p>
              </div>
              <span className="text-blue-600 font-semibold">
                ₹{amountPerPerson.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <p className="text-sm text-gray-600">
          {paymentMode === 'escrow' 
            ? '💰 Funds will be held in secure escrow wallet' 
            : '⚡ Direct transfers between members'
          }
        </p>
      </div>

      <button
        onClick={sendUPIRequests}
        disabled={loading || !totalAmount || !description || members.length === 0 || !validateAmount(totalAmount)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Sending Requests...' : `Send ${paymentMode === 'escrow' ? 'Escrow' : 'P2P'} Requests (₹${amountPerPerson.toFixed(2)} each)`}
      </button>
    </div>
  );
}