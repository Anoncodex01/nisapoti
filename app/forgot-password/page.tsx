'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLogo from '@/components/AuthLogo';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function ForgotPasswordPage() {
  const router = useRouter();
  // Removed old AuthContext usage
  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    // Send password reset code via our API
    try {
      console.log('Password reset request:', formData);
      const resp = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, type: 'reset' })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }
      console.log('Password reset code sent successfully');
      
      // Store email in sessionStorage for verification page
      sessionStorage.setItem('resetEmail', formData.email);
      
      // Redirect to verification page (same as email verification)
      router.push('/verify-email');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to send reset code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Logo Section */}
      <AuthLogo />

      {/* Forgot Password Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">Forgot your password?</h1>
        <p className="text-gray-600 text-center mb-8">Enter your email address and we&apos;ll send you a verification code</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              placeholder="Email address" 
              value={formData.email}
              onChange={handleInputChange}
              required 
              autoFocus 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            {errors.email && (
              <div className="text-red-500 text-sm mt-1">{errors.email}</div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}

          {/* Send Verification Code Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send verification code'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center text-sm mt-6">
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
