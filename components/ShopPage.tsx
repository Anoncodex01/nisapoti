'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';
import CreatorHeader from './CreatorHeader';
import SupportSection from './SupportSection';
import { Product } from '@/types/Product';

interface ShopPageProps {
  creatorName: string;
  creator: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    supporter_count: number;
    feature_image?: string;
  };
  activeTab: 'support' | 'shop' | 'wishlist';
  setActiveTab: (tab: 'support' | 'shop' | 'wishlist') => void;
  getInitials: (name: string | undefined | null) => string;
  isTransitioning?: boolean;
}

export default function ShopPage({ creatorName, creator, activeTab, setActiveTab, getInitials, isTransitioning = false }: ShopPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products for this specific creator using public API
        const response = await fetch(`/api/public/shop/products?creator_username=${creator.username}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform database products to match our interface
            const transformedProducts = data.data.products.map((product: any) => ({
              id: product.id.toString(),
              title: product.title,
              price: product.price,
              image: product.feature_image_url || '/assets/images/products/placeholder.jpg',
              isFree: product.price === 0,
              category: product.category,
              description: product.description,
              features: [
                'High Quality',
                'Instant Download',
                'Multiple Formats',
                'Commercial Use License',
                'Lifetime Access'
              ],
              creator: {
                name: creator.display_name,
                avatar: creator.avatar_url
              },
              creator_id: product.creator_id, // Add creator_id field
              feature_image_url: product.feature_image_url,
              status: product.status,
              total_sales: product.total_sales || 0,
              limit_slots: product.limit_slots || false,
              max_slots: product.max_slots || 0,
              sold_slots: product.sold_slots || 0,
              allow_quantity: product.allow_quantity || false,
              file_url: product.file_url,
              content_url: product.content_url,
              redirect_url: product.redirect_url
            }));
            
            setProducts(transformedProducts);
            console.log('Products loaded for shop:', transformedProducts.length);
          } else {
            setError('Failed to load products');
          }
        } else {
          setError('Failed to load products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    if (creator.username) {
      fetchProducts();
    }
  }, [creator.username, creator.display_name, creator.avatar_url]);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      // Check if product already exists in cart
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        // Product already in cart, don't add duplicate
        return prev;
      }
      // Add new product to cart
      return [...prev, product];
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setIsDetailModalOpen(false);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // In a real app, you might want to update quantities in cart
    // For now, we'll just handle it in the checkout component
  };
  const openCheckout = () => {
    if (cartItems.length > 0) {
      // Save cart to localStorage and redirect to checkout page
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      localStorage.setItem('cartQuantities', JSON.stringify(quantities));
      localStorage.setItem('cartCreator', JSON.stringify({
        user_id: creator.user_id,
        username: creator.username,
        display_name: creator.display_name
      }));
      window.location.href = '/checkout';
    }
  };


  const totalPrice = cartItems.reduce((sum, item) => {
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + itemPrice;
  }, 0);
  const cartCount = cartItems.length;

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice === 0 ? 'Free' : `Tzs ${Math.round(numPrice).toLocaleString()}`;
  };

  const getProductImage = (product: Product) => {
    // Use the real product image from database, with fallback
    if (product.feature_image_url) {
      // Check if it's a blob URL (old format) or a proper file path
      if (product.feature_image_url.startsWith('blob:')) {
        // For old blob URLs, use category placeholder
        console.log('Using placeholder for blob URL:', product.feature_image_url);
        // Continue to fallback logic below
      } else if (product.feature_image_url.startsWith('/uploads/')) {
        // For proper file paths, use them directly
        return product.feature_image_url;
      } else if (product.feature_image_url.startsWith('http')) {
        // For external URLs, use them directly
        return product.feature_image_url;
      }
    }
    
    // Fallback to placeholder based on category
    const categoryPlaceholders = {
      'ebooks': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
      'courses': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
      'tutorials': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
      'templates': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      'software': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=400&fit=crop',
      'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      'videos': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=400&fit=crop',
      'podcasts': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop'
    };
    
    return categoryPlaceholders[product.category as keyof typeof categoryPlaceholders] || 
           'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Shared Header Component */}
      <CreatorHeader
        creator={creator}
        getInitials={getInitials}
        bannerTitle={`Welcome to ${creator.display_name}'s Shop`}
        bannerSubtitle="Discover amazing products and support creativity"
        showNavigation={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showActionButtons={true}
      />

      {/* Main Content Container */}
      <div className={`max-w-6xl mx-auto px-4 pb-4 transition-all duration-300 ease-in-out ${
        isTransitioning ? 'opacity-50 transform scale-98' : 'opacity-100 transform scale-100'
      }`}>

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'support' ? 'Support' : activeTab === 'shop' ? 'Shop' : 'Wishlist'}
              </h1>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'support' ? (
            <div className="p-6">
              <div className="max-w-md mx-auto">
                <SupportSection creator={{ ...creator, id: creator.user_id }} />
              </div>
            </div>
          ) : activeTab === 'shop' ? (
            <>
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-100">
                <div className="relative max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 text-red-500 text-2xl">⚠️</div>
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Product Image */}
                  <div 
                    className="relative aspect-square overflow-hidden cursor-pointer"
                    onClick={() => openProductDetail(product)}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.isFree && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Free
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      className="font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-500 transition-colors"
                      onClick={() => openProductDetail(product)}
                    >
                      {product.title}
                    </h3>
                    
                    {/* Limited Slots Display */}
                    {product.limit_slots && (
                      <div className="mb-2">
                        <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          {(product.max_slots || 0) - (product.sold_slots || 0)} slots left
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      
                      {/* Add to Cart */}
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={product.limit_slots && (product.max_slots || 0) <= (product.sold_slots || 0)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                        >
                          {product.limit_slots && (product.max_slots || 0) <= (product.sold_slots || 0) 
                            ? 'Sold Out' 
                            : 'Add to Cart'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 col-span-full">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 text-gray-400 text-2xl">🔍</div>
                  </div>
                  <p className="text-gray-500">No products found matching your search.</p>
                </div>
              )}
            </div>
            )}
              </div>
            </>
          ) : (
            /* Wishlist Tab */
            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 text-gray-400 text-2xl">💝</div>
                </div>
                <p className="text-gray-500">Wishlist coming soon!</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isDetailModalOpen}
          onClose={closeProductDetail}
          onAddToCart={addToCart}
          getProductImage={getProductImage}
        />

      </div>

      {/* Floating Shopping Cart - Outside main container to ensure fixed positioning works */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 z-50 transition-all duration-300 hover:shadow-3xl">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {cartCount}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Total: Tzs {totalPrice.toLocaleString()}</div>
              <div className="text-gray-500">{cartCount} item{cartCount !== 1 ? 's' : ''}</div>
            </div>
            <button 
              onClick={openCheckout}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
            >
              <span>Checkout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
