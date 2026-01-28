'use client';

import { useState, useEffect } from 'react';

interface Creator {
  display_name: string;
  avatar_url?: string;
  supporter_count: number;
  feature_image?: string;
}

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface CreatorHeaderProps {
  creator: Creator;
  getInitials: (name: string | undefined | null) => string;
  bannerTitle: string;
  bannerSubtitle: string;
  showNavigation?: boolean;
  activeTab?: 'support' | 'shop' | 'wishlist';
  onTabChange?: (tab: 'support' | 'shop' | 'wishlist') => void;
  showActionButtons?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export default function CreatorHeader({
  creator,
  getInitials,
  bannerTitle,
  bannerSubtitle,
  showNavigation = false,
  activeTab,
  onTabChange,
  showActionButtons = false,
  onClose,
  isModal = false
}: CreatorHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // User is not logged in, which is fine
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setShowUserDropdown(false);
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);
  return (
    <>
      {/* Top Header Bar - Full Width */}
      <div className="sticky top-0 z-50 bg-white text-gray-800 py-3 md:py-4 px-4 md:px-6 mb-0 w-full shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Nisapoti Logo */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Nisapoti"
                className="w-25 h-8 md:w-28 md:h-12 object-contain"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-14 h-10 md:w-18 md:h-12 bg-orange-500 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-base md:text-xl">N</span></div>';
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onClose ? (
              <button 
                onClick={onClose}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <>
                {!loading && (
                  <>
                    {user ? (
                      // User is logged in - show profile dropdown
                      <div className="relative user-dropdown-container">
                        <button
                          onClick={toggleUserDropdown}
                          className="flex items-center space-x-2 md:space-x-3 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 md:px-4 py-2 rounded-full border border-gray-200 transition-all duration-300"
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.display_name}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-gray-300"
                            />
                          ) : (
                            <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold border-2 border-gray-300">
                              {getInitials(user.display_name)}
                            </div>
                          )}
                          <div className="text-left hidden sm:block">
                            <div className="text-xs md:text-sm font-semibold">{user.display_name}</div>
                            <div className="text-xs opacity-80">@{user.username}</div>
                          </div>
                          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showUserDropdown && (
                          <div className="absolute right-0 top-12 bg-white border border-orange-200 rounded-xl shadow-xl py-3 z-50 min-w-[220px] backdrop-blur-sm">
                            <div className="px-4 py-2 border-b border-gray-100">
                              <div className="text-sm font-semibold text-gray-900">{user.display_name}</div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </div>
                            <a
                              href={`/${user.username}`}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              View my page
                            </a>
                            <a
                              href="/creator/dashboard"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Dashboard
                            </a>
                            <a
                              href="/profile"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              My account
                            </a>
                            <a
                              href="/refer"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              Refer a creator
                            </a>
                            <hr className="my-2 border-gray-100" />
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // User is not logged in - show login/signup buttons
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <a
                          href="/login"
                          className="text-gray-600 hover:text-gray-800 text-xs md:text-sm font-medium transition-colors px-2 md:px-3 py-2 rounded-lg hover:bg-gray-100"
                        >
                          Login
                        </a>
                        <a
                          href="/choose-username"
                          className="bg-orange-500 text-white hover:bg-orange-600 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Sign Up
                        </a>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature Image Banner - Full Width */}
      <div className={`relative mb-0 w-full ${isModal ? 'h-32' : 'h-48 md:h-64'} overflow-hidden`}>
        {creator.feature_image ? (
          <img
            src={creator.feature_image}
            alt={`${creator.display_name}'s feature image`}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="/assets/images/photos/pexels-pixabay-302769.jpg"
            alt="Default feature image"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to tanzania.jpg if sea.jpg fails
              const target = e.target as HTMLImageElement;
              target.src = '/assets/images/photos/tanzania.jpg';
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Profile Information Section */}
      <div className={`relative mb-8 ${isModal ? '-mt-8' : '-mt-12 md:-mt-16'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  className={`rounded-full object-cover border-4 border-white shadow-lg ${isModal ? 'w-12 h-12' : 'w-16 h-16 md:w-20 md:h-20'}`}
                />
              ) : (
                <div className={`bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg ${isModal ? 'w-12 h-12 text-lg' : 'w-16 h-16 md:w-20 md:h-20 text-lg md:text-2xl'}`}>
                  {getInitials(creator.display_name)}
                </div>
              )}
              <div>
                <h1 className={`font-bold text-gray-900 ${isModal ? 'text-lg' : 'text-lg md:text-2xl'}`}>{creator.display_name}</h1>
                <p className={`text-gray-600 ${isModal ? 'text-sm' : 'text-sm md:text-base'}`}>{creator.supporter_count} supporters</p>
              </div>
            </div>
            
            {showActionButtons && (
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* <button className="px-4 md:px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm">
                  Support
                </button> */}
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            )}

            {isModal && (
              <div className="text-sm text-gray-500">
                {creator.display_name} &gt; Shop &gt; Checkout
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          {showNavigation && onTabChange && (
            <div className="flex space-x-6 md:space-x-8 mt-4 md:mt-6 border-b border-gray-200">
              <button
                onClick={() => onTabChange('support')}
                className={`pb-3 text-xs md:text-sm font-medium transition-all duration-300 ease-in-out transform ${
                  activeTab === 'support'
                    ? 'text-orange-500 border-b-2 border-orange-500 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onTabChange('shop')}
                className={`pb-3 text-xs md:text-sm font-medium transition-all duration-300 ease-in-out transform ${
                  activeTab === 'shop'
                    ? 'text-orange-500 border-b-2 border-orange-500 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
              >
                Shop
              </button>
              <button
                onClick={() => onTabChange('wishlist')}
                className={`pb-3 text-xs md:text-sm font-medium transition-all duration-300 ease-in-out transform ${
                  activeTab === 'wishlist'
                    ? 'text-orange-500 border-b-2 border-orange-500 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
              >
                Wishlist
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
