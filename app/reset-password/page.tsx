'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    // Reset password with API
    try {
      console.log('Password reset attempt:', formData);
      
      // Get email and code from session storage (set during verification)
      const email = sessionStorage.getItem('resetEmail');
      const code = sessionStorage.getItem('resetCode');
      
      if (!email || !code) {
        throw new Error('Missing verification data. Please restart the password reset process.');
      }
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      
      console.log('Password reset successful');
      
      // Clear session storage
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetCode');
      
      // Redirect to login page after successful reset
      router.push('/login');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrors({ general: error.message || 'Password reset failed. Please try again.' });
    } finally {
      setIsLoading(false);
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

      {/* Reset Password Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">Reset your password</h1>
        <p className="text-gray-600 text-center mb-8">Enter your new password below</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Field */}
          <div className="input-group">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="New password"
                minLength={8}
                value={formData.password}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="input-group">
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="password_confirmation" 
                placeholder="Confirm new password"
                minLength={8}
                value={formData.password_confirmation}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password_confirmation && (
              <div className="text-red-500 text-sm mt-1">{errors.password_confirmation}</div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}

          {/* Reset Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting password...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
