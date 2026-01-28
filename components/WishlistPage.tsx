'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import CreatorHeader from './CreatorHeader';

interface WishlistItem {
  id: string;
  uuid: string;
  name: string;
  price: number;
  amount_funded: number;
  is_priority: boolean;
  description?: string;
  images: string[];
}

interface CreatorData {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  supporter_count: number;
  wishlist_items: WishlistItem[];
  feature_image?: string;
}

interface WishlistPageProps {
  creator: CreatorData;
  activeTab: 'support' | 'shop' | 'wishlist';
  setActiveTab: (tab: 'support' | 'shop' | 'wishlist') => void;
  getInitials: (name: string | undefined | null) => string;
  isTransitioning?: boolean;
}

export default function WishlistPage({ 
  creator, 
  activeTab, 
  setActiveTab, 
  getInitials, 
  isTransitioning = false 
}: WishlistPageProps) {
  const router = useRouter();
  const [showMoreWishlist, setShowMoreWishlist] = useState(false);
  
  // Show first 4 items initially, then all if "Show more" is clicked
  const displayedWishlistItems = showMoreWishlist 
    ? creator.wishlist_items 
    : creator.wishlist_items.slice(0, 4);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6A1A', '#FF8C42', '#FFB366', '#FFD700', '#32CD32']
    });
  };

  const isFullyFunded = (item: WishlistItem) => {
    return item.amount_funded >= item.price;
  };

  const handleWishlistItemClick = (uuid: string) => {
    router.push(`/wishlist/${uuid}`);
  };

  return (
    <div className="w-full">
      {/* Shared Header Component */}
      <CreatorHeader
        creator={creator}
        getInitials={getInitials}
        bannerTitle={`Welcome to ${creator.display_name}'s Page`}
        bannerSubtitle="Support creativity and discover amazing content"
        showNavigation={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showActionButtons={true}
      />

      {/* Main Content Container */}
      <div className={`max-w-6xl mx-auto px-4 pb-4 transition-all duration-300 ease-in-out ${
        isTransitioning ? 'opacity-50 transform scale-98' : 'opacity-100 transform scale-100'
      }`}>

        {/* Main Wishlist Container */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{creator.display_name}'s Wishlist</h1>
              <p className="text-gray-600">Help make their dreams come true</p>
            </div>
          </div>

          {/* Wishlist Content */}
          <div className="p-6">
            {creator.wishlist_items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-gray-500">No wishlist items yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedWishlistItems.map((item) => {
                    const progressPercentage = item.price > 0 ? (item.amount_funded / item.price) * 100 : 0;
                    const remainingAmount = Math.max(0, item.price - item.amount_funded);
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                        onClick={() => handleWishlistItemClick(item.uuid)}
                      >
                        {/* Item Image */}
                        <div className="w-full h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                          {item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${item.images.length > 0 ? 'hidden' : ''}`}>
                            <Gift className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                              {item.name}
                            </h3>
                            {item.is_priority && (
                              <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                Priority
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Amount Information */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Raised:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(item.amount_funded)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Goal:</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(item.price)}</span>
                            </div>
                            {remainingAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Remaining:</span>
                                <span className="font-semibold text-orange-600">{formatCurrency(remainingAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Support Button or Congratulations */}
                        {isFullyFunded(item) ? (
                          <div className="w-full mt-4 text-center">
                            <div 
                              className="text-green-600 font-semibold text-sm cursor-pointer"
                              onClick={() => triggerConfetti()}
                            >
                              🎉 Congratulations! Fully Funded! 🎉
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWishlistItemClick(item.uuid);
                            }}
                          >
                            Support This Item
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Show More Button */}
                {creator.wishlist_items.length > 4 && !showMoreWishlist && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowMoreWishlist(true)}
                      className="bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-100 transition-colors"
                    >
                      Show More ({creator.wishlist_items.length - 4} more items)
                    </button>
                  </div>
                )}

                {/* Show Less Button */}
                {showMoreWishlist && creator.wishlist_items.length > 4 && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowMoreWishlist(false)}
                      className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
