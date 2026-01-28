'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Try to import HugeIcons, fallback to emoji if not available
let HugeIcons: any = {};
try {
  HugeIcons = require('@hugeicons/react');
} catch (e) {
  console.warn('HugeIcons not available');
}

interface Creator {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  category: string;
  bio?: string;
  supporter_count: number;
  total_earnings: number;
}

interface Category {
  id: string | number;
  name: string;
  slug: string;
  icon: string;
}

// Map categories to HugeIcons with fallback to emoji
const getCategoryIcon = (categorySlug: string) => {
  const iconMap: { [key: string]: { icon?: any; emoji: string } } = {
    'all': { icon: HugeIcons.SparklesIcon || HugeIcons.Sparkles01Icon, emoji: '🌟' },
    'entrepreneur': { icon: HugeIcons.BriefcaseIcon || HugeIcons.Briefcase01Icon, emoji: '💼' },
    'blogger': { icon: HugeIcons.EditIcon || HugeIcons.Edit01Icon, emoji: '✍️' },
    'coach': { icon: HugeIcons.TargetIcon || HugeIcons.Target01Icon, emoji: '🎯' },
    'developer': { icon: HugeIcons.CodeIcon || HugeIcons.Code01Icon, emoji: '👨‍💻' },
    'educator': { icon: HugeIcons.BookIcon || HugeIcons.Book01Icon, emoji: '📚' },
    'writer': { icon: HugeIcons.PenIcon || HugeIcons.Pen01Icon, emoji: '✒️' },
    'author': { icon: HugeIcons.BookOpenIcon || HugeIcons.BookOpen01Icon, emoji: '📖' },
    'artist': { icon: HugeIcons.PaletteIcon || HugeIcons.Palette01Icon, emoji: '🎨' },
    'marketer': { icon: HugeIcons.ChartBarIcon || HugeIcons.ChartBar01Icon, emoji: '📊' },
    'youtuber': { icon: HugeIcons.VideoIcon || HugeIcons.Video01Icon, emoji: '🎥' },
    'tiktoker': { icon: HugeIcons.SmartphoneIcon || HugeIcons.Smartphone01Icon, emoji: '📱' },
    'designer': { icon: HugeIcons.DesignIcon || HugeIcons.Design01Icon, emoji: '🎨' },
    'content_creator': { icon: HugeIcons.FilmIcon || HugeIcons.Film01Icon, emoji: '🎬' },
  };

  return iconMap[categorySlug] || iconMap['all'];
};

