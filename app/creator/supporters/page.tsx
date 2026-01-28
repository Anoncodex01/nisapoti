'use client';

import { useState, useEffect } from 'react';
// Removed old AuthContext import

interface Supporter {
  id: string;
  name: string;
  phone: string;
  amount: number;
  type: 'support' | 'wishlist';
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  wishlist_name?: string;
  wishlist_id?: string;
}

export default function SupportersPage() {
  const [user, setUser] = useState<any>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    last_30_days: 0,
    all_time: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchSupporters();
    }
  }, [currentPage, user?.id]);


  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/profile?user_id=${user.id}`);
      
      if (response.ok) {
        const result = await response.json();
        const profileData = result.data || result; // Handle both response formats
        setProfile(profileData);
      } else {
        // Fallback to user_metadata if API call fails
        if (user.user_metadata) {
          const metadata = user.user_metadata;
          setProfile({
            display_name: metadata.display_name || '',
            username: metadata.username || '',
            avatar_url: metadata.avatar_url || '',
            bio: metadata.bio || '',
            category: metadata.category || '',
            website: metadata.website || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user_metadata if API call fails
      if (user.user_metadata) {
        const metadata = user.user_metadata;
        setProfile({
          display_name: metadata.display_name || '',
          username: metadata.username || '',
          avatar_url: metadata.avatar_url || '',
          bio: metadata.bio || '',
          category: metadata.category || '',
          website: metadata.website || ''
        });
      }
    }
  };

  const fetchSupporters = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      
      // Fetch supporters from API
      const response = await fetch(`/api/supporters?creator_id=${user.id}&limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch supporters');
      }

      const data = await response.json();
      
      setSupporters(data.supporters || []);
      setStats(data.stats || { total: 0, last_30_days: 0, all_time: 0 });
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || 0);
      
    } catch (error) {
      console.error('Error fetching supporters:', error);
      setError(error instanceof Error ? error.message : 'Failed to load supporters');
      // Fallback to empty data on error
      setSupporters([]);
      setStats({ total: 0, last_30_days: 0, all_time: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    return type === 'support' ? '💰' : '🎁';
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} mins ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hrs ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 px-4">
        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded-lg w-24"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 text-center animate-pulse">
              <div className="h-6 sm:h-5 bg-gray-200 rounded w-16 mx-auto mb-1 sm:mb-2"></div>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Supporters List Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-4">
                {/* Avatar and Name Skeleton */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>

                {/* Amount Skeleton */}
                <div className="text-center flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>

                {/* Date Skeleton */}
                <div className="text-right flex-1 min-w-0">
                  <div className="h-3 bg-gray-200 rounded w-12 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.display_name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6A1A]/10 to-[#FF9A3C]/10 flex items-center justify-center">
                  <span className="text-base font-semibold text-[#FF6A1A]">
                    {profile?.display_name?.split(' ').map((n: string) => n[0]).join('') || 
                     user?.user_metadata?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Hi, {profile?.display_name || user?.user_metadata?.display_name || 'User'}
              </h1>
              <p className="text-sm text-gray-600">
                nisapoti.com/{profile?.username || user?.user_metadata?.username || 'user'}
              </p>
            </div>
          </div>
            <button className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-500 hover:to-orange-300 transition-all flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share page</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Supporters</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchSupporters()}
            className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-500 hover:to-orange-300 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-4">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.display_name || 'User'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-[#FF6A1A]/10 to-[#FF9A3C]/10 flex items-center justify-center ${profile?.avatar_url ? 'hidden' : ''}`}>
                <span className="text-base sm:text-lg font-semibold text-[#FF6A1A]">
                  {profile?.display_name?.split(' ').map((n: string) => n[0]).join('') || 
                   user?.user_metadata?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Hi, {profile?.display_name || user?.user_metadata?.display_name || 'User'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                nisapoti.com/{profile?.username || user?.user_metadata?.username || 'user'}
              </p>
            </div>
          </div>
          <button className="w-full sm:w-auto bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-500 hover:to-orange-300 transition-all flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share page</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 text-center">
          <h3 className="text-xl sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{stats.total}</h3>
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-gray-600">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-xs sm:text-sm font-medium">Supporters</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 text-center">
          <h3 className="text-xl sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
            Tsh {stats.last_30_days.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-gray-600">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Last 30 days</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 text-center">
          <h3 className="text-xl sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
            Tsh {stats.all_time.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-gray-600">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">All-time</span>
          </div>
        </div>
      </div>

      {/* Recent Supporters List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Supporters</h2>
            {totalCount > 0 && (
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {totalCount} {totalCount === 1 ? 'supporter' : 'supporters'}
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {supporters.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6A1A]/10 to-[#FF9A3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#FF6A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No supporters yet</h3>
              <p className="text-gray-500 mb-4">When people support you, they&apos;ll appear here.</p>
              <div className="text-sm text-gray-400">
                <p>Share your page to start receiving support!</p>
              </div>
            </div>
          ) : (
            supporters.map((supporter) => (
            <div key={supporter.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors">
              {/* Avatar and Name */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-[#FF6A1A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">
                    {supporter.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{supporter.name}</h3>
                  {supporter.type === 'wishlist' && supporter.wishlist_name && (
                    <p className="text-xs text-gray-500 truncate">Wishlist: {supporter.wishlist_name}</p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-center flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  Tsh {parseFloat(supporter.amount.toString()).toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                </div>
                {supporter.type === 'wishlist' && (
                  <div className="text-xs text-gray-500 mt-0.5">Wishlist</div>
                )}
              </div>

              {/* Date */}
              <div className="text-right flex-1 min-w-0">
                <div className="text-xs text-gray-500">
                  {getTimeAgo(supporter.created_at)}
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing <span className="font-medium text-gray-700">{(currentPage - 1) * 20 + 1}</span> to{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(currentPage * 20, totalCount)}
                </span>{' '}
                of <span className="font-medium text-gray-700">{totalCount}</span> supporters
              </div>
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
