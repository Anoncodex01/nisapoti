'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verificationType, setVerificationType] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check verification type on component mount and send initial code
  useEffect(() => {
    const resetEmail = sessionStorage.getItem('resetEmail');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (resetEmail) {
      setVerificationType('reset');
      setEmail(resetEmail);
    } else if (userEmail) {
      setVerificationType('email');
      setEmail(userEmail);
    } else {
      setVerificationType('email');
    }

    // Check if user is already verified (from our custom API)
    if (user && user.email_confirmed_at) {
      console.log('User email already verified via custom API');
      // Redirect to profile completion
      router.push('/profile');
    }
  }, [user, router]);

  // Send verification code automatically when page loads (only for email verification, not password reset)
  useEffect(() => {
    const sendInitialCode = async () => {
      const targetEmail = email || sessionStorage.getItem('userEmail') || sessionStorage.getItem('resetEmail');
      
      // Only send automatic code for email verification, not password reset
      // Password reset already sends a code from the forgot-password page
      if (targetEmail && verificationType === 'email') {
        console.log('Sending initial verification code to:', targetEmail);
        try {
          const response = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, type: verificationType }),
          });
          
          const data = await response.json();
          if (response.ok) {
            console.log('Initial verification code sent successfully');
            // In development, show the code in console
            if (data.code) {
              console.log('🔑 Verification code:', data.code);
            }
          } else {
            console.error('Failed to send initial verification code:', data.error);
          }
        } catch (error) {
          console.error('Error sending initial verification code:', error);
        }
      } else if (verificationType === 'reset') {
        console.log('Password reset verification - code already sent from forgot-password page');
      }
    };

    // Send code after a short delay to ensure email is set
    const timer = setTimeout(sendInitialCode, 1000);
    return () => clearTimeout(timer);
  }, [email, verificationType]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^[0-9]*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Clear error when user starts typing
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (verificationCode?: string) => {
    const codeToSubmit = verificationCode || code.join('');
    
    if (codeToSubmit.length !== 6) {
      setErrors({ code: 'Please enter the complete 6-digit code' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get username from sessionStorage
      const username = sessionStorage.getItem('userUsername');
      
      // Verify the code with our custom API
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: codeToSubmit,
          type: verificationType,
          username: username
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      console.log('Verification successful:', data);
      
      if (verificationType === 'reset') {
        // Store the verification code for password reset
        sessionStorage.setItem('resetCode', codeToSubmit);
        // Redirect to reset password page
        router.push('/reset-password');
      } else {
        // Store user data in sessionStorage for profile page
        if (data.user) {
          sessionStorage.setItem('userEmail', data.user.email);
          // Only set userName if a proper display_name exists; avoid overwriting with raw email
          const existingName = sessionStorage.getItem('userName');
          const verifiedDisplayName = data.user.profile?.display_name;
          if (verifiedDisplayName && verifiedDisplayName.trim().length > 0) {
            sessionStorage.setItem('userName', verifiedDisplayName);
          } else if (!existingName) {
            // Derive a friendlier fallback from email local-part if nothing set yet
            const localPart = (data.user.email || '').split('@')[0] || '';
            sessionStorage.setItem('userName', localPart);
          }
          sessionStorage.setItem('userUsername', data.user.profile?.username || sessionStorage.getItem('userUsername') || '');
          console.log('✅ User data stored in sessionStorage (email and name preserved appropriately).');
        }
        
        // Wait a moment for the cookie to be set, then redirect
        setTimeout(() => {
          router.push('/profile');
        }, 500);
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setTimeLeft(30);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    setErrors({});
    
    try {
      const targetEmail = email;
      
      // Call the send verification API
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: targetEmail,
          type: verificationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      console.log('Code resent successfully');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to resend code. Please try again.' });
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

      {/* Verification Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">
          {verificationType === 'reset' ? 'Verify reset code' : 'Verify your email'}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {verificationType === 'reset' 
            ? `We sent a verification code to ${email}` 
            : 'We sent a code to your email address'
          }
        </p>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Code Input Fields */}
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="w-12 h-12 text-center text-2xl font-bold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
              />
            ))}
          </div>

          {/* Code Error */}
          {errors.code && (
            <div className="text-red-500 text-sm text-center">{errors.code}</div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}

          {/* Verify Button */}
          <button 
            type="submit" 
            disabled={isLoading || code.join('').length !== 6}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : (verificationType === 'reset' ? 'Verify & Continue' : 'Verify Code')}
          </button>
        </form>

        {/* Resend Section */}
        <div className="text-center text-sm mt-6">
          <p className="text-gray-600">
            Didn&apos;t receive the code?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-orange-600 hover:underline cursor-pointer"
              >
                Send it again
              </button>
            ) : (
              <span>Wait <span className="font-bold">{timeLeft}</span> seconds</span>
            )}
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center text-sm mt-4">
          <Link href="/login" className="text-orange-600 hover:underline flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
