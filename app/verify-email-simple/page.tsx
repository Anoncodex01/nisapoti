'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function VerifyEmailSimplePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const userEmail = sessionStorage.getItem('userEmail');
    if (userEmail) {
      setEmail(userEmail);
    }

    // Check if user is already verified
    if (user && user.email_confirmed_at) {
      console.log('User email already verified');
      router.push('/profile');
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Use custom verification system
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: 'email' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Logo Section */}
      <div className="w-full flex flex-col items-center mt-10 mb-6">
        <Link href="/">
          <Image 
            src="/assets/images/logos/logo.png" 
            alt="Nisapoti Logo" 
            width={40}
            height={40}
            className="h-10 w-auto mb-2 object-contain"
            onError={(e) => {
              console.log('Logo failed to load, trying fallback');
              e.currentTarget.src = '/logo.png';
            }}
          />
        </Link>
      </div>

      {/* Verification Message */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-extrabold mb-4 text-gray-800">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We sent a verification link to <strong>{email}</strong>
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-orange-700 mt-2 space-y-1">
              <li>1. Check your email inbox</li>
              <li>2. Click the verification link</li>
              <li>3. You&apos;ll be redirected back here automatically</li>
            </ol>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-3 px-4 border border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>

            <Link 
              href="/login" 
              className="block w-full py-3 px-4 text-center text-gray-500 hover:text-orange-500 transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
