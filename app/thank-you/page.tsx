'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, Star, Link, Twitter, Sparkles, Gift, Heart, User } from 'lucide-react';
import { Product } from '@/types/Product';
import confetti from 'canvas-confetti';

interface PurchaseData {
  products: (Product & { quantity: number })[];
  totalPrice: number;
  purchaseDate: string;
  orderId: string;
}

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [creator, setCreator] = useState({
    display_name: '',
    avatar_url: '',
    supporter_count: 0,
    username: ''
  });

  // Confetti effect function
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#3A86FF', '#8338EC']
    });
  };


  useEffect(() => {
    const checkPaymentStatus = async () => {
      const depositId = searchParams.get('depositId');
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      // Handle token-based validation first
      if (token) {
        try {
          const response = await fetch(`/api/payments/validate-token?token=${token}`);
          const result = await response.json();
          
          if (result.success) {
            setPaymentStatus('completed');
            setShowConfetti(true);
            triggerConfetti();
            setTimeout(() => setShowConfetti(false), 3000);
            
            // For shop purchases, fetch the actual product data
            if (result.data.type === 'shop' && result.data.productId) {
              try {
                const productResponse = await fetch(`/api/public/shop/products?creator_username=${result.data.creatorUsername}&limit=100`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  if (productData.success && productData.data.products.length > 0) {
                    // Find the specific product by ID
                    const product = productData.data.products.find((p: any) => p.id.toString() === result.data.productId.toString());
                    
                    if (product) {
                      const purchaseData = {
                        products: [{
                          id: product.id.toString(),
                          title: product.title,
                          price: result.data.amount,
                          image: product.feature_image_url || '/assets/images/placeholders/default-product.jpg',
                          category: product.category,
                          description: product.description || 'Thank you for your purchase!',
                          quantity: 1,
                          feature_image_url: product.feature_image_url,
                          confirmation_message: product.confirmation_message || 'Thank you for your purchase!',
                          file_url: product.file_url,
                          content_url: product.content_url,
                          redirect_url: product.redirect_url,
                          success_page_type: product.success_page_type || 'message'
                        }],
                        totalPrice: result.data.amount,
                        purchaseDate: new Date().toISOString(),
                        orderId: `ORD-${Date.now()}`
                      };
                      setPurchaseData(purchaseData);
                    } else {
                      // Product not found, fallback to basic product data
                      const purchaseData = {
                        products: [{
                          id: result.data.productId,
                          title: 'Product Purchase',
                          price: result.data.amount,
                          image: '/assets/images/placeholders/default-product.jpg',
                          category: 'service',
                          description: 'Thank you for your purchase!',
                          quantity: 1,
                          feature_image_url: '',
                          confirmation_message: 'Thank you for your purchase!',
                          file_url: '',
                          content_url: '',
                          redirect_url: '',
                          success_page_type: 'message'
                        }],
                        totalPrice: result.data.amount,
                        purchaseDate: new Date().toISOString(),
                        orderId: `ORD-${Date.now()}`
                      };
                      setPurchaseData(purchaseData);
                    }
                  } else {
                    throw new Error('Failed to fetch product data');
                  }
                } else {
                  throw new Error('Failed to fetch product data');
                }
              } catch (error) {
                // Fallback to basic product data
                const purchaseData = {
                  products: [{
                    id: result.data.productId,
                    title: 'Product Purchase',
                    price: result.data.amount,
                    image: '/assets/images/placeholders/default-product.jpg',
                    category: 'service',
                    description: 'Thank you for your purchase!',
                    quantity: 1,
                    feature_image_url: '',
                    confirmation_message: 'Thank you for your purchase!',
                    file_url: '',
                    content_url: '',
                    redirect_url: '',
                    success_page_type: 'message'
                  }],
                  totalPrice: result.data.amount,
                  purchaseDate: new Date().toISOString(),
                  orderId: `ORD-${Date.now()}`
                };
                setPurchaseData(purchaseData);
              }
            } else {
              // Support payment
              const purchaseData = {
                products: [{
                  id: 'support',
                  title: 'Support',
                  price: result.data.amount,
                  image: '',
                  category: 'service',
                  description: 'Thank you for your support!',
                  quantity: 1,
                  feature_image_url: '',
                  confirmation_message: 'Thank you for your support!',
                  file_url: '',
                  content_url: '',
                  redirect_url: '',
                  success_page_type: 'message'
                }],
                totalPrice: result.data.amount,
                purchaseDate: new Date().toISOString(),
                orderId: `SUP-${Date.now()}`
              };
              setPurchaseData(purchaseData);
            }
          } else {
            // Token is invalid or expired
            setTokenExpired(true);
            setPaymentStatus('error');
          }
        } catch (error) {
          setTokenExpired(true);
          setPaymentStatus('error');
        }
      } else if (depositId && type === 'support') {
        // Check payment status for support
        try {
          const response = await fetch(`/api/payments/check-status?depositId=${depositId}`);
          const result = await response.json();
          
          if (result.success && result.isCompleted) {
            // Payment completed, show confetti
            setPaymentStatus('completed');
            setShowConfetti(true);
            triggerConfetti();
            setTimeout(() => setShowConfetti(false), 3000);
            
            // Create support data for display
            const supportData = {
              products: [{
                id: 'support',
                title: 'Support',
                price: result.pendingPayment?.amount || 0,
                image: '',
                category: 'service',
                description: 'Thank you for your support!',
                quantity: 1,
                feature_image_url: '',
                confirmation_message: 'Thank you for your support!',
                file_url: '',
                content_url: '',
                redirect_url: '',
                success_page_type: 'message'
              }],
              totalPrice: result.pendingPayment?.amount || 0,
              purchaseDate: new Date().toISOString(),
              orderId: depositId
            };
            
            setPurchaseData(supportData);
          } else {
            // Payment still processing, poll again in 3 seconds
            setTimeout(() => {
              checkPaymentStatus();
            }, 3000);
          }
        } catch (error) {
        }
      } else if (depositId && type === 'shop') {
        // Check payment status for shop purchases
        try {
          const response = await fetch(`/api/payments/check-status?depositId=${depositId}`);
          const result = await response.json();
          
          if (result.success && result.isCompleted) {
            // Payment completed, show confetti
            setPaymentStatus('completed');
            setShowConfetti(true);
            triggerConfetti();
            setTimeout(() => setShowConfetti(false), 3000);
            
            // Use order data if available, otherwise use pending payment data
            const order = result.order;
            const pendingPayment = result.pendingPayment;
            
            // Get amount from URL params as fallback
            const urlAmount = searchParams.get('amount');
            const amount = order?.total_amount 
              ? parseFloat(order.total_amount.toString())
              : urlAmount 
                ? parseFloat(urlAmount)
                : pendingPayment?.amount 
                  ? parseFloat(pendingPayment.amount.toString())
                  : 0;
            
            // Create shop purchase data for display
            const shopData = {
              products: [{
                id: order?.product_id?.toString() || pendingPayment?.product_id?.toString() || 'product',
                title: order?.product_title || 'Product Purchase',
                price: amount,
                image: order?.feature_image_url || '',
                category: order?.category || 'service',
                description: order?.description || 'Thank you for your purchase!',
                quantity: order?.quantity || 1,
                feature_image_url: order?.feature_image_url || '',
                confirmation_message: order?.confirmation_message || 'Thank you for your purchase!',
                file_url: order?.file_url || '',
                content_url: order?.content_url || '',
                redirect_url: order?.redirect_url || '',
                success_page_type: order?.success_page_type || 'confirmation'
              }],
              totalPrice: amount,
              purchaseDate: order?.order_date || new Date().toISOString(),
              orderId: order?.order_number || `ORD-${Date.now()}`
            };
            
            setPurchaseData(shopData);
            
            // Set creator info if available
            if (order?.creator_id) {
              // Try to get creator username from URL params
              const creatorUsername = searchParams.get('creatorUsername');
              if (creatorUsername) {
                setCreator(prev => ({ ...prev, username: creatorUsername }));
              }
            }
            
            setLoading(false);
          } else {
            // Payment still processing, poll again in 3 seconds
            setTimeout(() => {
              checkPaymentStatus();
            }, 3000);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          setLoading(false);
        }
      } else {
        // Get purchase data from localStorage for shop purchases
        const storedData = localStorage.getItem('purchaseData');
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            
            // Handle backward compatibility - convert old single product format to new array format
            if (data.product && !data.products) {
              data.products = [{ ...data.product, quantity: data.quantity || 1 }];
              delete data.product;
              delete data.quantity;
            }
            
            setPurchaseData(data);
            // Show confetti animation
            setShowConfetti(true);
            triggerConfetti();
            setTimeout(() => setShowConfetti(false), 3000);
          } catch (error) {
          }
        }
      }
    };

    checkPaymentStatus();

    // Fetch real creator data
    const fetchCreatorData = async () => {
      try {
        const response = await fetch('/api/creator/Alvin');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCreator({
              display_name: data.data.display_name || '',
              avatar_url: data.data.avatar_url || '',
              supporter_count: data.data.supporter_count || 0,
              username: data.data.username || ''
            });
          }
        }
      } catch (error) {
      }
    };

    fetchCreatorData();
    setLoading(false);
  }, []);

  const handleProductAction = async (product: Product) => {
    
    // For downloadable files (books, PDFs, etc.)
    if (product.file_url && product.file_url !== '' && product.file_url !== 'null') {
      // Direct download link - open in new tab to trigger download
      const fileUrl = product.file_url.startsWith('http') 
        ? product.file_url 
        : `${window.location.origin}${product.file_url}`;
        
      window.open(fileUrl, '_blank');
    } 
    // For online content (courses, tutorials, podcasts)
    else if ((product.content_url && product.content_url !== '' && product.content_url !== 'null') || 
             (product.redirect_url && product.redirect_url !== '' && product.redirect_url !== 'null')) {
      const linkUrl = product.content_url || product.redirect_url;
      if (linkUrl) {
        const finalUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
        window.open(finalUrl, '_blank');
      }
    } 
    else {
      alert('No content available for this product.');
    }
  };

  const getProductActionText = (product: Product) => {
    
    // For downloadable files (ebooks, PDFs, etc.) - show Download button
    if (product.file_url && product.file_url !== '' && product.file_url !== 'null') {
      return 'Download';
    } 
    // For online content (courses, tutorials, podcasts) - show View Content button
    else if ((product.content_url && product.content_url !== '' && product.content_url !== 'null') || 
             (product.redirect_url && product.redirect_url !== '' && product.redirect_url !== 'null')) {
      return 'View Content';
    }
    // No action available - this shouldn't happen for valid products
    else {
      return 'Download';
    }
  };

  const getProductTypeDescription = (product: Product) => {
    // Check for file_url (not null, not empty string)
    if (product.file_url && product.file_url !== '' && product.file_url !== 'null') {
      return '494.48 KB';
    } 
    // Check for content_url or redirect_url (not null, not empty string)
    else if ((product.content_url && product.content_url !== '' && product.content_url !== 'null') || 
             (product.redirect_url && product.redirect_url !== '' && product.redirect_url !== 'null')) {
      return 'Online Tutorial';
    } else {
      return 'Digital Content';
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `Tzs ${price.toLocaleString()}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const copyLink = async () => {
    const link = window.location.origin + `/${creator.username}`;
    try {
      await navigator.clipboard.writeText(link);
      // Show temporary feedback
      const button = document.querySelector('[data-copy-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Copied!</span>';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const postOnX = () => {
    const firstProduct = purchaseData?.products[0];
    const text = `Just purchased "${firstProduct?.title}" from ${creator.display_name}! Check out their amazing products!`;
    const url = window.location.origin + `/${creator.username}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank');
  };

  // Show processing state for support payments
  if (paymentStatus === 'processing' && searchParams.get('type') === 'support') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Support</h1>
          <p className="text-gray-600 mb-6">
            Please complete the USSD prompt on your phone to finish the payment.
          </p>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              We're waiting for your payment to be confirmed. This page will update automatically once payment is completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !purchaseData || !purchaseData.products || purchaseData.products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your purchase details...</p>
        </div>
      </div>
    );
  }

  if (tokenExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 text-orange-500 text-3xl">⏰</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Expired</h1>
          <p className="text-gray-600 mb-6">
            This thank you page has expired. Don't worry - your payment was successful and you should have received a confirmation email with your purchase details.
          </p>
          <div className="space-y-3">
            <a 
              href={`/${creator.username}?tab=shop`}
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Visit {creator.display_name}'s Shop
            </a>
            <a 
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Go to Homepage
            </a>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">📧 Check Your Email</h4>
            <p className="text-sm text-blue-800">
              Your purchase confirmation and download links have been sent to your email address. 
              You can access your content anytime from there.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-red-500 text-2xl">⚠️</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your purchase details.</p>
          <button
            onClick={() => window.location.href = '/Alvin'}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Thank You Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Thank you for your purchase!</h1>
            
            {/* Multiple Products Display */}
            <div className="mb-6">
              {purchaseData.products.length === 1 ? (
                // Single product display
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <img
                    src={purchaseData.products[0].feature_image_url || purchaseData.products[0].image || '/assets/images/placeholders/default-product.jpg'}
                    alt={purchaseData.products[0].title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-gray-900">{purchaseData.products[0].title}</h2>
                    <p className="text-lg text-gray-600">Tzs {Math.round(typeof purchaseData.products[0].price === 'string' ? parseFloat(purchaseData.products[0].price) : purchaseData.products[0].price).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                // Multiple products display
                <div className="space-y-3 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">{purchaseData.products.length} Items Purchased</h2>
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {purchaseData.products.map((product, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={product.feature_image_url || product.image || '/assets/images/placeholders/default-product.jpg'}
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-600">Qty: {product.quantity} × Tzs {Math.round(typeof product.price === 'string' ? parseFloat(product.price) : product.price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xl font-bold text-gray-900">Total: Tzs {Math.round(purchaseData.totalPrice).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-gray-600">
              {purchaseData.products.length === 1 && purchaseData.products[0].confirmation_message 
                ? purchaseData.products[0].confirmation_message 
                : 'Thank you for your purchase! Your support means the world to us.'
              }
            </p>
            
          </div>

          {/* Product Actions Section */}
          <div className="space-y-4 mb-6">
            {purchaseData.products.map((product, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={product.feature_image_url || product.image || '/assets/images/placeholders/default-product.jpg'}
                    alt={product.title}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-600">{getProductTypeDescription(product)}</p>
                    {product.quantity > 1 && (
                      <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleProductAction(product)}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                  >
                    {getProductActionText(product) === 'Download' ? (
                      <Download className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{getProductActionText(product)}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>


          {/* Social Sharing */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Spread the word
            </h3>
            <p className="text-gray-600 mb-6">
              {creator.display_name} would love a shoutout! Post it on X or tell your friends using this link:
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={copyLink}
                data-copy-button
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors font-medium"
              >
                <Link className="w-4 h-4" />
                <span>Copy link</span>
              </button>
              <button
                onClick={postOnX}
                className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
              >
                <Twitter className="w-4 h-4" />
                <span>Post on X</span>
pr              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
