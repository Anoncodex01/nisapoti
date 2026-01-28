'use client';

import { useState } from 'react';
import { X, Star, ShoppingCart, Shield, Truck } from 'lucide-react';
import { Product } from '@/types/Product';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  getProductImage: (product: Product) => string;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  getProductImage
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `Tzs ${price.toLocaleString()}`;
  };

  const totalPrice = product.price * quantity;

  const handlePurchase = () => {
    // Add to cart with quantity
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onClose();
    
    // Redirect to checkout page
    window.location.href = '/checkout';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-hidden">
          {/* Left Side - Product Image */}
          <div className="lg:w-1/2 p-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={getProductImage(product)}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.isFree && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Free
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Product Title & Rating */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
                {product.rating && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating!) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{product.rating} rating</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </div>

              {/* Creator Info */}
              {product.creator && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  {product.creator.avatar ? (
                    <img
                      src={product.creator.avatar}
                      alt={product.creator.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {product.creator.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Created by {product.creator.name}</p>
                    <p className="text-sm text-gray-500">Verified Creator</p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'This is a high-quality product created with care and attention to detail. Perfect for your needs and designed to exceed expectations.'}
                </p>
              </div>


              {/* Quantity Selector */}
              {!product.isFree && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Security Features */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>Instant Delivery</span>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="pt-4">
                {product.isFree ? (
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Get for Free</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
