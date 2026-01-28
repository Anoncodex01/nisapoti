'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Trash2, ChevronDown, Lock, ArrowLeft, Phone, User } from 'lucide-react';
import { Product } from '@/types/Product';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [contactEmail, setContactEmail] = useState('uriohalvin@gmail.com');
  // Payment method is always mobile_money now
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState({
    user_id: '',
    username: '',
    display_name: 'Alvin Urio',
    avatar_url: '/uploads/avatars/default-avatar.jpg',
    supporter_count: 9
  });
  
  // PawaPay payment states
  const [supporterName, setSupporterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'timeout'>('idle');
  const [depositId, setDepositId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showTimeout, setShowTimeout] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isProcessing || showTimeout) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Prevent scroll to top
      window.scrollTo(0, scrollY);
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isProcessing, showTimeout]);

  useEffect(() => {
    // Get cart items from localStorage or URL params
    const savedCart = localStorage.getItem('cartItems');
    const savedQuantities = localStorage.getItem('cartQuantities');
    const savedCreator = localStorage.getItem('cartCreator');
    
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        
        // Fix cart items that don't have creator_id
        const fixedItems = items.map((item: any) => {
          if (!item.creator_id) {
            return {
              ...item,
              creator_id: '1' // Default creator_id for existing items - will be overridden by API fetch
            };
          }
          return item;
        });
        
        setCartItems(fixedItems);
      } catch (error) {
        console.error('Error parsing cart items:', error);
      }
    }
    
    if (savedQuantities) {
      try {
        const qty = JSON.parse(savedQuantities);
        setQuantities(qty);
      } catch (error) {
        console.error('Error parsing quantities:', error);
      }
    }

    if (savedCreator) {
      try {
        const creatorData = JSON.parse(savedCreator);
        setCreator(prev => ({
          ...prev,
          user_id: creatorData.user_id,
          username: creatorData.username,
          display_name: creatorData.display_name
        }));
      } catch (error) {
        console.error('Error parsing creator data:', error);
      }
    } else {
    }
    
    // Fetch creator info if not available
    const fetchCreatorInfo = async () => {
      if (!creator.user_id) {
        try {
          const response = await fetch('/api/creator/Alvin');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCreator(prev => ({
                ...prev,
                user_id: data.data.user_id,
                username: data.data.username,
                display_name: data.data.display_name
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching creator info on page load:', error);
        }
      }
    };
    
    fetchCreatorInfo();
    setLoading(false);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isProcessing && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowTimeout(true);
            setIsProcessing(false);
            setPaymentStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, timeLeft]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newQuantities = { ...quantities, [productId]: newQuantity };
    setQuantities(newQuantities);
    localStorage.setItem('cartQuantities', JSON.stringify(newQuantities));
  };

  const removeFromCart = (productId: string) => {
    const newItems = cartItems.filter(item => item.id !== productId);
    setCartItems(newItems);
    localStorage.setItem('cartItems', JSON.stringify(newItems));
    
    const newQuantities = { ...quantities };
    delete newQuantities[productId];
    setQuantities(newQuantities);
    localStorage.setItem('cartQuantities', JSON.stringify(newQuantities));
  };

  const getProductImage = (product: Product) => {
    if (product.feature_image_url) {
      if (product.feature_image_url.startsWith('/uploads/')) {
        return product.feature_image_url;
      } else if (product.feature_image_url.startsWith('http')) {
        return product.feature_image_url;
      }
    }
    
    // Fallback to category-based placeholder
    const categoryImages = {
      'digital': '/assets/images/placeholders/digital-product.jpg',
      'physical': '/assets/images/placeholders/physical-product.jpg',
      'service': '/assets/images/placeholders/service-product.jpg'
    };
    
    return categoryImages[product.category as keyof typeof categoryImages] || '/assets/images/placeholders/default-product.jpg';
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const quantity = quantities[item.id] || 1;
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (itemPrice * quantity);
  }, 0);

  const totalWithTax = totalPrice; // Remove tax for now

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice === 0 ? 'Free' : `Tzs ${Math.round(numPrice).toLocaleString()}`;
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Find the product to check its constraints
    const product = cartItems.find(item => item.id === productId);
    if (!product) return;
    
    // Check if quantity selection is allowed for this product
    if (!product.allow_quantity && newQuantity > 1) {
      return; // Don't allow quantity > 1 if not allowed
    }
    
    // Check slot limits if applicable
    if (product.limit_slots) {
      const availableSlots = (product.max_slots || 0) - (product.sold_slots || 0);
      if (newQuantity > availableSlots) {
        return; // Don't allow more than available slots
      }
    }
    
    // Apply general maximum limit
    const maxAllowed = product.allow_quantity 
      ? (product.limit_slots 
          ? Math.min(10, (product.max_slots || 0) - (product.sold_slots || 0))
          : 10)
      : 1;
    
    if (newQuantity > maxAllowed) {
      return;
    }
    
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
    updateQuantity(productId, newQuantity);
  };

  const getCreatorUsername = () => {
    // Get creator username dynamically - check multiple sources
    let creatorUsername = 'Alvin'; // default fallback
    
    // Method 1: Check if we have creator info in cart items
    if (cartItems[0]?.creator_username) {
      creatorUsername = cartItems[0].creator_username;
    }
    // Method 2: Extract from referrer URL
    else if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const pathSegments = referrerUrl.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0 && pathSegments[0] !== 'checkout') {
          creatorUsername = pathSegments[0];
        }
      } catch (error) {
      }
    }
    // Method 3: Check localStorage for recent creator
    else {
      const recentCreator = localStorage.getItem('lastVisitedCreator');
      if (recentCreator) {
        creatorUsername = recentCreator;
      }
    }
    
    return creatorUsername;
  };

  const handleBackToShop = () => {
    const creatorUsername = getCreatorUsername();
    window.location.href = `/${creatorUsername}?tab=shop`;
  };

  // Payment status checking function
  const checkPaymentStatus = async (depositId: string) => {
    const maxAttempts = 30; // 30 attempts over 60 seconds
    let attempts = 0;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setShowTimeout(true);
        setIsProcessing(false);
        setPaymentStatus('timeout');
        return;
      }

      try {
        const response = await fetch(`/api/payments/check-status?depositId=${depositId}`);
        const result = await response.json();

        if (result.success && result.isCompleted) {
          // Payment completed successfully
          setIsProcessing(false);
          setPaymentStatus('success');
          
          // Clear cart and redirect to thank you page
          localStorage.removeItem('cartItems');
          localStorage.removeItem('cartQuantities');
          localStorage.removeItem('cartCreator');
          
          // Wait a moment then redirect to thank you page
          setTimeout(() => {
            window.location.href = `/thank-you?depositId=${result.depositId}&amount=${totalWithTax}&supporterName=${supporterName}&creatorUsername=${getCreatorUsername()}&type=shop`;
          }, 2000);
        } else {
          // Payment still processing, check again in 2 seconds
          attempts++;
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  };

  const handlePay = async (e?: React.MouseEvent) => {
    // Prevent default form submission and page jump
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate required fields for PawaPay
    if (!supporterName.trim() || !phoneNumber.trim() || !buyerEmail.trim()) {
      alert('Please fill in your name, phone number, and email address');
      return;
    }

    // Only mobile money is supported

    if (!cartItems.length) {
      alert('No items in cart');
      return;
    }

    // If creator_id is missing, try to get it from the creator state or cart items
    let creatorId = cartItems[0]?.creator_id || creator.user_id;
    
    if (!creatorId) {
      
      // Try to fetch creator info from API as last resort
      try {
        const response = await fetch('/api/creator/Alvin'); // Using hardcoded username for now
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            creatorId = data.data.user_id;
          }
        }
      } catch (error) {
        console.error('Error fetching creator info:', error);
      }
      
      if (!creatorId) {
        // Clear old cart data and redirect to shop
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartQuantities');
        localStorage.removeItem('cartCreator');
        
        alert('Cart data is outdated. Redirecting to shop to add items again.');
        window.location.href = '/';
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setTimeLeft(60);

    try {
      // Get the first product from cart (for now, single product checkout)
      const product = cartItems[0];
      const quantity = quantities[product.id] || 1;

      // Create shop checkout with Snippe
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: quantity,
          buyer_name: supporterName,
          buyer_email: buyerEmail,
          buyer_phone: phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDepositId(result.deposit_id);
        setShowTimeout(false);
        
        // Start checking payment status
        checkPaymentStatus(result.deposit_id);
      } else {
        setPaymentStatus('error');
        setIsProcessing(false);
        alert(result.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setIsProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-gray-400 text-2xl">🛒</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart to proceed with checkout.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBackToShop}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Shop</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>
            <p className="text-gray-600 mb-6">You'll be charged {formatPrice(totalWithTax)}</p>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={getProductImage(item)}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      <p className="text-gray-600">{formatPrice(item.price)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Quantity Controls - Mobile Optimized */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <div className="flex items-center space-x-3">
                      {item.allow_quantity ? (
                        <>
                          <button
                            onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                            className="w-10 h-10 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center transition-colors text-lg font-medium"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold text-lg">{quantities[item.id] || 1}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                            className="w-10 h-10 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center transition-colors text-lg font-medium"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <span className="w-12 text-center font-semibold text-lg text-gray-500">1</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total due</span>
              <span className="text-xl font-bold text-gray-900">{formatPrice(totalWithTax)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
            
            {/* Contact Information */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact information
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Mobile Money Payment Details */}
            <div className="mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-orange-800">Mobile Money Payment</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">Pay securely via TIGO, VODACOM, AIRTEL, or HALOTEL</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={supporterName}
                      onChange={(e) => setSupporterName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter your mobile money number (TIGO, VODACOM, AIRTEL, HALOTEL)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send your purchase confirmation and download links to this email
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Lock className="w-4 h-4" />
              <span>Secure, fast checkout with Link</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePay(e);
              }}
              disabled={isProcessing || !supporterName.trim() || !phoneNumber.trim() || !buyerEmail.trim()}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors ${
                isProcessing || !supporterName.trim() || !phoneNumber.trim() || !buyerEmail.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              } text-white`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </div>
              ) : (
                `Pay ${formatPrice(totalWithTax)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Processing Payment Modal */}
      {isProcessing && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 mb-4">
              Please complete the payment on your phone. You have <span className="font-semibold text-orange-500">{timeLeft}</span> seconds remaining.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Follow these steps:</h4>
              <ol className="text-sm text-gray-600 space-y-1 text-left">
                <li>1. Check your phone for a USSD prompt</li>
                <li>2. Enter your mobile money PIN</li>
                <li>3. Confirm the payment amount</li>
                <li>4. Wait for confirmation</li>
              </ol>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Timeout Modal */}
      {showTimeout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Timeout</h3>
            <p className="text-gray-600 mb-6">
              The payment took too long to complete. Please try again.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTimeout(false);
                  setIsProcessing(false);
                  setPaymentStatus('idle');
                  setTimeLeft(60);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setShowTimeout(false);
                  setIsProcessing(false);
                  setPaymentStatus('idle');
                  setTimeLeft(60);
                  handleBackToShop();
                }}
                className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
