import { useState } from 'react';
import { QrCode, Scan, CreditCard } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { payMerchant, processUPIPayment } from '../../services/paymentService';

interface MerchantPaymentProps {
  groupId: string;
  availableBalance: number;
  onPaymentComplete: () => void;
}

export function MerchantPayment({ groupId, availableBalance, onPaymentComplete }: MerchantPaymentProps) {
  const [merchantUpiId, setMerchantUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = (upiId: string) => {
    setMerchantUpiId(upiId);
    setShowScanner(false);
  };

  const handlePayment = async () => {
    if (!merchantUpiId || !amount || !merchantName) return;
    
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await payMerchant(groupId, merchantUpiId, paymentAmount, merchantName);
      // Open UPI payment
      processUPIPayment(merchantUpiId, paymentAmount, merchantName);
      onPaymentComplete();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold">Pay Merchant</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant Name
          </label>
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="Restaurant, Hotel, etc."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant Phone Number
          </label>
          <input
            type="tel"
            value={merchantUpiId}
            onChange={(e) => setMerchantUpiId(e.target.value)}
            placeholder="9876543210"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-center text-gray-500">or</div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scan UPI QR Code
          </label>
          <button
            onClick={() => setShowScanner(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500"
          >
            <Scan className="w-5 h-5" />
            Scan QR Code
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            max={availableBalance}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Available: ₹{availableBalance.toFixed(2)}
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !merchantUpiId || !amount || !merchantName}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : `Pay ₹${amount || '0'}`}
        </button>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}