'use client';

import { useState } from 'react';
import { Heart, Lock, Smartphone } from 'lucide-react';

interface SupportSectionProps {
  creator: {
    id: string;
    display_name: string;
    avatar_url?: string;
    supporter_count: number;
  };
}

export default function SupportSection({ creator }: SupportSectionProps) {
  const [supporterName, setSupporterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('5000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSupport = async () => {
    if (!supporterName.trim() || !phoneNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create support deposit with Snippe
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: creator.id,
          amount: parseFloat(amount),
          supporter_name: supporterName,
          supporter_phone: phoneNumber,
          type: 'support',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('success');
        // Redirect to thank you page
        window.location.href = `/support-thank-you?depositId=${result.deposit_id}&status=processing&type=support`;
      } else {
        setPaymentStatus('error');
        alert(result.error || 'Support failed. Please try again.');
      }
    } catch (error) {
      console.error('Support error:', error);
      setPaymentStatus('error');
      alert('Support failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `Tzs ${numPrice.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Support {creator.display_name}
        </h3>
        <p className="text-gray-600">
          Show your appreciation with a mobile money payment
        </p>
      </div>

      {/* Support Amount Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose amount
        </label>
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <span className="text-gray-600">×</span>
          <div className="flex space-x-2">
            {[1, 3, 5].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => setAmount((5000 * multiplier).toString())}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                  amount === (5000 * multiplier).toString()
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {multiplier}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg font-semibold"
            placeholder="5000"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            TZS
          </span>
        </div>
      </div>

      {/* Supporter Information */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your name *
          </label>
          <input
            type="text"
            value={supporterName}
            onChange={(e) => setSupporterName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone number *
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., 0775228897"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            We'll send you a mobile money payment request
          </p>
        </div>
      </div>

      {/* Mobile Money Providers */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Mobile Money Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border-2 border-orange-200 bg-orange-50 rounded-xl text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-xs font-medium text-orange-700">TIGO</span>
          </div>
          
          <div className="p-3 border-2 border-red-200 bg-red-50 rounded-xl text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="text-xs font-medium text-red-700">VODACOM</span>
          </div>
          
          <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-xl text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-xs font-medium text-blue-700">AIRTEL</span>
          </div>
          
          <div className="p-3 border-2 border-green-200 bg-green-50 rounded-xl text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="text-xs font-medium text-green-700">HALOTEL</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          We'll automatically detect your provider
        </p>
      </div>

      {/* Secure Payment */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-6">
        <Lock className="w-4 h-4 text-green-500" />
        <span>Secure mobile money payment via Snippe</span>
      </div>

      {/* Support Button */}
      <button
        onClick={handleSupport}
        disabled={isProcessing || paymentStatus === 'processing'}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
          isProcessing || paymentStatus === 'processing'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {isProcessing || paymentStatus === 'processing' ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing Support...</span>
          </div>
        ) : (
          `Support ${formatPrice(amount)}`
        )}
      </button>
      
      {paymentStatus === 'error' && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Support failed. Please try again.
        </p>
      )}

      {/* Recent Supporters */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent supporters</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm font-medium">AU</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Alvin Urio</p>
              <p className="text-xs text-gray-500">supported you</p>
            </div>
            <span className="text-xs text-gray-400">⭐</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Anonymous</p>
              <p className="text-xs text-gray-500">supported you</p>
            </div>
            <span className="text-xs text-gray-400">⋯</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-medium">N</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Nisapoti</p>
              <p className="text-xs text-gray-500">supported you</p>
            </div>
            <span className="text-xs text-gray-400">⋯</span>
          </div>
        </div>
      </div>
    </div>
  );
}