'use client';

import { useState, useEffect } from 'react';
import { X, Share2, Heart, ExternalLink, ArrowLeft } from 'lucide-react';

interface WishlistItem {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
  amount_funded: number;
  category: string;
  hashtags?: string;
  link?: string;
  is_priority: boolean;
  user_id: number;
  created_at: string;
  images: string[];
}

interface Creator {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  category: string;
}

interface Supporter {
  name: string;
  amount: number;
  created_at: string;
}

interface WishlistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  uuid: string;
}

export default function WishlistDetailModal({ isOpen, onClose, uuid }: WishlistDetailModalProps) {
  const [wishlistItem, setWishlistItem] = useState<WishlistItem | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [supporterCount, setSupporterCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [supportedAmount, setSupportedAmount] = useState(0);

  // Support form state
  const [supportAmount, setSupportAmount] = useState('');
  const [supporterName, setSupporterName] = useState('');
  const [supporterPhone, setSupporterPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showTimeout, setShowTimeout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stopPaymentChecking, setStopPaymentChecking] = useState(false);

  // Read more state
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (isOpen && uuid) {
      fetchWishlistDetail();
    }
  }, [isOpen, uuid]);

  // Countdown timer for payment processing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (processingPayment && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setProcessingPayment(false);
            setShowTimeout(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processingPayment, timeLeft]);

  const fetchWishlistDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/wishlist/${uuid}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch wishlist item');
      }

      setWishlistItem(result.data.wishlist);
      setCreator(result.data.creator);
      setSupporters(result.data.supporters || []);
      setSupporterCount(result.data.supporter_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (depositId: string) => {
    // Stop checking if flag is set
    if (stopPaymentChecking) {
      return
    }

    try {
      const response = await fetch(`/api/payments/check-status?depositId=${depositId}`);
      const result = await response.json();
      
      
      if (result.success && result.isCompleted) {
        // Payment completed successfully
        setShowSuccess(true);
        
        // Try secure token first, but fallback quickly to URL parameters
        setTimeout(async () => {
          try {
            const tokenResponse = await fetch('/api/payments/generate-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                depositId,
                amount: parseFloat(supportAmount),
                supporterName,
                creatorUsername: creator?.username,
              }),
            });
            
            const tokenResult = await tokenResponse.json();
            
            if (tokenResult.success) {
              setProcessingPayment(false);
              setTimeout(() => {
                window.location.href = `/support-thank-you?token=${tokenResult.token}`;
              }, 500);
            } else {
              throw new Error('Token generation failed: ' + tokenResult.error);
            }
          } catch (error) {
            console.error('Secure token failed, using URL parameters as fallback:', error);
            setProcessingPayment(false);
            setTimeout(() => {
              window.location.href = `/support-thank-you?depositId=${depositId}&amount=${supportAmount}&supporterName=${supporterName}&creatorUsername=${creator?.username}`;
            }, 500);
          }
        }, 3000); // Wait 3 seconds for database to update
      } else if (result.success && !result.isCompleted && !stopPaymentChecking) {
        // Payment still processing, check again in 3 seconds (only if not stopped)
        setTimeout(() => checkPaymentStatus(depositId), 3000);
      } else {
        // Payment failed or error
        setProcessingPayment(false);
        setShowTimeout(true);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Don't show timeout immediately on network error, try again
      if (timeLeft > 10) { // Only retry if we have time left
        setTimeout(() => checkPaymentStatus(depositId), 3000);
      } else {
        setProcessingPayment(false);
        setShowTimeout(true);
      }
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistItem || !creator) return;

    setSubmitting(true);
    try {
      // Use Snippe payment system
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: creator.user_id,
          supporter_name: supporterName,
          supporter_phone: supporterPhone,
          amount: parseFloat(supportAmount),
          type: 'wishlist',
          wishlist_id: wishlistItem.id
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Store deposit ID and start processing
      setDepositId(result.deposit_id);
      setSubmitting(false);
      setProcessingPayment(true);
      setTimeLeft(60); // Reset timer to 60 seconds
      setShowTimeout(false);
      
      // Start checking payment status
      checkPaymentStatus(result.deposit_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/wishlist/${uuid}`);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (!wishlistItem || wishlistItem.price === 0) return 0;
    return Math.min(100, Math.round((wishlistItem.amount_funded / wishlistItem.price) * 100));
  };

  const getRemainingAmount = () => {
    if (!wishlistItem) return 0;
    return Math.max(0, wishlistItem.price - wishlistItem.amount_funded);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Nisapoti Logo"
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/logos/logo.png';
              }}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading wishlist item...</p>
              </div>
            </div>
          ) : error || !wishlistItem || !creator ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">😔</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Wishlist item not found</h1>
                <p className="text-gray-600 mb-6">{error || 'The wishlist item you&apos;re looking for doesn&apos;t exist.'}</p>
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl shadow-xl p-8">
                    {/* Title */}
                    <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                      {wishlistItem.name}
                    </h1>

                    {/* Images */}
                    <div className="mb-8">
                      <div className="relative">
                        <div className="w-full h-96 bg-gray-100 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                          {wishlistItem.images.length > 0 ? (
                            <img
                              src={wishlistItem.images[currentImageIndex]}
                              alt={wishlistItem.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${wishlistItem.images.length > 0 ? 'hidden' : ''}`}>
                            <div className="text-center">
                              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500">No image available</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Image Thumbnails */}
                        {wishlistItem.images.length > 1 && (
                          <div className="flex space-x-2 overflow-x-auto pb-2">
                            {wishlistItem.images.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === currentImageIndex
                                    ? 'border-orange-500'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`${wishlistItem.name} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                        {wishlistItem.category}
                      </span>
                      {wishlistItem.hashtags && wishlistItem.hashtags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-200"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="relative">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.display_name}
                            className="w-14 h-14 rounded-full border-2 border-orange-200 object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(creator.display_name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{creator.display_name}</h3>
                        <p className="text-sm text-gray-600">{creator.bio || 'Creator'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">About this wish</h2>
                      <div className="text-gray-700 leading-relaxed">
                        {(() => {
                          const desc = wishlistItem.description;
                          const descShort = desc.substring(0, 200);
                          const isLong = desc.length > 200;
                          
                          if (!isLong) {
                            return <p className="whitespace-pre-wrap">{desc}</p>;
                          }
                          
                          return (
                            <>
                              <span className="whitespace-pre-wrap">
                                {showFullDescription ? desc : descShort}
                                {!showFullDescription && '...'}
                              </span>
                              {!showFullDescription && (
                                <button
                                  onClick={() => setShowFullDescription(true)}
                                  className="font-semibold ml-2 text-orange-600 hover:text-orange-700 transition-colors"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  Read more
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* External Link */}
                    {wishlistItem.link && (
                      <a
                        href={wishlistItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        View Product
                      </a>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-6">
                    {/* Progress */}
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20" viewBox="0 0 40 40">
                            <defs>
                              <linearGradient id="circleGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#fb923c" />
                              </linearGradient>
                            </defs>
                            <circle cx="20" cy="20" r="18" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                            <circle 
                              cx="20" 
                              cy="20" 
                              r="18" 
                              fill="none" 
                              stroke="url(#circleGradient)" 
                              strokeWidth="4" 
                              strokeDasharray="113" 
                              strokeDashoffset={113 - (113 * getProgressPercentage() / 100)} 
                              strokeLinecap="round" 
                              transform="rotate(-90 20 20)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
                            {getProgressPercentage()}%
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(wishlistItem.amount_funded)}
                          </div>
                          <div className="text-gray-500 text-sm">
                            of {formatCurrency(wishlistItem.price)} target
                          </div>
                          {getRemainingAmount() > 0 && (
                            <div className="text-green-600 font-semibold text-sm mt-1">
                              {formatCurrency(getRemainingAmount())} remaining
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Supporters */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-orange-200">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                          <path d="M17 7L7 17M17 7h-6m6 0v6" stroke="#f97315" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="font-semibold text-lg text-[#f97315]">
                        {supporterCount} people have supported
                      </span>
                    </div>

                    {/* Share Button */}
                    <div className="mb-6">
                      <button
                        onClick={handleShare}
                        className="w-full py-3 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
                        style={{background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)'}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25V6a2.25 2.25 0 0 0-2.25-2.25h-6A2.25 2.25 0 0 0 4.5 6v12A2.25 2.25 0 0 0 6.75 20.25h6A2.25 2.25 0 0 0 15 18v-2.25m3-4.5-4.5-4.5m4.5 4.5-4.5 4.5m4.5-4.5H9" />
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Support Form */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Support this wish</h3>
                      
                      <form onSubmit={handleSupportSubmit} className="space-y-4">
                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          {[5000, 10000, 50000].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setSupportAmount(amount.toString())}
                              className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                                supportAmount === amount.toString()
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-orange-500 text-orange-500 hover:bg-orange-50'
                              }`}
                            >
                              {formatCurrency(amount)}
                            </button>
                          ))}
                        </div>

                        <input
                          type="number"
                          value={supportAmount}
                          onChange={(e) => setSupportAmount(e.target.value)}
                          placeholder="Enter custom amount"
                          min="1000"
                          step="100"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />

                        <input
                          type="text"
                          value={supporterName}
                          onChange={(e) => setSupporterName(e.target.value)}
                          placeholder="Your name"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />

                        <input
                          type="tel"
                          value={supporterPhone}
                          onChange={(e) => setSupporterPhone(e.target.value)}
                          placeholder="Phone number (e.g., 0712345678)"
                          pattern="[0-9]{10,}"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />

                        <button
                          type="submit"
                          disabled={submitting || getRemainingAmount() === 0}
                          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : getRemainingAmount() === 0 ? (
                            'Fully Funded!'
                          ) : (
                            'Support this wish'
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Payment Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            {/* Countdown Timer */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#FF6B35"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / 60)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-orange-500">{timeLeft}</span>
                <span className="text-xs text-gray-500">seconds</span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check your phone</h3>
            <p className="text-gray-600 mb-6">
              A USSD prompt has been sent to your device.
            </p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <span className="text-gray-700">Open the USSD prompt on your phone</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <span className="text-gray-700">Enter your PIN to confirm payment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <span className="text-gray-700">Wait for confirmation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Modal */}
      {showTimeout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Timeout</h3>
            <p className="text-gray-600 mb-6">
              The payment process has timed out. Please try again.
            </p>
            <button
              onClick={() => {
                setStopPaymentChecking(true);
                setShowTimeout(false);
                setProcessingPayment(false);
                setTimeLeft(60);
                // Refresh the page to reset everything
                window.location.reload();
              }}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-3xl font-bold text-green-600 mb-2">Thank You!</div>
            <div className="text-lg mb-4">Your payment was successful</div>
            <div className="text-2xl font-bold text-orange-500 mb-4">
              {formatCurrency(supportedAmount)}
            </div>
            <div className="text-gray-600">Your support means everything!</div>
          </div>
        </div>
      )}
    </div>
  );
}
