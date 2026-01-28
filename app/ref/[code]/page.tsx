'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  Users, 
  DollarSign, 
  Star,
  ArrowRight,
  Gift,
  TrendingUp
} from 'lucide-react';

interface ReferrerInfo {
  username: string;
  email: string;
}

export default function ReferralLandingPage() {
  const params = useParams();
  const referralCode = params.code as string;
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track referral when page loads
    const trackReferral = async () => {
      try {
        // Avoid duplicate tracking within 24 hours for the same code
        const guardKey = `referralTracked:${referralCode}`;
        const lastTracked = localStorage.getItem(guardKey);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (!lastTracked || now - Number(lastTracked) > oneDay) {
          const response = await fetch('/api/referrals/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referralCode,
              ipAddress: '', // Will be handled server-side
              userAgent: navigator.userAgent,
              referrerUrl: document.referrer
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Referral tracked:', data);
            // Guard mark
            localStorage.setItem(guardKey, String(now));
            // Store referral info in localStorage for later use
            localStorage.setItem('referralCode', referralCode);
            localStorage.setItem('referrerInfo', JSON.stringify(data.data.referrer));
            setReferrerInfo(data.data.referrer);
          }
        } else {
          // Already tracked recently, but still ensure we have referrer info from storage
          const stored = localStorage.getItem('referrerInfo');
          if (stored) {
            try { setReferrerInfo(JSON.parse(stored)); } catch {}
          }
          localStorage.setItem('referralCode', referralCode);
        }
      } catch (error) {
        console.error('Error tracking referral:', error);
      }
      finally {
        setLoading(false);
      }
    };

    if (referralCode) {
      trackReferral();
    }
  }, [referralCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Nisapoti!
          </h1>
          {referrerInfo && (
            <p className="text-xl text-gray-600 mb-8">
              You were invited by <span className="font-semibold text-orange-600">{referrerInfo.username}</span>
            </p>
          )}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Support Creators</h3>
            <p className="text-gray-600">
              Discover amazing creators and support them with tips, purchases, and subscriptions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn Rewards</h3>
            <p className="text-gray-600">
              Get rewarded for supporting creators and referring friends to the platform.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Exclusive Content</h3>
            <p className="text-gray-600">
              Access exclusive content, early releases, and special perks from your favorite creators.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of creators and supporters on Nisapoti
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/choose-username"
              onClick={() => {
                // Ensure referral code is persisted for registration
                if (referralCode) localStorage.setItem('referralCode', referralCode);
              }}
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
            >
              Create Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">10K+</div>
            <div className="text-gray-600">Active Creators</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">$2M+</div>
            <div className="text-gray-600">Paid to Creators</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">50K+</div>
            <div className="text-gray-600">Happy Supporters</div>
          </div>
        </div>

        {/* Referral Info */}
        {referrerInfo && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Thanks for joining through {referrerInfo.username}&apos;s referral!
            </h3>
            <p className="text-orange-100 mb-6">
              You&apos;ll both earn rewards when you start supporting creators on the platform.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Start earning rewards today!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
