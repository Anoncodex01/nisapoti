'use client';

import { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Megaphone,
  Lock,
  Gift,
  MessageSquare,
  Headphones,
  Shirt,
  Star,
  BarChart3,
  Camera,
  Mic,
  Laptop
} from 'lucide-react';

interface ReferralReward {
  invites: number;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
}

export default function ReferralsPage() {
  const [referralLink, setReferralLink] = useState('');
  const [totalInvites, setTotalInvites] = useState(0);
  const [loading, setLoading] = useState(true);

  const rewards: ReferralReward[] = [
    {
      invites: 1,
      title: "Early access to new features",
      description: "Get exclusive early access to new platform features before they're released to everyone.",
      icon: Star,
      unlocked: totalInvites >= 1
    },
    {
      invites: 3,
      title: "Creator Spotlight feature",
      description: "Get featured on our homepage and social media to showcase your work to thousands of potential supporters.",
      icon: MessageSquare,
      unlocked: totalInvites >= 3
    },
    {
      invites: 5,
      title: "Ambassador Badge + Priority Support",
      description: "Get a special 'Ambassador' badge on your profile and priority customer support for faster help.",
      icon: Headphones,
      unlocked: totalInvites >= 5
    },
    {
      invites: 10,
      title: "Premium Analytics + Newsletter Feature",
      description: "Free premium analytics for 3 months + featured in our newsletter reaching 1.5M creators.",
      icon: BarChart3,
      unlocked: totalInvites >= 10
    },
    {
      invites: 50,
      title: "Free Nisapoti T-shirt + Sticker",
      description: "Get an exclusive Nisapoti branded t-shirt and sticker pack, ships worldwide.",
      icon: Shirt,
      unlocked: totalInvites >= 50
    },
    {
      invites: 100,
      title: "Creator Starter Kit",
      description: "Get a professional ring light or tripod to improve your content quality and setup.",
      icon: Camera,
      unlocked: totalInvites >= 100
    },
    {
      invites: 250,
      title: "🎤 Pro Creator Pack",
      description: "Professional microphone + lighting setup to take your content to the next level.",
      icon: Mic,
      unlocked: totalInvites >= 250
    },
    {
      invites: 500,
      title: "Big Creator Reward",
      description: "Laptop, Camera, or equivalent high-value creator tools to supercharge your content creation.",
      icon: Laptop,
      unlocked: totalInvites >= 500
    }
  ];

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Get user's referral data and link
      const response = await fetch('/api/referrals/link');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralLink(data.data.referralLink);
          setTotalInvites(data.data.stats.total_invites || 0);
        } else {
          throw new Error('Failed to get referral data');
        }
      } else {
        // Fallback: try to get user info and generate link manually
        const userProfile = await fetch('/api/auth/me');
        if (userProfile.ok) {
          const profileData = await userProfile.json();
          const username = profileData.username || profileData.display_name || 'user';
          setReferralLink(`https://nisapoti.com/ref/${username}`);
        } else {
          // Final fallback
          setReferralLink('https://nisapoti.com/ref/alvinurio');
        }
        setTotalInvites(0);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      // Fallback to mock data
      setReferralLink('https://nisapoti.com/ref/alvinurio');
      setTotalInvites(0);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      // Show success feedback
      const button = document.querySelector('.copy-btn');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Nisapoti!',
          text: 'Check out this amazing creator platform',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard();
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
          <p className="text-sm sm:text-base text-gray-600">Invite creator friends and unlock exclusive rewards</p>
        </div>

        {/* Referral Link Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center mb-4 sm:mb-6">
            <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mr-3 sm:mr-4 flex-shrink-0 mt-1 sm:mt-0" />
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                Invite Creator friends and unlock exclusive rewards.
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Looking for ideas to promote? See our{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                  wall of love
                </a>.
              </p>
            </div>
          </div>
          
          {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4 border">
              <p className="text-orange-600 font-mono text-sm sm:text-base lg:text-lg break-all">
                {referralLink}
              </p>
            </div>
            <div className="flex space-x-3 sm:space-x-4 sm:flex-shrink-0">
              <button
                onClick={copyToClipboard}
                className="copy-btn flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Copy
              </button>
              <button
                onClick={shareReferral}
                className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Your Rewards</h3>
          
          <div className="space-y-4 sm:space-y-6">
            {rewards.map((reward, index) => (
              <div key={reward.invites} className="flex items-start space-x-3 sm:space-x-4">
                {/* Progress Line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
                    reward.unlocked 
                      ? 'bg-orange-500 border-orange-500' 
                      : 'bg-white border-gray-300'
                  }`}></div>
                  {index < rewards.length - 1 && (
                    <div className={`w-0.5 h-12 sm:h-16 ${
                      reward.unlocked ? 'bg-orange-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
                
                {/* Reward Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <reward.icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 ${
                        reward.unlocked ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-semibold text-sm sm:text-base leading-tight ${
                          reward.unlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {reward.invites} invite{reward.invites > 1 ? 's' : ''}: {reward.title}
                        </h4>
                        <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                          reward.unlocked ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {reward.description}
                        </p>
                      </div>
                    </div>
                    {!reward.unlocked && (
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress Summary */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-orange-800">Progress</span>
              <span className="text-xs sm:text-sm text-orange-600">{totalInvites} / 500 invites</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(totalInvites / 500) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-4 sm:mt-6 flex items-start space-x-2 text-xs sm:text-sm text-gray-500">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">i</div>
            <p className="leading-relaxed">Team will review the quality of referrals before unlocking the rewards.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
