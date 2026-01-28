'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Gift, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Truck,
  Award
} from 'lucide-react';

interface ReferralUser {
  id: string;
  username: string;
  email: string;
  total_referrals: number;
  successful_referrals: number;
  unlocked_rewards: number;
  last_referral: string;
  created_at: string;
}

interface RewardTier {
  id: string;
  user_id: string;
  username: string;
  tier_level: number;
  invites_required: number;
  reward_title: string;
  reward_type: string;
  status: string;
  unlocked_at: string;
  claimed_at?: string;
  shipped_at?: string;
  tracking_number?: string;
}

export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'rewards' | 'analytics'>('users');
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Fetch referral users
      const usersResponse = await fetch('/api/admin/referrals/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setReferralUsers(usersData.data);
      }

      // Fetch reward tiers
      const rewardsResponse = await fetch('/api/admin/referrals/rewards');
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewardTiers(rewardsData.data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRewardStatus = async (rewardId: string, newStatus: string, trackingNumber?: string) => {
    try {
      const response = await fetch('/api/admin/referrals/update-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId,
          status: newStatus,
          trackingNumber
        }),
      });

      if (response.ok) {
        fetchReferralData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating reward status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlocked':
        return 'text-blue-600 bg-blue-50';
      case 'claimed':
        return 'text-yellow-600 bg-yellow-50';
      case 'shipped':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unlocked':
        return <Gift className="w-4 h-4" />;
      case 'claimed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRewards = rewardTiers.filter(reward => {
    const matchesSearch = reward.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.reward_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reward.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Management</h1>
          <p className="text-gray-600">Manage referral program, track rewards, and monitor performance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Referral Users
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rewards'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reward Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Referral Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unlocked Rewards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Referral</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referralUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.total_referrals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.successful_referrals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.unlocked_rewards}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.last_referral).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-orange-600 hover:text-orange-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Reward Management</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search rewards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="unlocked">Unlocked</option>
                    <option value="claimed">Claimed</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unlocked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reward.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reward.reward_title}</div>
                        <div className="text-sm text-gray-500">{reward.invites_required} invites</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          reward.reward_type === 'physical' ? 'bg-blue-100 text-blue-800' :
                          reward.reward_type === 'digital' ? 'bg-green-100 text-green-800' :
                          reward.reward_type === 'status' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {reward.reward_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(reward.status)}`}>
                          {getStatusIcon(reward.status)}
                          <span>{reward.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reward.unlocked_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {reward.status === 'unlocked' && (
                          <button
                            onClick={() => updateRewardStatus(reward.id, 'claimed')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Mark Claimed
                          </button>
                        )}
                        {reward.status === 'claimed' && reward.reward_type === 'physical' && (
                          <button
                            onClick={() => {
                              const trackingNumber = prompt('Enter tracking number:');
                              if (trackingNumber) {
                                updateRewardStatus(reward.id, 'shipped', trackingNumber);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Ship
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{referralUsers.length}</p>
                    <p className="text-sm text-gray-600">Active Referrers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{rewardTiers.length}</p>
                    <p className="text-sm text-gray-600">Unlocked Rewards</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {rewardTiers.filter(r => r.status === 'shipped').length}
                    </p>
                    <p className="text-sm text-gray-600">Shipped Rewards</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {referralUsers.reduce((sum, user) => sum + user.successful_referrals, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Conversions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

