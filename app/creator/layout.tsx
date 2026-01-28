'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  User, 
  Eye, 
  Compass, 
  Heart, 
  Users, 
  Wallet, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  ShoppingBag,
  Share2
} from 'lucide-react';

interface CreatorLayoutProps {
  children: React.ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication and fetch user profile
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const userData = await authResponse.json();
          setUser(userData);
          
          // Fetch user profile to get username for public profile link
          const profileResponse = await fetch(`/api/profile?user_id=${userData.id}`);
          if (profileResponse.ok) {
            const result = await profileResponse.json();
            const profileData = result.data || result;
            setUserProfile(profileData);
          }
        } else {
          // User is not authenticated, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking auth or fetching profile:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const copyProfileLink = async () => {
    if (userProfile?.username) {
      const profileUrl = `${window.location.origin}/${userProfile.username}`;
      try {
        await navigator.clipboard.writeText(profileUrl);
        // Toast notification will be handled by the component using this function
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const navigation = [
    { name: 'Home', href: '/creator/dashboard', icon: BarChart3 },
    { name: 'Profile', href: '/creator/profile', icon: User },
    { 
      name: 'View page', 
      href: userProfile?.username ? `/${userProfile.username}` : '#', 
      icon: Eye,
      external: true,
      disabled: !userProfile?.username
    },
    { name: 'Explore', href: '/creator/explore', icon: Compass },
    { name: 'Wishlist', href: '/creator/wishlist', icon: Heart },
  ];

  const monetizeNavigation = [
    { name: 'Shop', href: '/creator/shop', icon: ShoppingBag },
    { name: 'Referrals', href: '/creator/referrals', icon: Share2 },
    { name: 'Supporters', href: '/creator/supporters', icon: Users },
    { name: 'Withdraw', href: '/creator/withdraw', icon: Wallet },
  ];

  const isActive = (href: string) => pathname === href;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/creator/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-gray-900">Nisapoti</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} lg:rounded-r-2xl`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-gray-100">
            <Link href="/creator/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">N</span>
              </div>
                              {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nisapoti</h1>
                  </div>
                )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const linkProps = item.external 
                ? { 
                    href: item.href, 
                    target: '_blank', 
                    rel: 'noopener noreferrer' 
                  }
                : { href: item.href };
              
              const isDisabled = item.disabled;
              
              return (
                <div key={item.name} className="relative group">
                  <Link
                    {...linkProps}
                    className={`flex items-center px-3 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                      isDisabled 
                        ? 'text-gray-400 cursor-not-allowed opacity-50'
                        : isActive(item.href)
                          ? 'bg-gradient-to-r from-[#FF6A1A]/10 to-[#FF9A3C]/10 text-[#FF6A1A] border border-[#FF6A1A]/20'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        setSidebarOpen(false);
                      }
                    }}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                    {item.external && !sidebarCollapsed && !isDisabled && (
                      <svg className="w-4 h-4 ml-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </Link>
                  
                  {/* Copy link button for View page */}
                  {item.name === 'View page' && userProfile?.username && !sidebarCollapsed && (
                    <button
                      onClick={copyProfileLink}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-100"
                      title="Copy profile link"
                    >
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

                          {/* Separator */}
              <div className="my-6 border-t border-gray-100"></div>

                          {/* Monetize Section */}
              {!sidebarCollapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">MONETIZE</h3>
                </div>
              )}
            
            {monetizeNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-3 text-base font-medium rounded-xl transition-all duration-200 group ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#FF6A1A]/10 to-[#FF9A3C]/10 text-[#FF6A1A] border border-[#FF6A1A]/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Separator */}
          <div className="border-t border-gray-100"></div>

          {/* Logout */}
          <div className="p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-100"></div>

          {/* Collapse Menu */}
          <div className="p-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center w-full px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
              title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              ) : (
                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              )}
              {!sidebarCollapsed && <span className="ml-3">Collapse Menu</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area - completely separate from sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Mobile header spacer */}
        <div className="lg:hidden h-16"></div>
        
        {/* Main content */}
        <main className="min-h-screen">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