export default function CreatorShowcase() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  // Default categories
  const defaultCategories = [
    { id: 'all', name: 'All', slug: 'all', icon: 'sparkles' },
    { id: 'entrepreneur', name: 'Entrepreneur', slug: 'entrepreneur', icon: 'briefcase' },
    { id: 'blogger', name: 'Blogger', slug: 'blogger', icon: 'edit' },
    { id: 'coach', name: 'Coach', slug: 'coach', icon: 'target' },
    { id: 'developer', name: 'Developer', slug: 'developer', icon: 'code' },
    { id: 'educator', name: 'Educator', slug: 'educator', icon: 'book' },
    { id: 'writer', name: 'Writer', slug: 'writer', icon: 'pen' },
    { id: 'author', name: 'Author', slug: 'author', icon: 'book-open' },
    { id: 'artist', name: 'Artist', slug: 'artist', icon: 'palette' },
    { id: 'marketer', name: 'Marketer', slug: 'marketer', icon: 'chart-bar' },
    { id: 'youtuber', name: 'YouTuber', slug: 'youtuber', icon: 'video' },
    { id: 'tiktoker', name: 'TikToker', slug: 'tiktoker', icon: 'smartphone' },
    { id: 'designer', name: 'Designer', slug: 'designer', icon: 'design' },
    { id: 'content_creator', name: 'Content Creator', slug: 'content_creator', icon: 'film' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchFeaturedCreators();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();

      if (response.ok && result.success) {
        const allCategories = [
          { id: 'all', name: 'All', slug: 'all', icon: 'sparkles' },
          ...result.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '_'),
            icon: cat.icon || 'sparkles'
          }))
        ];
        setCategories(allCategories);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    }
  };

  const fetchFeaturedCreators = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? '/api/creators/featured' 
        : `/api/creators/featured?category=${selectedCategory}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok && result.success) {
        setCreators(result.data);
      } else {
        console.error('Failed to fetch featured creators:', result.error);
      }
    } catch (error) {
      console.error('Error fetching featured creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Tsh ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Tsh ${(amount / 1000).toFixed(0)}K`;
    } else {
      return `Tsh ${amount.toFixed(0)}`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white via-orange-50/30 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-600 hover:bg-orange-500/20 mb-6 px-6 py-2.5 text-xs font-bold tracking-widest border border-orange-200/50 backdrop-blur-sm">
            SUCCESS STORIES
          </Badge>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="text-gray-900">Meet Our</span>
            <br />
            <span className="bg-gradient-to-r from-[#FF6A1A] via-[#FF8C42] to-[#FF9A3C] text-transparent bg-clip-text">
              Thriving Creators
            </span>
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Real creators, real success stories. See how Nisapoti is transforming creative careers across Tanzania.
          </p>

          {/* Modern Category Filter with HugeIcons */}
          <div className="w-full mb-16">
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 px-2">
              {(categories.length > 0 ? categories : defaultCategories).map((category) => {
                const slug = (category as any).slug || String(category.id);
                const isActive = selectedCategory === slug;
                const iconData = getCategoryIcon(slug);
                const IconComponent = iconData?.icon;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(slug)}
                    className={`group flex-shrink-0 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 scale-105'
                        : 'bg-white/90 backdrop-blur-md text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200/60 hover:border-orange-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Active gradient overlay */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-90"></div>
                    )}
                    {IconComponent ? (
                      <IconComponent 
                        className={`w-5 h-5 transition-transform duration-300 relative z-10 ${
                          isActive 
                            ? 'text-white scale-110' 
                            : 'text-gray-600 group-hover:text-orange-600 group-hover:scale-110'
                        }`}
                      />
                    ) : (
                      <span className="text-lg relative z-10">{iconData?.emoji || '🌟'}</span>
                    )}
                    <span className="relative z-10">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modern Creator Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 animate-pulse overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-8 bg-gray-200 rounded-lg mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {creators.map((creator, index) => (
              <Link 
                key={creator.user_id}
                href={`/${creator.username}`}
                className="group block"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100/50 hover:border-orange-200/50 hover:-translate-y-2 relative">
                  {/* Modern Image Container with Glassmorphism */}
                  <div className="relative h-64 overflow-hidden">
                    {creator.avatar_url ? (
                      <img 
                        src={creator.avatar_url} 
                        alt={creator.display_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50 to-orange-100 ${creator.avatar_url ? 'hidden' : ''}`}>
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl">
                        {getInitials(creator.display_name)}
                      </div>
                    </div>
                    
                    {/* Modern Category Badge with Glassmorphism */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/95 backdrop-blur-md text-orange-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wide shadow-xl border border-orange-200/50">
                        {creator.category?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Modern Supporter Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-xl border border-gray-200/50">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        <span className="text-gray-800 text-sm font-black">{creator.supporter_count}+</span>
                      </div>
                    </div>

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Modern Content Section */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {creator.display_name}
                      </h3>
                      {creator.bio && (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                    
                    {/* Modern Earnings Display */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 mb-1">
                          {formatCurrency(creator.total_earnings)}
                        </div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                          Total Earnings
                        </div>
                      </div>
                      
                      {/* Modern Action Button */}
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl shadow-orange-500/30">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
              <span className="text-4xl">🌟</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">No creators available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
