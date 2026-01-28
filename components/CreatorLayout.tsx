'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, ExternalLink, MoreVertical, Share2, Gift, X } from 'lucide-react';
import ShopPage from './ShopPage';
import WishlistPage from './WishlistPage';
import CreatorHeader from './CreatorHeader';

interface CreatorData {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  category: string;
  bio: string;
  creator_url: string;
  website?: string;
  supporter_count: number;
  wishlist_items: any[];
  feature_image?: string;
}

interface Supporter {
  id: string;
  name: string;
  phone: string;
  amount: number;
  type: 'support' | 'wishlist';
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
}

interface CreatorLayoutProps {
  creator: CreatorData;
  formatCurrency: (amount: number) => string;
  getInitials: (name: string | undefined | null) => string;
  handleSupportSubmit: (e: React.FormEvent) => void;
  supporterName: string;
  setSupporterName: (name: string) => void;
  supporterMessage: string;
  setSupporterMessage: (message: string) => void;
  supportAmount: number;
  setSupportAmount: (amount: number) => void;
  submitting: boolean;
  processingPayment?: boolean;
  depositId?: string | null;
  activeTab: 'support' | 'shop' | 'wishlist';
  setActiveTab: (tab: 'support' | 'shop' | 'wishlist') => void;
  isTransitioning?: boolean;
}

