'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Share2,
  Clock,
  BookOpen,
  Copy,
  Twitter,
  Facebook,
  ChevronRight,
  TrendingUp,
  Users,
  ShoppingCart,
  Heart,
  DollarSign,
  Package,
  Gift,
  BarChart3,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Target,
  Wallet,
  TrendingDown,
  Activity,
  MoreVertical
} from 'lucide-react';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import { useToast } from '@/hooks/use-toast';


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
  // Additional data for comprehensive dashboard
  shop: {
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
    recentProducts: Array<{
      id: string;
      title: string;
      price: number;
      sales: number;
      status: string;
    }>;
  };
  wishlist: {
    totalItems: number;
    totalFunded: number;
    totalValue: number;
    recentItems: Array<{
      id: string;
      name: string;
      price: number;
      amount_funded: number;
      is_priority: boolean;
    }>;
  };
  withdrawals: {
    availableBalance: number;
    lockedFunds: number;
    totalWithdrawn: number;
    pendingWithdrawals: number;
  };
  // Recent activity data
  recentActivity: Array<{
    type: 'supporter' | 'order' | 'wishlist';
    id?: string;
    name?: string;
    amount: number;
    created_at: string;
    product_title?: string;
    product_id?: string;
    order_id?: string;
    wishlist_name?: string;
    wishlist_id?: string;
  }>;
  // Period-specific breakdown data
  periodBreakdown: {
    supporters: {
      count: number;
      amount: number;
    };
    wishlist: {
      count: number;
      amount: number;
    };
    shop: {
      count: number;
      amount: number;
    };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedEarningsPeriod, setSelectedEarningsPeriod] = useState('30 days');
  const [selectedSupportersPeriod, setSelectedSupportersPeriod] = useState('30 days');
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // User is not authenticated, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch payment info
  useEffect(() => {
    if (user?.id) {
      const fetchPaymentInfo = async () => {
        try {
          setPaymentInfoLoading(true);
          const response = await fetch(`/api/payment-info/verify?creator_id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setPaymentInfo(data);
          }
        } catch (error) {
          console.error('Error fetching payment info:', error);
        } finally {
          setPaymentInfoLoading(false);
        }
      };
      fetchPaymentInfo();
    }
  }, [user?.id]);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async (earningsPeriod: string, supportersPeriod: string, isPeriodChange: boolean = false) => {
    try {
      if (isPeriodChange) {
        setPeriodLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const userId = user.id;
      sessionStorage.setItem('userId', userId);

      // Fetch all data in parallel
      const [
        earningsResponse,
        supportersResponse,
        shopResponse,
        wishlistResponse,
        withdrawalsResponse,
        activityResponse,
        breakdownResponse
      ] = await Promise.all([
        fetch(`/api/dashboard/stats?userId=${userId}&period=${earningsPeriod}`),
        fetch(`/api/dashboard/stats?userId=${userId}&period=${supportersPeriod}`),
        fetch(`/api/shop/products?creator_id=${userId}`),
        fetch(`/api/wishlist?user_id=${userId}`),
        fetch(`/api/withdrawals/balance?creator_id=${userId}`),
        fetch(`/api/dashboard/activity?userId=${userId}&limit=20`),
        fetch(`/api/dashboard/breakdown?userId=${userId}&period=${earningsPeriod}`)
      ]);

      const [
        earningsData,
        supportersData,
        shopData,
        wishlistData,
        withdrawalsData,
        activityData,
        breakdownData
      ] = await Promise.all([
        earningsResponse.json(),
        supportersResponse.json(),
        shopResponse.json(),
        wishlistResponse.json(),
        withdrawalsResponse.json(),
        activityResponse.json(),
        breakdownResponse.json()
      ]);

      // Process shop data
      const shopProducts = shopData.products || [];
      const shopStats = {
        totalProducts: shopProducts.length,
        totalSales: shopProducts.reduce((sum: number, product: any) => sum + (product.total_sales || 0), 0),
        totalRevenue: shopProducts.reduce((sum: number, product: any) => sum + ((product.total_sales || 0) * product.price), 0),
        recentProducts: shopProducts.slice(0, 5).map((product: any) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          sales: product.total_sales || 0,
          status: product.status || 'active'
        }))
      };

      // Process wishlist data
      const wishlistItems = wishlistData.data || [];
      const wishlistStats = {
        totalItems: wishlistItems.length,
        totalFunded: wishlistItems.reduce((sum: number, item: any) => sum + (item.amount_funded || 0), 0),
        totalValue: wishlistItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0),
        recentItems: wishlistItems.slice(0, 5).map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          amount_funded: item.amount_funded || 0,
          is_priority: item.is_priority
        }))
      };

      // Process withdrawals data
      const withdrawalStats = {
        availableBalance: withdrawalsData.available_balance || 0,
        lockedFunds: withdrawalsData.locked_funds || 0,
        totalWithdrawn: withdrawalsData.total_withdrawals || 0,
        pendingWithdrawals: 0
      };

      setDashboardData({
        profile: earningsData.data.profile,
        earnings: earningsData.data.earnings,
        supporters: supportersData.data.supporters,
        pageViews: earningsData.data.pageViews,
        shop: shopStats,
        wishlist: wishlistStats,
        withdrawals: withdrawalStats,
        recentActivity: activityData.activities || [],
        periodBreakdown: breakdownData.breakdown || {
          supporters: { count: 0, amount: 0 },
          wishlist: { count: 0, amount: 0 },
          shop: { count: 0, amount: 0 }
        }
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      if (isPeriodChange) {
        setPeriodLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedOrderId(null);
  };

  // Get current data based on selected period
  const currentEarningsData = dashboardData?.earnings?.data || [];
  const currentSupportersData = dashboardData?.supporters?.data || [];

  // Prepare chart data for Recharts
  const earningsChartData = currentEarningsData.length > 0 
    ? currentEarningsData.map((item, index) => ({
        day: String(item.day || `Day ${index + 1}`),
        value: parseFloat(String(item.value)) || 0
      }))
    : Array.from({length: 7}, (_, i) => ({
        day: `Day ${i + 1}`,
        value: (dashboardData?.earnings?.total || 195000) / 7 * (0.8 + Math.random() * 0.4)
      }));

  const supportersChartData = currentSupportersData.length > 0
    ? currentSupportersData.map((item, index) => ({
        day: String(item.day || `Day ${index + 1}`),
        value: parseFloat(String(item.value)) || 0
      }))
    : Array.from({length: 30}, (_, i) => ({
        day: `Day ${i + 1}`,
        value: Math.floor((dashboardData?.supporters?.total || 3) * (i / 29) + Math.random() * 0.5)
      }));

  // Custom tooltip components
  const EarningsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded bg-gray-800 p-2 shadow-lg">
          <p className="text-white text-sm">Earnings</p>
          <p className="font-bold text-white">Tzs {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const SupportersTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded bg-gray-800 p-2 shadow-lg">
          <p className="text-white text-sm">Supporters</p>
          <p className="font-bold text-white">{Math.round(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    elements: { point: { radius: 0 } },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false }, beginAtZero: true },
    },
  } as const;

  const learnMoreLinks = [
    "Membership 101: Best Practices",
    "How to choose your business model", 
    "How to talk about BMAC to your audience"
  ];

  useEffect(() => {
    // Only fetch data when user is authenticated
    if (user && !authLoading) {
      const isInitialLoad = !dashboardData;
      fetchDashboardData(selectedEarningsPeriod, selectedSupportersPeriod, !isInitialLoad);
    }
  }, [user, authLoading, selectedEarningsPeriod, selectedSupportersPeriod]);

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

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#FF6A1A] overflow-hidden flex-shrink-0">
              <img 
                  src={dashboardData?.profile.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"} 
                alt={dashboardData?.profile.display_name || "User"} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                Hi, {dashboardData?.profile.display_name || "User"}
              </h1>
                <p className="text-base text-gray-600 truncate">
                nisapoti.com/{dashboardData?.profile.username || "user"}
              </p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
          <button 
            onClick={async () => {
              const url = `${window.location.origin}/${dashboardData?.profile.username || "user"}`;
              try {
                await navigator.clipboard.writeText(url);
                toast({
                  title: "Link copied!",
                  description: "Your page URL has been copied to clipboard.",
                });
              } catch (error) {
                toast({
                  title: "Failed to copy",
                  description: "Please try again.",
                  variant: "destructive",
                });
              }
            }}
              className="bg-gradient-to-r from-[#FF6A1A] to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-[#FF6A1A] transition-all duration-300 flex items-center space-x-2 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Share2 className="w-5 h-5" />
            <span>Share page</span>
          </button>
          </div>
        </div>
        </div>

        {/* Payment Info Verification Banner */}
        {!paymentInfoLoading && (!paymentInfo?.hasPaymentInfo || !paymentInfo?.paymentInfo?.is_verified) && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start sm:items-center space-x-3 flex-1">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {paymentInfo?.hasPaymentInfo ? 'Verify Your Payment Information' : 'Add Your Payment Information'}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {paymentInfo?.hasPaymentInfo 
                      ? 'Complete verification to enable withdrawals'
                      : 'Add your mobile money account to receive payouts securely'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/creator/payment-info')}
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {paymentInfo?.hasPaymentInfo ? 'Verify Now' : 'Add Now'}
              </button>
            </div>
          </div>
        )}

        {/* Earnings Overview */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Earnings</h2>
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedEarningsPeriod}
                onChange={(e) => setSelectedEarningsPeriod(e.target.value)}
                disabled={periodLoading}
                className={`w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6A1A] focus:border-transparent ${
                  periodLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="7 days">7 days</option>
                <option value="30 days">30 days</option>
                <option value="All time">All time</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {periodLoading && (
                <div className="absolute inset-y-0 right-8 flex items-center">
                  <div className="w-3 h-3 border border-[#FF6A1A] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4 sm:mb-6">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 break-words">
              Tzs {typeof dashboardData?.earnings.total === 'string' ? parseFloat(dashboardData.earnings.total).toLocaleString() : (dashboardData?.earnings.total || 0).toLocaleString()}
            </p>
          </div>

          {/* Earnings Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <div className="w-4 h-4 bg-yellow-400 rounded flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Supporters</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {dashboardData?.periodBreakdown?.supporters?.count?.toLocaleString() || '0'}
                </p>
              </div>
          </div>
            
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-pink-50 rounded-lg">
              <div className="w-4 h-4 bg-pink-400 rounded flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Wishlist</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Tzs {dashboardData?.periodBreakdown?.wishlist?.amount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="w-4 h-4 bg-blue-400 rounded flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Shop</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Tzs {dashboardData?.periodBreakdown?.shop?.amount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
          </div>
          
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 6).map((activity, index) => (
                <div key={`${activity.type}-${activity.id || index}`} className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                  {/* Orange accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600"></div>
                  
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Activity Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {activity.type === 'supporter' && <Users className="w-5 h-5 text-orange-600" />}
                      {activity.type === 'order' && <ShoppingCart className="w-5 h-5 text-orange-600" />}
                      {activity.type === 'wishlist' && <Heart className="w-5 h-5 text-orange-600" />}
                    </div>
                    
                    {/* Activity Details - Clickable for orders */}
                    <div 
                      className={`min-w-0 flex-1 ${activity.type === 'order' ? 'cursor-pointer' : ''}`}
                      onClick={() => activity.type === 'order' && activity.order_id && handleOrderClick(activity.order_id!)}
                    >
                      <div className="mb-1">
                        <h4 className="font-semibold text-gray-900 truncate text-sm">
                          {activity.type === 'supporter' && `${activity.name} supported you`}
                          {activity.type === 'order' && `${activity.product_title}`}
                          {activity.type === 'wishlist' && `${activity.wishlist_name}`}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {activity.type === 'supporter' && 'Supporter contribution'}
                          {activity.type === 'order' && 'Shop purchase - Click to view details'}
                          {activity.type === 'wishlist' && 'Wishlist contribution'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Amount and Actions */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">
                          Tzs {activity.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.created_at && (() => {
                            const date = new Date(activity.created_at);
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          })()}
                        </p>
                      </div>
                      
                      {/* 3-dots menu for orders */}
                      {activity.type === 'order' && activity.order_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(activity.order_id!);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h4>
              <p className="text-gray-600 mb-4">Once you start receiving support, sales, or wishlist contributions, they'll appear here. This includes both recent and historical activity.</p>
              <div className="flex space-x-4 justify-center">
            <button 
                  onClick={() => window.location.href = '/creator/shop'}
                  className="bg-[#FF6A1A] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Add Product
            </button>
            <button 
                  onClick={() => window.location.href = '/creator/wishlist'}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Add Wishlist Item
            </button>
          </div>
        </div>
          )}
          
          {/* View All Activity Button */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => window.location.href = '/creator/supporters'}
                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium py-2"
              >
                View All Activity →
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid - Hidden on mobile, visible on tablet and desktop */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Supporters Card - Hidden */}
          {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.supporters.total?.toLocaleString() || '0'}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Supporters</h3>
              <p className="text-sm text-gray-500 mb-4">Total supporters</p>
                <button
                onClick={() => window.location.href = '/creator/supporters'}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-200"
              >
                <span>View all</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div> */}

          {/* Products Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.shop.totalProducts || '0'}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Products</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">In your shop</p>
              <button 
                onClick={() => window.location.href = '/creator/shop'}
                className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-200"
              >
                <span>Manage shop</span>
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Wishlist Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {dashboardData?.wishlist.totalItems || '0'}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Wishlist</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Items on your list</p>
              <button 
                onClick={() => window.location.href = '/creator/wishlist'}
                className="text-pink-600 hover:text-pink-700 text-xs sm:text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-200"
              >
                <span>Manage wishlist</span>
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Available Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 break-words">
                Tzs {dashboardData?.withdrawals.availableBalance?.toLocaleString() || '0'}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Available</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Ready to withdraw</p>
              <button 
                onClick={() => window.location.href = '/creator/withdraw'}
                className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform duration-200"
              >
                <span>Withdraw funds</span>
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />
    </div>
  );

}
