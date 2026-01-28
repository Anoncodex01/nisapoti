'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    // Login with new JWT-based authentication
    try {
      console.log('Login attempt:', formData);
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful:', data);

      // Check if profile is complete and redirect accordingly
      if (data.user?.profile_complete) {
        router.push('/creator/dashboard');
      } else {
        router.push('/profile');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ general: error.message || 'Login failed. Please try again.' });
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

      {/* Login Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800">Welcome back</h1>
        
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

          {/* Password Field */}
          <div className="input-group">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            {errors.password && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm">{errors.general}</div>
          )}

          {/* Login Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>

          {/* Links */}
          <div className="flex justify-between text-sm mt-4">
            <Link href="/forgot-password" className="text-orange-600 hover:underline transition-colors">
              Forgot password?
            </Link>
            <Link href="/choose-username" className="text-gray-500 hover:text-orange-500 transition-colors">
              Don&apos;t have an account? <span className="underline">Sign up</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