export default function CreatorLayout({
  creator,
  formatCurrency,
  getInitials,
  handleSupportSubmit,
  supporterName,
  setSupporterName,
  supporterMessage,
  setSupporterMessage,
  supportAmount,
  setSupportAmount,
  submitting,
  processingPayment = false,
  depositId = null,
  activeTab,
  setActiveTab,
  isTransitioning = false,
}: CreatorLayoutProps) {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loadingSupporters, setLoadingSupporters] = useState(true);
  const [showSupportersModal, setShowSupportersModal] = useState(false);
  const [allSupporters, setAllSupporters] = useState<Supporter[]>([]);
  const [loadingAllSupporters, setLoadingAllSupporters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchSupporters();
  }, [creator.user_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const fetchSupporters = async () => {
    try {
      setLoadingSupporters(true);
      const response = await fetch(`/api/supporters?creator_id=${creator.user_id}&limit=5`);
      const result = await response.json();

      if (response.ok && result.success) {
        setSupporters(result.supporters || []);
      } else {
        console.error('Failed to fetch supporters:', result.error);
        setSupporters([]);
      }
    } catch (error) {
      console.error('Error fetching supporters:', error);
      setSupporters([]);
    } finally {
      setLoadingSupporters(false);
    }
  };

  const fetchAllSupporters = async () => {
    try {
      setLoadingAllSupporters(true);
      const response = await fetch(`/api/supporters?creator_id=${creator.user_id}&limit=50`);
      const result = await response.json();

      if (response.ok && result.success) {
        setAllSupporters(result.supporters || []);
      } else {
        console.error('Failed to fetch all supporters:', result.error);
        setAllSupporters([]);
      }
    } catch (error) {
      console.error('Error fetching all supporters:', error);
      setAllSupporters([]);
    } finally {
      setLoadingAllSupporters(false);
    }
  };

  const handleSeeMoreClick = () => {
    setShowSupportersModal(true);
    fetchAllSupporters();
  };

  const toggleDropdown = (supporterId: string) => {
    setOpenDropdownId(openDropdownId === supporterId ? null : supporterId);
  };

  const handleShareClick = () => {
    const creatorUrl = `${window.location.origin}/${creator.username}`;
    navigator.clipboard.writeText(creatorUrl);
    setOpenDropdownId(null); // Close dropdown after sharing
  };

  // Handle different tab content
  const renderTabContent = () => {
    if (activeTab === 'shop') {
      return <ShopPage 
        creatorName={creator.display_name} 
        creator={creator}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getInitials={getInitials}
        isTransitioning={isTransitioning}
      />;
    }

    if (activeTab === 'wishlist') {
      return <WishlistPage 
        creator={creator}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getInitials={getInitials}
        isTransitioning={isTransitioning}
      />;
    }

    return null; // support tab content will be rendered in the main layout
  };

  // If shop or wishlist tab is active, show the full page
  if (activeTab === 'shop' || activeTab === 'wishlist') {
    return renderTabContent();
  }

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
      <div className={`max-w-6xl mx-auto px-4 py-6 transition-all duration-300 ease-in-out ${
        isTransitioning ? 'opacity-50 transform scale-98' : 'opacity-100 transform scale-100'
      }`}>

        {/* Mobile Layout - Single Column */}
        <div className="block md:hidden">
          <div className="space-y-6">
            {/* Mobile Support Form - Prominent on Mobile */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Support {creator.display_name}</h3>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSupportSubmit(e);
                }} 
                className="space-y-4"
                noValidate
              >
                {/* Choose Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Choose Amount</label>
                  <div className="bg-orange-100 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-center space-x-3">
                      {/* Heart Icon Button */}
                      <button
                        type="button"
                        onClick={() => setSupportAmount(5000)}
                        className={`w-12 h-12 rounded-full border-2 transition-colors ${
                          supportAmount === 5000 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'bg-orange-100 border-orange-500 text-orange-500 hover:bg-orange-200'
                        }`}
                      >
                        <Heart className="w-5 h-5 mx-auto" fill={supportAmount === 5000 ? 'currentColor' : 'none'} />
                      </button>
                      
                      {/* Multiplication Symbol */}
                      <span className="text-gray-500 text-lg">×</span>
                      
                      {/* Number 1 Button */}
                      <button
                        type="button"
                        onClick={() => setSupportAmount(10000)}
                        className={`w-12 h-12 rounded-full border-2 transition-colors ${
                          supportAmount === 10000 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'bg-orange-100 border-orange-500 text-orange-500 hover:bg-orange-200'
                        }`}
                      >
                        <span className="text-lg font-semibold">1</span>
                      </button>
                      
                      {/* Number 3 Button */}
                      <button
                        type="button"
                        onClick={() => setSupportAmount(30000)}
                        className={`w-12 h-12 rounded-full border-2 transition-colors ${
                          supportAmount === 30000 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'bg-orange-100 border-orange-500 text-orange-500 hover:bg-orange-200'
                        }`}
                      >
                        <span className="text-lg font-semibold">3</span>
                      </button>
                      
                      {/* Number 5 Button (Default Selected) */}
                      <button
                        type="button"
                        onClick={() => setSupportAmount(50000)}
                        className={`w-12 h-12 rounded-full border-2 transition-colors ${
                          supportAmount === 50000 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'bg-orange-100 border-orange-500 text-orange-500 hover:bg-orange-200'
                        }`}
                      >
                        <span className="text-lg font-semibold">5</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={supportAmount}
                    onChange={(e) => setSupportAmount(Number(e.target.value))}
                    placeholder="Enter custom amount"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400"
                  />
                </div>

                {/* Your Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={supporterMessage}
                    onChange={(e) => setSupporterMessage(e.target.value)}
                    placeholder="e.g., 0712345678"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400"
                  />
                </div>

                {/* Support Button */}
                  <button
                    type="submit"
                    disabled={submitting || processingPayment || !supporterName.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300"
                  >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating payment...</span>
                    </div>
                  ) : processingPayment ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing payment...</span>
                    </div>
                  ) : (
                    `Support - ${formatCurrency(supportAmount)}`
                  )}
                </button>
              </form>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">About {creator.display_name}</h3>
              <p className="text-orange-500 font-medium text-sm mb-4">{creator.category || 'Creator'}</p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {creator.bio || 'Check out what I\'ve created! Get inspired and join me on this incredible journey. Oh, and don\'t forget to support me to make the adventure even more memorable and help us achieve another milestone together. Cheers!'}
              </p>
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View</span>
                </a>
              )}
            </div>

            {/* Recent Supporters Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent supporters</h3>
                <button
                  onClick={handleSeeMoreClick}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  See more
                </button>
              </div>

              {loadingSupporters ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : supporters.length > 0 ? (
                <div className="space-y-3">
                  {supporters.slice(0, 3).map((supporter, index) => {
                    const avatarColors = [
                      'bg-orange-100 text-orange-600',
                      'bg-blue-100 text-blue-600',
                      'bg-green-100 text-green-600',
                      'bg-purple-100 text-purple-600',
                      'bg-yellow-100 text-yellow-600'
                    ];
                    const colorClass = avatarColors[index % avatarColors.length];
                    
                    return (
                      <div key={supporter.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center`}>
                          <span className="font-bold text-sm">
                            {getInitials(supporter.name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-sm">
                            {supporter.name || 'Anonymous'} supported you
                          </p>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={() => toggleDropdown(supporter.id)}
                            className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openDropdownId === supporter.id && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={handleShareClick}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No supporters yet</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Combined About and Recent Supporters Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
                {/* About Section */}
                <div className="p-8 pb-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">About {creator.display_name}</h2>
                  <p className="text-orange-500 font-medium text-sm mb-4">{creator.category || 'Creator'}</p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {creator.bio || 'Check out what I\'ve created! Get inspired and join me on this incredible journey. Oh, and don\'t forget to support me to make the adventure even more memorable and help us achieve another milestone together. Cheers!'}
                  </p>
                  <div className="mt-4">
                    <a
                      href={creator.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View</span>
                    </a>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 mx-8 mt-6"></div>

                {/* Recent Supporters */}
                <div className="p-8 pt-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent supporters</h2>
                {loadingSupporters ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-start space-x-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : supporters.length > 0 ? (
                  <div className="space-y-4">
                    {supporters.map((supporter, index) => {
                      const avatarColors = [
                        'bg-orange-100 text-orange-600',
                        'bg-blue-100 text-blue-600',
                        'bg-green-100 text-green-600',
                        'bg-purple-100 text-purple-600',
                        'bg-yellow-100 text-yellow-600'
                      ];
                      const colorClass = avatarColors[index % avatarColors.length];
                      
                      return (
                        <div key={supporter.id} className="flex items-start space-x-3 relative">
                          <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center relative`}>
                            <span className="font-bold text-sm">
                              {getInitials(supporter.name)}
                            </span>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">
                              {supporter.name || 'Anonymous'} supported you
                            </p>
                          </div>
                          <div className="relative">
                            <button 
                              onClick={() => toggleDropdown(supporter.id)}
                              className="p-1 text-gray-400 hover:text-orange-500 transition-colors rounded-full hover:bg-orange-100"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openDropdownId === supporter.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                <button
                                  onClick={handleShareClick}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span>Share</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No supporters yet</p>
                  </div>
                )}
                
                {/* See More Button */}
                <div className="mt-6 text-center">
                  <button 
                    onClick={handleSeeMoreClick}
                    className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center justify-center space-x-1 mx-auto transition-colors"
                  >
                    <span>See more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                </div>
              </div>

              {/* Posts Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Posts</h2>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No posts yet</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">

              {/* Support Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8">
                <div className="flex items-center space-x-2 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Support {creator.display_name}</h2>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                {/* Support Amount Selector */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-gray-400 font-bold">×</span>
                    <div className="flex items-center space-x-2">
                      {[1, 3, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => setSupportAmount(count * 3000)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                            supportAmount === count * 3000
                              ? 'bg-orange-500 text-white scale-110 shadow-lg'
                              : 'bg-orange-100 text-orange-600 hover:bg-orange-200 hover:scale-105'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Support Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSupportSubmit(e);
                  }} 
                  className="space-y-4"
                  noValidate
                >
                  <input
                    type="number"
                    value={supportAmount}
                    onChange={(e) => setSupportAmount(Number(e.target.value))}
                    placeholder="Enter custom amount"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400 hover:bg-gray-100"
                  />
                  
                  <input
                    type="text"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="Your name *"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400 hover:bg-gray-100"
                  />
                  
                  <input
                    type="tel"
                    value={supporterMessage}
                    onChange={(e) => setSupporterMessage(e.target.value)}
                    placeholder="Phone number (e.g., 0712345678) *"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400 hover:bg-gray-100"
                  />
                  
                  <button
                    type="submit"
                    disabled={submitting || processingPayment || !supporterName.trim()}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating payment...</span>
                      </div>
                    ) : processingPayment ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing payment...</span>
                      </div>
                    ) : (
                      `Support ${formatCurrency(supportAmount)}`
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporters Modal */}
      {showSupportersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">All Supporters</h2>
              <button
                onClick={() => setShowSupportersModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingAllSupporters ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : allSupporters.length > 0 ? (
                <div className="space-y-4">
                  {allSupporters.map((supporter, index) => {
                    const avatarColors = [
                      'bg-orange-100 text-orange-600',
                      'bg-blue-100 text-blue-600',
                      'bg-green-100 text-green-600',
                      'bg-purple-100 text-purple-600',
                      'bg-yellow-100 text-yellow-600'
                    ];
                    const colorClass = avatarColors[index % avatarColors.length];
                    
                    return (
                      <div key={supporter.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
                          <span className="font-bold text-sm">
                            {getInitials(supporter.name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {supporter.name || 'Anonymous'} supported you
                          </p>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={() => toggleDropdown(`modal-${supporter.id}`)}
                            className="p-1 text-gray-400 hover:text-orange-500 transition-colors rounded-full hover:bg-orange-100"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openDropdownId === `modal-${supporter.id}` && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={handleShareClick}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No supporters found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}