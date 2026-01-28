'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Creator {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  supporter_count: number;
}

export default function ClaimSection() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback avatars if API fails
  const fallbackAvatars = [
    "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100"
  ];

  const fetchedOnce = useRef(false);
  const seedRef = useRef<string>('');

  useEffect(() => {
    if (fetchedOnce.current) return; // avoid double fetch in React Strict Mode
    fetchedOnce.current = true;
    // Generate a fresh seed per full page load (do not persist) so avatars change after refresh
    seedRef.current = String(Date.now());
    fetchCreatorAvatars();
  }, []);

  const fetchCreatorAvatars = async () => {
    try {
      const response = await fetch(`/api/creators?limit=6&random=true&seed=${encodeURIComponent(seedRef.current)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setCreators(result.creators);
      } else {
        console.error('Failed to fetch creators:', result.error);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
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
    <section className="hidden md:flex relative flex-col items-center justify-center py-32 px-4 bg-gradient-to-br from-orange-50/50 via-white to-orange-100/30">
      <div className="relative w-full max-w-6xl bg-gradient-to-br from-white/90 via-orange-50/20 to-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl px-16 py-24 flex flex-col items-center overflow-visible border border-orange-100/50">
        
        {/* Modern Dotted Background Pattern */}
        <div className="absolute inset-0 rounded-[3rem] overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 800 600">
              <defs>
                <pattern id="modern-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="12" r="1.5" fill="#FF6A1A" opacity="0.4"/>
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#modern-dots)"/>
            </svg>
          </div>
        </div>
        
        {/* Gradient Blobs */}
        <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-orange-200 via-orange-100 to-transparent rounded-full blur-3xl opacity-60 -z-10" />
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-bl from-orange-200 via-orange-100 to-transparent rounded-full blur-3xl opacity-60 -z-10" />
        
        {/* Floating Avatars */}
        {loading ? (
          // Loading skeleton
          <>
            <div className="absolute -top-10 left-16 w-20 h-20 rounded-full border-4 border-orange-200 bg-gray-200 animate-pulse z-10 shadow-lg" />
            <div className="absolute -top-10 right-16 w-20 h-20 rounded-full border-4 border-white bg-gray-200 animate-pulse z-10 shadow-lg" />
            <div className="absolute bottom-12 left-12 w-16 h-16 rounded-full border-4 border-orange-200 bg-gray-200 animate-pulse z-10 shadow-lg" />
            <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full border-4 border-orange-200 bg-gray-200 animate-pulse z-10 shadow-lg" />
            <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white bg-gray-200 animate-pulse z-10 shadow-lg" />
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white bg-gray-200 animate-pulse z-10 shadow-lg" />
          </>
        ) : creators.length > 0 ? (
          // Real creator avatars
          <>
            {creators[0] && (
              <div className="absolute -top-10 left-16 w-20 h-20 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg overflow-hidden">
                {creators[0].avatar_url ? (
                  <img 
                    src={creators[0].avatar_url} 
                    alt={creators[0].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg ${creators[0].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[0].display_name)}
                </div>
              </div>
            )}
            {creators[1] && (
              <div className="absolute -top-10 right-16 w-20 h-20 rounded-full border-4 border-white object-cover z-10 shadow-lg overflow-hidden">
                {creators[1].avatar_url ? (
                  <img 
                    src={creators[1].avatar_url} 
                    alt={creators[1].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg ${creators[1].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[1].display_name)}
                </div>
              </div>
            )}
            {creators[2] && (
              <div className="absolute bottom-12 left-12 w-16 h-16 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg overflow-hidden">
                {creators[2].avatar_url ? (
                  <img 
                    src={creators[2].avatar_url} 
                    alt={creators[2].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm ${creators[2].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[2].display_name)}
                </div>
              </div>
            )}
            {creators[3] && (
              <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg overflow-hidden">
                {creators[3].avatar_url ? (
                  <img 
                    src={creators[3].avatar_url} 
                    alt={creators[3].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm ${creators[3].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[3].display_name)}
                </div>
              </div>
            )}
            {creators[4] && (
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white object-cover z-10 shadow-lg overflow-hidden">
                {creators[4].avatar_url ? (
                  <img 
                    src={creators[4].avatar_url} 
                    alt={creators[4].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs ${creators[4].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[4].display_name)}
                </div>
              </div>
            )}
            {creators[5] && (
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white object-cover z-10 shadow-lg overflow-hidden">
                {creators[5].avatar_url ? (
                  <img 
                    src={creators[5].avatar_url} 
                    alt={creators[5].display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs ${creators[5].avatar_url ? 'hidden' : ''}`}>
                  {getInitials(creators[5].display_name)}
                </div>
              </div>
            )}
          </>
        ) : (
          // Fallback to default avatars
          <>
            <img src={fallbackAvatars[0]} className="absolute -top-10 left-16 w-20 h-20 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg" alt="Creator" />
            <img src={fallbackAvatars[1]} className="absolute -top-10 right-16 w-20 h-20 rounded-full border-4 border-white object-cover z-10 shadow-lg" alt="Creator" />
            <img src={fallbackAvatars[2]} className="absolute bottom-12 left-12 w-16 h-16 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg" alt="Creator" />
            <img src={fallbackAvatars[3]} className="absolute bottom-12 right-12 w-16 h-16 rounded-full border-4 border-orange-200 object-cover z-10 shadow-lg" alt="Creator" />
            <img src={fallbackAvatars[4]} className="absolute top-1/2 -left-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white object-cover z-10 shadow-lg" alt="Creator" />
            <img src={fallbackAvatars[5]} className="absolute top-1/2 -right-8 -translate-y-1/2 w-14 h-14 rounded-full border-4 border-white object-cover z-10 shadow-lg" alt="Creator" />
          </>
        )}
        
        {/* Main Content */}
        <div className="relative z-20 flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-extrabold text-center mb-6 text-gray-800">
            Be the First to Support Talent
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mb-16 text-xl">
            Empower people to earn from their passion. Claim your unique page and join the movement!
          </p>
          
          <form 
            className="flex w-full max-w-3xl mx-auto" 
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) {
                // Save username to sessionStorage for registration flow
                sessionStorage.setItem('selectedUsername', username.trim());
                // Redirect to choose-username page (which will then go to register)
                router.push('/choose-username');
              }
            }}
          >
            <div className="flex-1 flex items-center bg-gray-50 rounded-l-full border border-gray-200 border-r-0 px-8 py-5 text-xl">
              <span className="text-gray-500 font-semibold select-none">nisapoti.com/</span>
              <Input
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-transparent text-xl border-0 focus:ring-0 p-0 ml-2 placeholder:text-gray-400"
              />
            </div>
            <Button 
              type="submit" 
              className="px-16 py-5 rounded-r-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] hover:from-[#FF5A0A] hover:to-[#FF8A2C] text-white font-bold text-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-l-0 border-gray-200 h-full"
            >
              Claim
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}