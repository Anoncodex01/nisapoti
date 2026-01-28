'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Creator {
  id: string;
  user_id?: string;
  display_name: string;
  username?: string;
  category: string;
  bio: string;
  avatar_url?: string;
  supporter_count: number;
  created_at: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Reset creators and hasMore when filters change
    setCreators([]);
    setHasMore(true);
    fetchCreators();
  }, [selectedCategory, debouncedSearchQuery]);

  const fetchCreators = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }
      params.append('limit', '20');
      if (loadMore) {
        params.append('offset', creators.length.toString());
      }

      // Fetch creators from API
      const response = await fetch(`/api/creators?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }

      const data = await response.json();
      
      if (loadMore) {
        setCreators(prev => [...prev, ...(data.creators || [])]);
      } else {
        setCreators(data.creators || []);
        setCategories(data.categories || []);
      }

      // Check if there are more creators to load
      setHasMore((data.creators || []).length === 20);

    } catch (error) {
      console.error('Error fetching creators:', error);
      // Fallback to empty array on error
      if (!loadMore) {
        setCreators([]);
        setCategories([]);
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      entrepreneur: '💼',
      blogger: '✍️',
      coach: '🎯',
      developer: '👨‍💻',
      educator: '📚',
      writer: '✒️',
      author: '📖',
      artist: '🎨',
      marketer: '📊',
      youtuber: '🎥',
      tiktoker: '📱',
      designer: '🎨',
      content_creator: '🎬'
    };
    return emojis[category] || '👤';
  };

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewPage = (creator: Creator) => {
    const creatorSlug = creator.username || creator.user_id || creator.id;
    if (!creatorSlug) {
      return;
    }
    router.push(`/${creatorSlug}`);
  };

  const handleLoadMore = () => {
    fetchCreators(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-4 lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Creators</h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">Discover amazing creators and see what they&apos;re building</p>
          </div>
        </div>
        
        {/* Category Filter Loading */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8 animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-48 mb-4 sm:mb-6"></div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 sm:h-12 bg-gray-200 rounded-xl w-32 flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Creators Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Creators</h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">Discover amazing creators and see what they&apos;re building</p>
        </div>
        
        {/* Search and Sort - Mobile First */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full sm:w-64 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {loading && searchQuery ? (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <button className="px-4 py-3 sm:px-6 text-sm font-medium text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap">
            Sort by Popular
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-[#FF6A1A] to-[#FF9A3C] rounded-full mr-3 sm:mr-4"></div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Filter by Category</h3>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              selectedCategory === ''
                ? 'bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {getCategoryEmoji(category)} {formatCategory(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {creators.map((creator) => (
          <div key={creator.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6A1A] to-[#FF9A3C] rounded-2xl flex items-center justify-center shadow-lg">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.display_name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {creator.display_name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">{creator.display_name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{getCategoryEmoji(creator.category)}</span>
                  <span className="text-sm text-gray-600 font-medium">{formatCategory(creator.category)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-base mb-6 line-clamp-3 leading-relaxed">{creator.bio}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-semibold">{creator.supporter_count} supporters</span>
              </div>
              <button 
                onClick={() => handleViewPage(creator)}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
              >
                View Page
              </button>
            </div>
          </div>
        ))}
      </div>

      {creators.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#FF6A1A]/20 to-[#FF9A3C]/20 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#FF6A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No creators found</h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            {selectedCategory 
              ? `No creators found in the ${formatCategory(selectedCategory)} category. Try exploring other categories.`
              : 'No creators available at the moment. Check back later for new creators.'
            }
          </p>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View All Categories
            </button>
          )}
        </div>
      )}

      {/* Load More */}
      {creators.length > 0 && hasMore && (
        <div className="text-center pt-6 sm:pt-8">
          <button 
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              'Load More Creators'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
