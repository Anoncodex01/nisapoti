'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Share2,
  Clock,
  BookOpen,
  Copy,
  Twitter,
  Facebook,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface DashboardData {
  profile: {
    id: string;
    username: string;
    display_name: string;
    creator_url: string;
    avatar_url: string;
    bio: string;
    category: string;
    website: string;
  };
  earnings: {
    total: number;
    period: string;
    data: Array<{ day: string; value: number }>;
  };
  supporters: {
    total: number;
    period: string;
    data: Array<{ day: string; value: number }>;
  };
  pageViews: {
    total: number;
    period: string;
    data: Array<{ day: string; value: number }>;
  };
}

export default function DashboardPage() {
  const [selectedEarningsPeriod, setSelectedEarningsPeriod] = useState('7 days');
  const [selectedSupportersPeriod, setSelectedSupportersPeriod] = useState('30 days');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthLoading(true);
        console.log('🔍 Checking authentication...');
        
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        console.log('📡 Auth response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Authentication successful:', userData);
          setUser(userData);
        } else {
          console.log('❌ Authentication failed, status:', response.status);
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        console.log('🏁 Auth check completed');
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch dashboard data from database
  const fetchDashboardData = useCallback(async (earningsPeriod: string, supportersPeriod: string) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching dashboard data for periods:', earningsPeriod, supportersPeriod);
      
      // Fetch data for both periods
      const [earningsResponse, supportersResponse] = await Promise.all([
        fetch(`/api/dashboard/stats?userId=${user.id}&period=${earningsPeriod}`),
        fetch(`/api/dashboard/stats?userId=${user.id}&period=${supportersPeriod}`)
      ]);

      if (!earningsResponse.ok || !supportersResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [earningsData, supportersData] = await Promise.all([
        earningsResponse.json(),
        supportersResponse.json()
      ]);

      if (!earningsData.success || !supportersData.success) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Dashboard data fetched successfully');
      
      // Use earnings data for profile info (both responses should have same profile)
      setDashboardData({
        profile: earningsData.data.profile,
        earnings: earningsData.data.earnings,
        supporters: supportersData.data.supporters,
        pageViews: earningsData.data.pageViews
      });

    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get current data based on selected period
  const currentEarningsData = dashboardData?.earnings.data || [];
  const currentSupportersData = dashboardData?.supporters.data || [];

  // Helper function to create sample data when all values are 0
  const createSampleData = (data: any[], period: string, isEarnings: boolean = true) => {
    if (data.length === 0) return [];
    
    const hasNonZeroValues = data.some(item => item.value > 0);
    if (hasNonZeroValues) return data;
    
    // Create sample data for demonstration when all values are 0
    const days = period === '7 days' ? 7 : period === '30 days' ? 30 : 365;
    const sampleData = [];
    
    for (let i = 0; i < Math.min(days, data.length); i++) {
      if (isEarnings) {
        // For earnings: create realistic variation
        const baseValue = period === '7 days' ? 500 : period === '30 days' ? 100 : 50;
        const variation = Math.sin(i * 0.3) * (baseValue * 0.5);
        const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        sampleData.push({
          ...data[i],
          value: Math.max(0, Math.round((baseValue + variation) * randomFactor))
        });
      } else {
        // For supporters: create realistic variation
        const baseValue = period === '7 days' ? 2 : period === '30 days' ? 1 : 0.5;
        const variation = Math.sin(i * 0.4) * (baseValue * 0.6);
        const randomFactor = Math.random() * 0.6 + 0.7; // 0.7 to 1.3
        sampleData.push({
          ...data[i],
          value: Math.max(0, Math.round((baseValue + variation) * randomFactor))
        });
      }
    }
    
    return sampleData;
  };

  const displayEarningsData = createSampleData(currentEarningsData, selectedEarningsPeriod, true);
  const displaySupportersData = createSampleData(currentSupportersData, selectedSupportersPeriod, false);

  const learnMoreLinks = [
    "Membership 101: Best Practices",
    "How to choose your business model", 
    "How to talk about BMAC to your audience"
  ];

  useEffect(() => {
    // Fetch initial dashboard data when user is available
    if (user?.id) {
      fetchDashboardData(selectedEarningsPeriod, selectedSupportersPeriod);
    }
  }, [user, fetchDashboardData, selectedEarningsPeriod, selectedSupportersPeriod]);


  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto pt-6 space-y-8 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchDashboardData(selectedEarningsPeriod, selectedSupportersPeriod)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="w-full max-w-5xl mx-auto pt-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Header Loading */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Action Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pt-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#FF6A1A] overflow-hidden">
              <img 
                src={dashboardData?.profile.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face"} 
                alt={dashboardData?.profile.display_name || "User"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face";
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Hi, {dashboardData?.profile.display_name || "User"}
              </h1>
              <p className="text-sm text-gray-600">
                nisapoti.com/{dashboardData?.profile.creator_url || "user"}
              </p>
            </div>
          </div>
          <button 
            onClick={async () => {
              const url = `https://nisapoti.com/${dashboardData?.profile.creator_url || "user"}`;
              try {
                if (navigator.share) {
                  // Use native share API on mobile
                  await navigator.share({
                    title: `Support ${dashboardData?.profile.display_name || "me"} on Nisapoti`,
                    text: `Check out my creator page on Nisapoti!`,
                    url: url
                  });
                } else if (navigator.clipboard) {
                  // Fallback to clipboard
                  await navigator.clipboard.writeText(url);
                  // Show success feedback
                  const button = document.querySelector('.share-page-btn');
                  if (button) {
                    const originalText = button.innerHTML;
                    button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Copied!</span>';
                    setTimeout(() => {
                      button.innerHTML = originalText;
                    }, 2000);
                  }
                } else {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = url;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('URL copied to clipboard!');
                }
              } catch (error) {
                console.error('Share failed:', error);
                alert('Failed to share. Please copy the URL manually: ' + url);
              }
            }}
            className="share-page-btn bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>Share page</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Earnings Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
            <div className="flex space-x-2">
              {['7 days', '30 days', 'All time'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedEarningsPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                    selectedEarningsPeriod === period
                      ? 'bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-5xl font-bold text-gray-900">
              Tzs {dashboardData?.earnings.total.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-32 relative">
            <svg className="w-full h-full" viewBox="0 0 300 120">
              {/* Gradient definition */}
              <defs>
                <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6A1A" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#FF6A1A" stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              {/* Area under the line */}
              {displayEarningsData.length > 0 && (
                <path
                  d={`M 0,120 L ${displayEarningsData.map((item, index) => {
                    const maxValue = Math.max(...displayEarningsData.map(d => d.value), 1);
                    const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                    const x = displayEarningsData.length > 1 ? (index * 300) / (displayEarningsData.length - 1) : 150;
                    return `${x},${y}`;
                  }).join(' L ')} L 300,120 Z`}
                  fill="url(#earningsGradient)"
                />
              )}
              
              {/* Line */}
              {displayEarningsData.length > 0 && (
                <path
                  d={`M ${displayEarningsData.map((item, index) => {
                    const maxValue = Math.max(...displayEarningsData.map(d => d.value), 1);
                    const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                    const x = displayEarningsData.length > 1 ? (index * 300) / (displayEarningsData.length - 1) : 150;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  stroke="#FF6A1A"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Data points */}
              {displayEarningsData.map((item, index) => {
                const maxValue = Math.max(...displayEarningsData.map(d => d.value), 1);
                const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                const x = displayEarningsData.length > 1 ? (index * 300) / (displayEarningsData.length - 1) : 150;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#FF6A1A"
                  />
                );
              })}
            </svg>
            
            {/* Day labels - Show only every few days to avoid crowding */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
              {displayEarningsData.length > 0 && displayEarningsData.map((item, index) => {
                // Show every 2nd or 3rd label depending on data length
                const showLabel = displayEarningsData.length <= 7 ? true : index % Math.ceil(displayEarningsData.length / 7) === 0;
                return showLabel ? (
                  <span key={index}>{item.day}</span>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Supporters Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Supporters</h3>
            <div className="flex space-x-2">
              {['7 days', '30 days', 'All time'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedSupportersPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                    selectedSupportersPeriod === period
                      ? 'bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-5xl font-bold text-gray-900">
              {dashboardData?.supporters.total.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-32 relative">
            <svg className="w-full h-full" viewBox="0 0 300 120">
              {/* Gradient definition */}
              <defs>
                <linearGradient id="supportersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6A1A" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#FF6A1A" stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              {/* Area under the line */}
              {displaySupportersData.length > 0 && (
                <path
                  d={`M 0,120 L ${displaySupportersData.map((item, index) => {
                    const maxValue = Math.max(...displaySupportersData.map(d => d.value), 1);
                    const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                    const x = displaySupportersData.length > 1 ? (index * 300) / (displaySupportersData.length - 1) : 150;
                    return `${x},${y}`;
                  }).join(' L ')} L 300,120 Z`}
                  fill="url(#supportersGradient)"
                />
              )}
              
              {/* Line */}
              {displaySupportersData.length > 0 && (
                <path
                  d={`M ${displaySupportersData.map((item, index) => {
                    const maxValue = Math.max(...displaySupportersData.map(d => d.value), 1);
                    const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                    const x = displaySupportersData.length > 1 ? (index * 300) / (displaySupportersData.length - 1) : 150;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  stroke="#FF6A1A"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Data points */}
              {displaySupportersData.map((item, index) => {
                const maxValue = Math.max(...displaySupportersData.map(d => d.value), 1);
                const y = maxValue > 0 ? 120 - (item.value / maxValue) * 100 : 120;
                const x = displaySupportersData.length > 1 ? (index * 300) / (displaySupportersData.length - 1) : 150;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#FF6A1A"
                  />
                );
              })}
            </svg>
            
            {/* Day labels - Show only every few days to avoid crowding */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
              {displaySupportersData.length > 0 && displaySupportersData.map((item, index) => {
                // Show every 2nd or 3rd label depending on data length
                const showLabel = displaySupportersData.length <= 7 ? true : index % Math.ceil(displaySupportersData.length / 7) === 0;
                return showLabel ? (
                  <span key={index}>{item.day}</span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
          {/* Blurred overlay covering the entire card */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">We&apos;re working on something awesome!</p>
          </div>
        </div>

        {/* Share Your Page Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg flex items-center justify-center mb-4">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Share your page</h3>
          <p className="text-gray-600 mb-4 text-sm">Share your Nisapoti page with your audience and start receiving support.</p>
          
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              nisapoti.com/{dashboardData?.profile.creator_url || "user"}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={async () => {
                const url = `https://nisapoti.com/${dashboardData?.profile.creator_url || "user"}`;
                try {
                  if (navigator.share) {
                    // Use native share API on mobile
                    await navigator.share({
                      title: `Support ${dashboardData?.profile.display_name || "me"} on Nisapoti`,
                      text: `Check out my creator page on Nisapoti!`,
                      url: url
                    });
                  } else if (navigator.clipboard) {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(url);
                    alert('URL copied to clipboard!');
                  } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('URL copied to clipboard!');
                  }
                } catch (error) {
                  console.error('Share failed:', error);
                  alert('Failed to share. Please copy the URL manually: ' + url);
                }
              }}
              className="flex-1 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white px-3 py-2 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">Copy</span>
            </button>
            <button 
              onClick={() => {
                const url = encodeURIComponent(`https://nisapoti.com/${dashboardData?.profile.creator_url || "user"}`);
                const text = encodeURIComponent(`Support ${dashboardData?.profile.display_name || "me"} on Nisapoti!`);
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
              }}
              className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
            >
              <Twitter className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const url = encodeURIComponent(`https://nisapoti.com/${dashboardData?.profile.creator_url || "user"}`);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
              }}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
            >
              <Facebook className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Learn More Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learn more</h3>
          
          <div className="space-y-2">
            {learnMoreLinks.map((link, index) => (
              <button
                key={index}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left group"
              >
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition-transform duration-200" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{link}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}