'use client';

import { useState } from 'react';
import { X, Trash2, Lock } from 'lucide-react';
import CreatorHeader from './CreatorHeader';
import { Product } from '@/types/Product';

interface CheckoutPageProps {
  cartItems: Product[];
  onClose: () => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  creator: {
    display_name: string;
    avatar_url?: string;
    supporter_count: number;
  };
  getProductImage: (product: Product) => string;
}

export default function CheckoutPage({
  cartItems,
  onClose,
  onRemoveFromCart,
  onUpdateQuantity,
  creator,
  getProductImage
}: CheckoutPageProps) {
  const [supporterName, setSupporterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    cartItems.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );

  const totalPrice = cartItems.reduce((sum, item) => {
    const quantity = quantities[item.id] || 1;
    return sum + (item.price * quantity);
  }, 0);

  const totalWithTax = totalPrice * 1.061; // Adding 6.1% tax like in the image

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice === 0 ? 'Free' : `Tzs ${numPrice.toLocaleString()}`;
  };

  const handlePayment = async () => {
    if (!supporterName.trim() || !phoneNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create deposit with PawaPay
      const response = await fetch('/api/payments/create-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalWithTax,
          phoneNumber: phoneNumber,
          creatorId: cartItems[0]?.creator_id, // Assuming all items are from same creator
          supporterName: supporterName,
          type: 'shop',
          productId: cartItems[0]?.id, // For single product checkout
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('success');
        // Redirect to thank you page with payment details
        window.location.href = `/thank-you?depositId=${result.depositId}&status=processing`;
      } else {
        setPaymentStatus('error');
        alert(result.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    onUpdateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    onRemoveFromCart(productId);
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      {/* Shared Header Component */}
      <CreatorHeader
        creator={creator}
        getInitials={(name) => name ? name.charAt(0) : '?'}
        bannerTitle="Checkout"
        bannerSubtitle="Complete your purchase"
        showNavigation={false}
        showActionButtons={false}
        onClose={onClose}
        isModal={true}
      />

      {/* Main Content Container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[calc(100vh-200px)] overflow-hidden mx-auto mt-4">

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-140px)] overflow-hidden">
          {/* Left Panel - Order Summary */}
          <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Checkout</h2>
              <p className="text-sm text-gray-600">You&apos;ll be charged {formatPrice(totalWithTax)}</p>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={getProductImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Qty</span>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, quantities[item.id] - 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">{quantities[item.id] || 1}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, quantities[item.id] + 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total due</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalWithTax)}</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Contact and Payment */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Supporter Information */}
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

              {/* Mobile Money Providers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mobile Money Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-xl text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <span className="text-sm font-medium text-orange-700">TIGO</span>
                  </div>
                  
                  <div className="p-4 border-2 border-red-200 bg-red-50 rounded-xl text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">V</span>
                    </div>
                    <span className="text-sm font-medium text-red-700">VODACOM</span>
                  </div>
                  
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium text-blue-700">AIRTEL</span>
                  </div>
                  
                  <div className="p-4 border-2 border-green-200 bg-green-50 rounded-xl text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <span className="text-sm font-medium text-green-700">HALOTEL</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  We'll automatically detect your provider based on your phone number
                </p>
              </div>

              {/* Secure Payment */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Secure mobile money payment via PawaPay</span>
              </div>

              {/* Pay Button */}
              <div className="pt-4">
                <button
                  onClick={handlePayment}
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
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    `Pay ${formatPrice(totalWithTax)}`
                  )}
                </button>
                
                {paymentStatus === 'error' && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Payment failed. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
