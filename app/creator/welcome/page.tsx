'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Users, 
  Share2, 
  ShoppingBag, 
  BarChart3, 
  Gift, 
  Star, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

export default function CreatorWelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
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

  const welcomeSteps = [
    {
      icon: <Sparkles className="w-16 h-16 text-yellow-500" />,
      title: "Welcome to Nisapoti! 🎉",
      subtitle: "Your creative journey starts here",
      description: "You're now part of a community that supports creators like you. Let's explore what you can do!",
      features: [
        "Create your unique creator profile",
        "Share your story with the world",
        "Connect with supporters globally"
      ]
    },
    {
      icon: <Heart className="w-16 h-16 text-red-500" />,
      title: "Build Your Wishlist 💝",
      subtitle: "Share your dreams and goals",
      description: "Create wishlist items for things you need - from equipment to experiences, and let your community support you.",
      features: [
        "Add items with photos and descriptions",
        "Set funding goals and priorities",
        "Track progress with visual progress bars"
      ]
    },
    {
      icon: <Users className="w-16 h-16 text-blue-500" />,
      title: "Grow Your Community 👥",
      subtitle: "Connect with supporters worldwide",
      description: "Share your profile link and build a community of people who believe in your vision.",
      features: [
        "Share your unique profile link",
        "Track supporter engagement",
        "Build lasting relationships"
      ]
    },
    {
      icon: <ShoppingBag className="w-16 h-16 text-green-500" />,
      title: "Sell Digital Products 🛍️",
      subtitle: "Monetize your expertise",
      description: "Create and sell digital products like ebooks, courses, or exclusive content to your audience.",
      features: [
        "Upload and manage digital products",
        "Set custom pricing and descriptions",
        "Track sales and earnings"
      ]
    },
    {
      icon: <Share2 className="w-16 h-16 text-purple-500" />,
      title: "Referral Rewards 🎁",
      subtitle: "Earn by inviting friends",
      description: "Invite other creators and unlock amazing rewards as you grow the Nisapoti community.",
      features: [
        "Share your referral link",
        "Unlock exclusive rewards",
        "Join the creator ambassador program"
      ]
    },
    {
      icon: <BarChart3 className="w-16 h-16 text-orange-500" />,
      title: "Track Your Success 📊",
      subtitle: "Monitor your growth",
      description: "View detailed analytics of your earnings, supporters, and engagement to optimize your strategy.",
      features: [
        "Real-time earnings tracking",
        "Supporter analytics",
        "Performance insights"
      ]
    }
  ];

  const rewards = [
    {
      tier: "1 Invite",
      reward: "Early access to new features",
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      unlocked: true
    },
    {
      tier: "3 Invites", 
      reward: "Creator Spotlight feature",
      icon: <Star className="w-8 h-8 text-blue-500" />,
      unlocked: false
    },
    {
      tier: "5 Invites",
      reward: "Ambassador Badge + Priority Support",
      icon: <Trophy className="w-8 h-8 text-purple-500" />,
      unlocked: false
    },
    {
      tier: "10 Invites",
      reward: "Premium Analytics + Newsletter Feature",
      icon: <BarChart3 className="w-8 h-8 text-green-500" />,
      unlocked: false
    },
    {
      tier: "50 Referrals",
      reward: "Free Nisapoti T-shirt + Sticker",
      icon: <Gift className="w-8 h-8 text-red-500" />,
      unlocked: false
    },
    {
      tier: "100 Referrals",
      reward: "Creator Starter Kit (Ring light or tripod)",
      icon: <Target className="w-8 h-8 text-indigo-500" />,
      unlocked: false
    }
  ];

  const handleGetStarted = () => {
    router.push('/creator/dashboard');
  };

  const handleSkip = () => {
    router.push('/creator/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Nisapoti</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {welcomeSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / welcomeSteps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Welcome Step */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {welcomeSteps[currentStep].icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {welcomeSteps[currentStep].title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              {welcomeSteps[currentStep].subtitle}
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {welcomeSteps[currentStep].description}
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {welcomeSteps[currentStep].features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {welcomeSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-[#FF6A1A]' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {currentStep < welcomeSteps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Referral Rewards Preview */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Unlock Amazing Rewards 🎁
              </h2>
              <p className="text-gray-600">
                Invite friends and unlock exclusive creator rewards
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    reward.unlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {reward.icon}
                    <span className={`font-semibold text-sm ${
                      reward.unlocked ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {reward.tier}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    reward.unlocked ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {reward.reward}
                  </p>
                  {reward.unlocked && (
                    <div className="mt-2 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Unlocked!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
