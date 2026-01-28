'use client';

import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CreatorImage {
  avatar_url: string;
  display_name: string;
  username: string;
}

export default function HeroSection() {
  const [creatorImages, setCreatorImages] = useState<CreatorImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchedOnce = useRef(false);
  const seedRef = useRef<string>('');

  useEffect(() => {
    // Avoid double-fetch in React Strict Mode (dev) which causes flicker
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    // Generate a new random seed on each page load/refresh for variety
    // This ensures different creators show each time the page is refreshed
    seedRef.current = String(Date.now() + Math.random() * 1000000);

    fetchRandomCreatorImages();
  }, []);

  const fetchRandomCreatorImages = async () => {
    try {
      // Fetch more creators to ensure we have enough with images after filtering
      const response = await fetch(`/api/creators?limit=10&random=true&seed=${encodeURIComponent(seedRef.current)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        // Transform the data to match the expected format and filter out creators without images
        // Show exactly 4 random creators with images
        const transformedData = result.creators
          .filter((creator: any) => creator.avatar_url && creator.avatar_url.trim() !== '')
          .slice(0, 4) // Show exactly 4 creators
          .map((creator: any) => ({
            user_id: creator.user_id,
            username: creator.username,
            display_name: creator.display_name,
            avatar_url: creator.avatar_url,
            category: creator.category,
            bio: creator.bio,
            supporter_count: creator.supporter_count,
            total_earnings: 0 // We'll calculate this if needed
          }));
        setCreatorImages(transformedData);
      } else {
        // Fallback to default images if API fails
        setCreatorImages([]);
      }
    } catch (error) {
      console.error('Error fetching creator images:', error);
      setCreatorImages([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  return (
    <main className="flex flex-col items-center justify-center px-2 sm:px-4 pt-20 sm:pt-32 pb-16 sm:pb-20 relative overflow-hidden">
      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-200/60 to-transparent z-5" />
      
      {/* Right Side Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-orange-200/40 via-transparent to-transparent opacity-60 z-5" />
      
      {/* Center Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/50 to-transparent opacity-70 z-5" />
      
      {/* Draft Illustration Background */}
      <Image 
        src="/assets/images/illustrations/draft.png" 
        alt="Draft Hero Visual" 
        width={800}
        height={400}
        className="absolute inset-0 w-full h-full object-contain opacity-60 pointer-events-none select-none z-0 max-h-[300px] sm:max-h-[500px] mx-auto" 
      />
      
      <div className="flex flex-col items-center mb-6 relative z-10 w-full">
        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-green-500 text-green-500" />
          ))}
        </div>
        <div className="text-gray-500 text-sm mb-4">Loved by thousands of creators</div>
        
        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-gray-800 text-center leading-tight mb-4">
          Support Your{' '}
          <span className="italic font-serif text-gray-700">Favorite</span>
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-transparent bg-clip-text italic font-serif">
            Creators
          </span>{' '}
          <span className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-transparent bg-clip-text">
            Globally
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-gray-500 text-center max-w-xs sm:max-w-2xl mb-8">
          Empower creators across Tanzania to share their art, music, and content while earning support from their community.
        </p>
        
        {/* Creator Portfolio Showcase */}
        <div className="flex flex-col items-center mb-8 sm:mb-12 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Featured creators</span>
          </div>
          <div className="flex flex-nowrap justify-start sm:justify-center gap-2 sm:gap-4 w-full overflow-x-auto pb-2 px-2 sm:px-0">
          {loading ? (
            // Loading skeleton - show 4 placeholders
            [...Array(4)].map((_, i) => (
              <div key={i} className="w-40 h-28 sm:w-48 sm:h-32 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0" />
            ))
          ) : creatorImages.length > 0 ? (
            // Dynamic creator images - only show creators with actual images
            <div>
              {creatorImages.map((creator, index) => {
                // More rotation variations for up to 6 creators
                const rotations = [-8, 4, -3, 6, -5, 7];
                const rotation = rotations[index % rotations.length];
                
                return (
                  <div key={creator.username || index} className="relative group inline-block flex-shrink-0">
                    <img 
                      src={creator.avatar_url} 
                      alt={creator.display_name} 
                      className="w-40 h-28 sm:w-48 sm:h-32 object-cover rounded-2xl shadow-lg transform hover:rotate-0 transition-all duration-500 hover:scale-105"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      onError={(e) => {
                        // If image fails to load, hide this creator card
                        e.currentTarget.parentElement?.style.setProperty('display', 'none');
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 left-2 right-2 text-white text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {creator.display_name}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback to default images if no creators found
            <>
              <div className="relative group flex-shrink-0">
                <img 
                  src="https://images.pexels.com/photos/8721318/pexels-photo-8721318.jpeg?auto=compress&cs=tinysrgb&w=300&h=400" 
                  alt="Digital Artist" 
                  className="w-40 h-28 sm:w-48 sm:h-32 object-cover rounded-2xl shadow-lg transform rotate-[-8deg] hover:rotate-0 transition-all duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="relative group flex-shrink-0">
                <img 
                  src="https://images.pexels.com/photos/7606131/pexels-photo-7606131.jpeg?auto=compress&cs=tinysrgb&w=300&h=400" 
                  alt="Musician" 
                  className="w-40 h-28 sm:w-48 sm:h-32 object-cover rounded-2xl shadow-lg transform rotate-[4deg] hover:rotate-0 transition-all duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="relative group flex-shrink-0">
                <img 
                  src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=400" 
                  alt="Content Creator" 
                  className="w-40 h-28 sm:w-48 sm:h-32 object-cover rounded-2xl shadow-lg transform rotate-[-3deg] hover:rotate-0 transition-all duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="relative group flex-shrink-0">
                <img 
                  src="https://images.pexels.com/photos/7606128/pexels-photo-7606128.jpeg?auto=compress&cs=tinysrgb&w=300&h=400" 
                  alt="Photographer" 
                  className="w-40 h-28 sm:w-48 sm:h-32 object-cover rounded-2xl shadow-lg transform rotate-[6deg] hover:rotate-0 transition-all duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </>
          )}
          </div>
        </div>
        
        {/* CTA Button */}
        <Link href="/choose-username">
          <Button 
            className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] hover:from-orange-500 hover:to-orange-300 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 rounded-full shadow-lg transition mb-2"
          >
            Start my page
          </Button>
        </Link>
        <div className="text-gray-400 text-xs sm:text-sm mt-2">It&apos;s free and takes less than a minute!</div>
      </div>
    </main>
  );
}